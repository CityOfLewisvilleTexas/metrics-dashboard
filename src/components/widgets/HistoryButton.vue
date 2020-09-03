<template>
	<div :id="getCompID('historybutton-outer')" class="outer">
		<a v-if="isQuery" :id="getCompID('historybutton')" :data-target="modalID"
			:disabled="!metricUSP && !debug"
			class="btn btn-flat history-btn white grey-text text-darken-2 waves-effect waves-dark modal-trigger">
			history
		</a>

		<div :id="modalID" class="modal white">
			<div class="modal-content">
				<p class="flow-text">{{ metric.metricname }}</p>
				<p v-show="hasError" class="flow-text">ERROR: no USP set for metric</p>
				<div v-if="isLoading" class="loader"></div>
				<div v-show="!isLoading && !hasError" class="history-graph-holder">
					<canvas :id="canvasID" class="cvs" />
				</div>
			</div>
			<div class="modal-footer">
				<a class="modal-action modal-close waves-effect waves-dark btn-flat">Done</a>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'
import Moment from 'moment'
import Chart from 'chart.js'
export default {
	name: 'HistoryButton',					// USED IN MetricCard.vue -> Details.vue
	components: {},
	props: {
		config: {	// timestamp
			type: Object,
			required: true,
		},
		metric: {
			type: Object,
			required: true,
		},
	},
	data () {
		return {
			debug: false,
			isLoading: true, 		// initial load of just this history data
			needsMatInit: true,		// materialize init
			needsDraw: true,
			isDrawing: false,
			needsRefresh: false,	// only refresh history data as often as metrics refreshes (when open, will keep same data if reopened before refreshed)

			historyChart: null,
			metricdata: [],
			calcMin: 0,
			calcMax: 0,

			isOpen: false,
			fetchTimeout: null,
		}
	},

	computed: {
		// state
		storeIsLoading() { return this.$store.state.isLoading },
		storeIsRefreshing() { return this.$store.state.softReloading },
		// getters
		primaryKey() { return this.$store.getters.psofiaVars.primaryKey },
		// getters with payload
		metricType() { return this.$store.getters.metricType(this.metric) },
		currentValue() { return this.$store.getters.metricValue({metric: this.metric}) },
		
		modalID() { return 'historybutton-modal-' + this.metricID },
		canvasID() { return 'historybutton-cvs-' + this.metricID },

		// config
		configTimestamp() { return this.config.timestamp },

		// metric props
		metricID() { return this.metric[this.primaryKey] },
		metricUSP() { return this.metric.uspname },
		isQuery() {
			if(this.metricType) return (this.metricType.toLowerCase() == 'query')
			else return false
		},
		error(){
			var err = ''
			if(!this.isQuery) err = 'Metric is not query type - ' + this.metricID
			else if(!this.metricUSP) err = 'Metric has no USP - ' + this.metricID
			return err;
		},
		hasError() {
			return this.error.length > 0
		},
	},

	watch: {
		// set needsRefresh on metrics refresh
		storeIsRefreshing:{
			immediate: false,
			handler(newVal, oldVal) {
				if(!newVal && oldVal){
					this.needsRefresh = true
					if(this.isOpen) this.fetchData()
				}
			},
		},
		// ensures that everything is reset when this component is recycled
		metricUSP:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('metricUSP changed')
				this.init()
			},
		},
		hasError:{
			immediate: false,
			handler(newVal, oldVal) {
				if(newVal){
					this.loading = false
					console.error(this.error)
				}
			},
		},

		//debug
		configTimestamp:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('configTimestamp changed')
			},
		},
	},

	mounted() {
		this.init()
	},
	beforeDestroy() {
		this.clearFetchTimeout()
		this.destroyChart()
		$('#' + this.modalID).modal('destroy')
	},

	methods: {
		init() {
			this.isLoading = true
			this.isDrawing = false					// stop drawing, won't continue fetching, drawing chart, or updating chart

			if(this.needsMatInit) this.initModal()

			this.clearFetchTimeout()
			this.destroyChart()

			this.needsDraw = true
			this.needsRefresh = false
			this.metricdata = []
			this.calcmin = 0
			this.calcmax = 0

			if(this.isOpen){
				if(!this.hasError) this.fetchData()
				else $('#' + this.modalID).modal('close')
			}
		},
		initModal(){
			$('#' + this.modalID).modal({ ready: this.onModalOpen, complete: this.onModalClose })
			this.needsMatInit = false
		},
		getCompID(comp){
			return comp + '-' + this.metricID;
		},

		// fetch history data
		fetchData() {
			if(this.hasError) return
			if(this.debug) console.log('fetchData')
			this.isDrawing = true

			// fetch
			axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
				uspName: this.metricUSP,
				DetOrAvg: 'AGG'
			}).then(results => {
				if(this.isDrawing){
					this.metricdata = results.data[0].sort((a,b) => {
						if (new Date(a.date) < new Date(b.date)) return -1
						if (new Date(a.date) > new Date(b.date)) return 1
						return 0
					})
					this.isLoading = false
					this.formatDataForChart()
				}
			}).catch(error => {
				console.error('ERROR fetching data - ' + this.metricUSP + '\n' + error);
				if(this.isDrawing){
					// if no initial data for current metricUSP, try again
					if(this.needsDraw){
						this.fetchTimeout = setTimeout(this.fetchData, 2000);
					}
					// else, still needsRefresh, but try again on next open/metrics refresh
					else{
						this.isDrawing = false
					}
				}
			});
		},
		clearFetchTimeout(){
			if(this.fetchTimeout) this.fetchTimeout = clearTimeout(this.fetchTimeout)
		},

		// set up data to go into line chart
		formatDataForChart() {
			var newlabels = this.metricdata.map(row => Moment.utc(row.date).format('MM-DD-YYYY'))
			var newdata = this.metricdata.map(row => row.value)
			var newmin = Math.min(...newdata)*0.99
			var newmax = Math.max(...newdata)*1.01

			if(this.isDrawing){
				// initial draw chart
				if(this.needsDraw){
					this.calcmin = newmin
					this.calcmax = newmax

					var config = {
						type: 'line',
						data: {
							labels: newlabels,
							datasets: [
								{
									label: 'value',
									backgroundColor: 'rgba(244,67,54 ,0.2)',
									borderColor: 'rgba(244,67,54 ,1)',
									data: newdata,
									spanGaps: false,
									pointRadius: 0
								}
							],
						},
						options: {
							maintainAspectRatio: false,
							responsive: true,
							title: { display: false },
							tooltips: {
								mode: 'index',
								intersect: false
							},
							scales: {
								yAxes: [{
									ticks: {
										suggestedMin: newmin,
										suggestedMax: newmax
									},
									display: true,
									scaleLabel: { display: false }
								}],
								xAxes: [{
									gridLines: { display: false }
								}]
							},
							animation: { duration: 1500 }
						}
					}
					//Vue.nextTick(() => { this.drawChart(config) })
					this.drawChart(config)
				}
				// update existing chart
				else{
					if(this.historyChart == null) console.error('historyChart null')
					else{
						this.historyChart.data.labels = config_labels
						this.historyChart.data.datasets[0].data = config_data
						if(this.calcmin != newmin || this.calcmax != newmax){
							this.historyChart.options.scales.yAxes[0] = [{
								ticks: { suggestedMin: newmin, suggestedMax: newmax },
								display: true,
								scaleLabel: { display: false }
							}]
							this.calcmin = newmin
							this.calcmax = newmax
						}
						this.historyChart.update({ duration: 0 })
						this.needsRefresh = false
						this.isDrawing = false
					}
				}
			}

		},

		drawChart(config) {
			if(this.isDrawing){
				var ctx = document.querySelector('#' + this.canvasID)
				this.historyChart = new Chart(ctx, config)
				this.needsDraw = false
				this.isDrawing = false
			}
		},
		destroyChart(){
			if(this.historyChart) this.historyChart.destroy()
		},

		onModalOpen() {
			if(this.debug) console.log('open modal')
			this.isOpen = true
			if(this.needsDraw || this.needsRefresh) this.fetchData()
		},
		onModalClose() {
			if(this.debug) console.log('close modal')
			this.isOpen = false
			this.clearFetchTimeout()
		},
	}
}
</script>

<style scoped>
.outer {
	height: 100%;
}

.history-btn{
	border: 3px solid rgba(0,0,0,0.6);
	padding: 8px 8px;
	border-radius: 1rem;
	line-height: 2rem;
	margin-bottom: 8px;
	overflow: hidden;
	line-height: 1.2rem;
	height: auto;
	display: inline-block;
}
.history-btn i {
	margin: 0 8px 0 -4px;
}

canvas {
    width: 100%;
    min-height: 300px;
    height: 306px;
}

.content {
	border-radius: 0 0 5px 5px;
	height: 100%;
	padding: 16px;
	padding-bottom: 16px !important;
	position: relative;
}
.title + .content {
	padding-top: 0;
	padding-bottom: 8px;
}
.title {
	font-size: 1.4rem;
	font-family: 'Product Sans';
	padding: 8px;
	border-radius: 5px 5px 0 0;
}


.loader {
	width: 100%;
    min-height: 300px;
    height: 306px;
    border: 6px solid #D1C4E9;
    border-top: 6px solid #673AB7;
    border-radius: 50%;
    animation: spin 2s linear infinite;
    display: inline-block;
    margin: 148px;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

</style>
