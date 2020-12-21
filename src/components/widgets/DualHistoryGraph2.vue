<template>
	<div :id="compid + '-outer'" class="card outer">

		<div class="title grey lighten-2 grey-text text-darken-1">
			{{ title }}
			<i v-if="hasError || hasWarning" class="material-icons darken-1"
				:class="{'red': hasError, 'orange': hasWarning}">{{hasError ? 'error' : 'warning'}}</i>
			<i v-if="config.why" :data-tooltip="config.why" data-delay="0"
				class="material-icons right tooltipped pointy">help</i>
		</div>

		<div :id="compid" class="content center-align"
			:class="{'grey': hasError, 'lighten-4': hasError, 'white': !hasError}">
			
			<div v-if="isLoading" class="loader"></div>

			<div v-show="!isLoading && !hasError">
				<canvas :id="chartID"  class="cvs chart-holder"></canvas>
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
	name: 'DualLineChart2',					// USED IN Default.vue
	components: {},
	props: {
		// compid, title, metricID_1, metricID_2, min, anim
		config: {
			type: Object,
			required: true,
		},
	},
	data () {
		return {
			debug: false,
			needsMatInit: true,							// materialize init
			
			needsDraw: true,							// needs new table and chart
			needsRedraw1: false, needsRedraw2: false,	// component is being reused, hide/clear chart
			isDrawing: false,

			// loading/refreshing just this component history data
			needsFetch1: false, needsFetch2: false,
			dataLoading1: true, dataLoading2: true,
			dataRefreshing1: false, dataRefreshing2: false,

			isCalculating: false,						// setting/updating chart data

			historyChart: null,
			chartdates: [],
			chartdata1: [], chartdata2: [],

			metricdata1: [], metricdata2: [],
			metric1Timeout: null, metric2Timeout: null,
		}
	},

	computed: {
			// store.state
			storeIsLoading() { return this.$store.state.isLoading },
			storeIsRefreshing() { return this.$store.state.softReloading },

		dataLoading() { return this.dataLoading1 || this.dataLoading2 },
		dataRefreshing() { return this.dataRefreshing1 || this.dataRefreshing2 },
		needsRedraw() { return this.needsRedraw1 || this.needsRedraw2 },

		readyToDraw() { return !this.storeIsLoading && !this.dataLoading && !this.isCalculating },
		isLoading() { return this.storeIsLoading || this.dataLoading || ((this.needsDraw || this.needsRedraw) && this.isCalculating) },
		isRefreshing() { return this.storeIsRefreshing || this.dataRefreshing || this.isCalculating || this.isDrawing },

		compid() {
			if(this.config && this.config.hasOwnProperty('compid') && this.config.compid) return this.config.compid
			else return 'dualhistory2'
		},

		metricID1() { if(this.config && this.config.hasOwnProperty('metricID_1') && this.config.metricID_1) return this.config.metricID_1 },
		metricID2() { if(this.config && this.config.hasOwnProperty('metricID_2') && this.config.metricID_2) return this.config.metricID_2 },
		metric1() {
			if(!this.storeIsLoading && this.metricID1) return this.$store.getters.findMetricByID({ id: this.metricID1 })
			else return null
		},
		metric2() {
			if(!this.storeIsLoading && this.metricID2) return this.$store.getters.findMetricByID({ id: this.metricID2 })
			else return null
		},
		metricusp1() {
			if(this.metric1) return this.metric1.uspname
			else return null
		},
		metricusp2() {
			if(this.metric2) return this.metric2.uspname
			else return null
		},

		title() {
			var title = ''
			if(this.config && this.config.hasOwnProperty('title') && this.config.title) title = this.config.title
			else title = 'History'
			if(this.dataLoading) title += ' (Loading...)'
			return title
		},
		datalabel1() {
			if(this.config && this.config.hasOwnProperty('label1') && this.config.label1) return this.config.label1
			else if(this.metric1) return this.metric1.realtimeshortname
			else return 'Unknown'
		},
		datalabel2() {
			if(this.config && this.config.hasOwnProperty('label2') && this.config.label2) return this.config.label2
			else if(this.metric2) return this.metric2.realtimeshortname
			else return 'Unknown'
		},

		errorCode1() {
			var err = 0
			if(!this.metricID1) err = 1
			else if(!this.storeIsLoading){
				if(!this.metric1) err = 2
				else if(!this.metricusp1) err = 3
				else if(!this.dataRefreshing1){
					if(this.metricdata1.length == 0) err = 4
				}
			}
			return err;
		},
		errorCode2() {
			var err = 0
			if(!this.metricID2) err = 1
			else if(!this.storeIsLoading){
				if(!this.metric2) err = 2
				else if(!this.metricusp2) err = 3
				else if(!this.dataRefreshing2 && this.metricdata2.length == 0) err = 4
			}
			return err;
		},
		hasError1() { return this.errorCode1 > 0 },
		hasError2() { return this.errorCode2 > 0 },
		hasError() { return this.hasError1 && this.hasError2 },
		hasWarning() { return !this.hasError && (this.hasError1 || this.hasError2) },
		error1(){
			var err = ''
			if(this.hasError1){
				if (this.errorCode1 == 1) err = 'Config: metric ID not provided (1)'
				else if (this.errorCode1 == 2) err = 'Metric not found (1) - ID: ' + this.metricID1 + '\n' + this.formLink1
				else if (this.errorCode1 == 3) err = 'Metric missing USP (1) - ID: ' + this.metricID1 + '\n' + this.formLink1
				else if (this.errorCode1 == 4) err = 'No Metric Data (1) - ID: ' + this.metricID1 + '; USP: ' + this.metricusp1 + '\n' + this.formLink1
			}
			return err;
		},
		error2(){
			var err = ''
			if(this.hasError2){
				if (this.errorCode2 == 1) err = 'Config: metric ID not provided (2)'
				else if (this.errorCode2 == 2) err = 'Metric not found (2) - ID: ' + this.metricID2 + '\n' + this.formLink2
				else if (this.errorCode2 == 3) err = 'Metric missing USP (2) - ID: ' + this.metricID2 + '\n' + this.formLink2
				else if (this.errorCode2 == 4) err = 'No Metric Data (2) - ID: ' + this.metricID2 + '; USP: ' + this.metricusp2 + '\n' + this.formLink2
			}
			return err;
		},
		formLink1() { if(this.metricID1 && this.hasError1) return this.$store.getters.getFormLink({ id: this.metricID1} ) },
		formLink2() { if(this.metricID2 && this.hasError2) return this.$store.getters.getFormLink({ id: this.metricID2} ) },
	},

	watch: {
		storeIsRefreshing:{
			immediate: false,
			handler(newVal, oldVal) {
				if(!newVal && oldVal){
					if(this.metricusp1) this.fetchMetric1()
					if(this.metricusp2) this.fetchMetric2()
				}
			},
		},
		// after both metric data has returned, calculate & setup chart
		dataRefreshing:{
			immediate: false,
			handler(newVal, oldVal) {
				if(!newVal && oldVal) this.calculateDatesForChart()
			},
		},
		// ensures that isloading set when this component is recycled
		metricusp1:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('metricusp1 changed')
				if(this.historyChart) this.historyChart.reset()
				this.clearChartdata1()
				if(newVal && newVal != oldVal){
					this.needsRedraw1 = true
					this.fetchMetric1()
				}
				// will clear chart if exists
				else if(!newVal){
					this.dataLoading1 = false
					this.dataRefreshing1 = false		// will trigger dataRefreshing watch
				}
			},
		},
		metricusp2:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('metricusp2 changed')
				if(this.historyChart) this.historyChart.reset()
				this.clearChartdata2()
				if(newVal && newVal != oldVal){
					this.needsRedraw2 = true
					this.fetchMetric2()
				}
				// will clear chart if exists
				else if(!newVal){
					this.dataLoading2 = false
					this.dataRefreshing2 = false		// will trigger dataRefreshing watch
				}
			},
		},
		// log errors
		error1:{
			immediate: true,
			handler(newVal, oldVal) {
				if(newVal) console.error(this.error1)
			},
		},
		error2:{
			immediate: true,
			handler(newVal, oldVal) {
				if(newVal) console.error(this.error2)
			},
		},
	},

	mounted() {
		if(this.debug) console.log('Mounted')
		this.init()
	},
	beforeDestroy() {
		if(this.debug) console.log('Destroy')
		this.clearChartdata1()
		this.clearChartdata2()
		if(this.historyChart) this.historyChart.destroy()
		$('.tooltipped').tooltip('destroy')
	},

	methods: {
		init(){
			if(this.debug) console.log('init')
			if(this.needsMatInit) this.initMaterialize()
			
			if(!this.storeIsRefreshing){
				if(this.metricusp1) this.fetchMetric1()
				else{
					this.dataLoading1 = false
					this.dataRefreshing1 = false
				}
				if(this.metricusp2) this.fetchMetric2()
				else{
					this.dataLoading1 = false
					this.dataRefreshing1 = false
				}
			}
		},
		initMaterialize() {
			$('.tooltipped').tooltip()
			this.needsMatInit = false
		},

		// fetch metric data
		fetchMetric1() {
			if(this.debug) console.log('fetchMetric1')
			this.dataRefreshing1 = true

			// fetch
			axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
				uspName: this.metricusp1,
				DetOrAvg: 'AGG'
			}).then(results => {
				this.metricdata1 = results.data[0]
				this.dataLoading1 = false
				this.dataRefreshing1 = false
			}).catch(function(error){
				console.error('Webservice not returned - ' + this.metricusp1)
				// if already have data, wait for next refresh to try again
				if(this.metricdata1.length > 0){
					this.dataLoading1 = false
					this.dataRefreshing1 = false
				}
				else{
					this.metric1Timeout = setTimeout(this.fetchMetric1, 2000)
				}
			})
		},

		// fetch metric data
		fetchMetric2(from) {
			if(this.debug) console.log('fetchMetric2')
			this.dataRefreshing2 = true

			// fetch
			axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
				uspName: this.metricusp2,
				DetOrAvg: 'AGG'
			}).then(results => {
				this.metricdata2 = results.data[0]
				this.dataLoading2 = false
				this.dataRefreshing2 = false
			}).catch(function(error){
				console.error('Webservice not returned - ' + this.metricusp2)
				if(this.metricdata2.length > 0){
					this.dataLoading2 = false
					this.dataRefreshing2 = false
				}
				else{
					this.metric2Timeout = setTimeout(this.fetchMetric2, 2000)
				}
			})
		},

		calculateDatesForChart() {
			if(this.debug) console.log('calculateDatesForChart')

			if(this.metricdata1 && this.metricdata1.length > 0 && this.metricdata2 && this.metricdata2.length > 0){
				var dates = this.metricdata1.map(row => row.date).concat(this.metricdata2.map(row => row.date))

				// gets rid of duplicates?
				this.chartdates = dates.filter((item, pos) => { return dates.indexOf(item) == pos })

				// fixes any gaps in data & sorts
				this.chartdata1 = this.fillInGaps(this.metricdata1, this.chartdates, true)
				this.chartdata2 = this.fillInGaps(this.metricdata2, this.chartdates, true)
			}
			else if(this.metricdata1 && this.metricdata1.length > 0){
				this.metricdata2 = []
				this.chartdata2 = []

				this.chartdates = this.metricdata1.map(row => row.date)
				this.chartdata1 = this.fillInGaps(this.metricdata1, this.chartdates, false)
			}
			else if(this.metricdata2 && this.metricdata2.length > 0){
				this.metricdata1 = []
				this.chartdata1 = []

				this.chartdates = this.metricdata2.map(row => row.date)
				this.chartdata2 = this.fillInGaps(this.metricdata2, this.chartdates, false)
			}
			else{
				this.metricdata1 = []
				this.metricdata2 = []
				this.chartdates = []
				this.chartdata1 = []
				this.chartdata2 = []
			}

			this.formatDataForChart(this.chartdata1, this.chartdata2, this.chartdates)
		},
		// set up data to go into line chart
		formatDataForChart(_data1, _data2, _dates) {
			if(this.debug) console.log('formatDataForChart')

			var newlabels = _dates.map(date => Moment.utc(date).format('YYYY-MM-DD')).sort()
			var newdata1 = _data1.map(row => row.value)
			var newdata2 = _data2.map(row => row.value)
			var newmin = (this.config && this.config.hasOwnProperty('min')) ? Math.min(this.config.min, Math.min(..._data1.map(row => row.value))*0.99, Math.min(..._data2.map(row => row.value))*0.99) : Math.min(Math.min(..._data1.map(row => row.value))*0.99, Math.min(..._data2.map(row => row.value))*0.99)
			var newmax = Math.max(Math.max(..._data1.map(row => row.value))*1.01, Math.max(..._data2.map(row => row.value))*1.01)

			// only draw once, check that data exists
			if(this.needsDraw && (newdata1.length > 0 || newdata2.length > 0)){
				var config = {
					type: 'line',
					data: {
						labels: newlabels,
						datasets: [
							{
								label: this.datalabel1,
								backgroundColor: 'rgba(33,150,243 ,0.2)',
								borderColor: 'rgba(33,150,243 ,1)',
								data: newdata1,
								spanGaps: false,
							},
							{
								label: this.datalabel2,
								backgroundColor: 'rgba(244,67,54 ,0.2)',
								borderColor: 'rgba(244,67,54 ,1)',
								data: newdata2,
								spanGaps: false,
							}
						],
					},
					options: {
						maintainAspectRatio: false,
						responsive: true,
						title: {
							display: false
						},
						tooltips: {
							mode: 'index',
							intersect: false
						},
						scales: {
							yAxes: [{
								ticks: {
									suggestedMin: newmin,
									suggestedMax: newmax,
								},
								display: true,
								scaleLabel: {
									display: false,
									labelString: 'Minutes'
								},
								gridLines: {
									drawBorder: false
								}
							}],
							xAxes: [{
								gridLines: {
									display: false,
									drawBorder: false
								}
							}]
						},
						animation: {
							duration: (this.config && this.config.hasOwnProperty('anim')) ? this.config.anim : 1500
						}
					}
				}
				var ctx = document.querySelector('#' + this.compid + ' canvas.cvs')
				Vue.nextTick(() => { this.drawLineChart(ctx, config) })
			}
			else if(!this.needsDraw){
				if(newdata.length > 0 || newdata2.length > 0){
					if(this.historyChart == null) console.error('historyChart null')
					else{
						if(this.debug) console.log('update chart')
						this.historyChart.data.labels = newlabels

						this.historyChart.data.datasets[0].data = newdata1
						this.historyChart.data.datasets[0].label = this.dataLabel1

						this.historyChart.data.datasets[1].data = newdata2
						this.historyChart.data.datasets[0].label = this.dataLabel2

						if(!this.needsRedraw) this.historyChart.update({ duration: 0 })
						else{
							this.historyChart.update()
							this.needsRedraw1 = false
							this.needsRedraw2 = false
						}
					}
				}
				// destroy chart if no data
				else{
					if(this.historyChart) this.historyChart.destroy()
					this.chartdates = []
					this.needsDraw = true
				}
			}
		},

		// render line chart - takes a resize param so that animation only happens on initial load
		drawLineChart(ctx, config) {
			if(this.debug) console.log('draw chart')
			this.historyChart = new Chart(ctx, config)
			this.needsDraw = false
		},

		fillInGaps(arr, dates, needsFill) {
			if(needsFill){
				dates.forEach(date => {
					if (arr.map(row=>row.date).indexOf(date) == -1) arr.push({ date: date, value: null, lastimported: null })
				})
			}
			return arr.sort((a,b) => {
				if (a.date < b.date) return -1
				if (a.date > b.date) return 1
				return 0
			})
		},
		clearChartdata1(){
			if(this.debug) console.log('clearChartdata1')
			this.dataLoading1 = true
			this.dataRefreshing1 = true
			if(this.metric1Timeout) clearTimeout(this.metric1Timeout)
			this.metricdata1 = []
			this.chartdata1 = []
		},
		clearChartdata2(){
			if(this.debug) console.log('clearChartdata2')
			this.dataLoading2 = true
			this.dataRefreshing2 = true
			if(this.metric2Timeout) clearTimeout(this.metric2Timeout)
			this.metricdata2 = []
			this.chartdata2 = []
		},
	}
}
</script>

<style scoped>
.pointy {
	cursor: pointer
}
.outer {
	height: 100%;
}
canvas {
    width: 100%;
    height: 100%;
}
.content {
	/*height: 100%;*/
	height: calc(100% - 48px);
	padding: 16px;
	/*position: relative;*/
}
.line-chart-container {
	height: 100%;
}
canvas {
    width: 100%;
    height: 100%;
}
.content {
	/*height: 100%;*/
	height: calc(100% - 48px);
	padding: 16px;
	/*position: relative;*/
}
.title + .content {
	padding-top: 0;
	padding-bottom: 8px;
}
.title {
	font-size: 1.4rem;
	font-family: 'Product Sans';
	padding: 8px 16px;
}
.dropdown-button {
	position: absolute;
	top: 0;
	right: 8px;
	padding: 0;
}
.dropdown-content {
	overflow-y: scroll !important;
	overflow-x: auto !important;
}
.loader {
    border: 6px solid #D1C4E9;
    border-top: 6px solid #673AB7;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 2s linear infinite;
    display: inline-block;
    margin: 148px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
.material-tooltip {
    max-width: 600px !important;
}
</style>
