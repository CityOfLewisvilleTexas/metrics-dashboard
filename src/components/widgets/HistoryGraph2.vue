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

			<div v-show="!isLoading && !hasError" class="center-align history-chart">
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
	name: 'LineChart2',					// USED IN Default.vue
	components: {},
	props: {
		// compid, title, metricID, goal, min, max, animation	// also editable but it's not used currently
		config: {
			type: Object,
			required: true,
		},
		// not used currently
		saveSettings: {
			type: Object,
			required: false,
			default: null,
		},
	},
	data () {
		return {
			debug: true,
			needsMatInit: true,					// materialize init
			
			needsDraw: true,					// needs new table and chart
			needsRedraw: false,					// component is being reused, hide/clear chart until fully reset
			isDrawing: false,

			// loading/refreshing just this component history data
			needsFetch: false,					// only fetch history data as often as store refreshes 
			dataLoading: true,
			dataRefreshing: false,
			metricdata: [],
			uspFetched: null,
			fetchTimeout: null,

			needsSetup: false,
			isCalculating: false,				// setting/updating chart data

			historyChart: null,
			chartdates: [],
			chartdata: [],
		}
	},

	computed: {
			// store.state
			storeIsLoading() { return this.$store.state.isLoading },
			storeIsRefreshing() { return this.$store.state.softReloading },

		// when to show chart: initial - wait until calculating done; usp changed - wait until calculating done
		isLoading() { return (this.needsDraw || this.needsRedraw) && (this.storeIsLoading || this.dataLoading || this.needsFetch || this.needsSetup)) },
		isRefreshing() { return this.isLoading || this.storeIsRefreshing || this.dataRefreshing || this.isCalculating || this.isDrawing },

		compid(){
			if(this.config && this.config.hasOwnProperty('compid') && this.config.compid) return this.config.compid
			else return 'historygraph2'
		},
		chartID() {
			if(this.metricID) return 'history-chart-holder-' + this.metricID
			else return 'history-chart-holder'
		},

		// metric data (metricID REQUIRED in config)
		metricID(){ if(this.config && this.config.hasOwnProperty('metricID') && this.config.metricID) return this.config.metricID },
		metric() { if(!this.storeIsLoading && this.metricID) return this.$store.getters.findMetricByID({ id: this.metricID } ) },
		metricUSP(){ if(this.metric) return this.metric.uspname },
		metricType() { if(this.metric) return this.$store.getters.metricType(this.metric) },
		isQuery() { if(this.metricType) return (this.metricType.toLowerCase() == 'query') },

		// config/other setup
		configTimestamp() { if(this.config && this.config.hasOwnProperty('timestamp') return this.config.timestamp },
		title() {
			var title = ''
			if(this.config && this.config.hasOwnProperty('title') && this.config.title) title = this.config.title
			else if(this.metric) title = this.metric.realtimeshortname
			else title = 'History'
			return title
		},
		dataLabel(){
			if(this.config && this.config.hasOwnProperty('title') && this.config.title) return this.config.title
			else if(this.config && this.config.hasOwnProperty('label') && this.config.label) return this.config.label
			else if(this.metric) return this.metric.realtimeshortname
			else return 'Unknown'
		},

		errorCode(){
			var err = 0
			if(!this.metricID) err = 1
			else if(!this.storeIsLoading){
				if(!this.metric) err = 2
				else if(!this.isQuery) err = 3
				else if(!this.metricUSP) err = 4
				//else if(!this.dataLoading && !this.dataRefreshing && this.metricdata.length == 0) err = 5
			}
			return err;
		},
		hasError(){ return this.errorCode > 0 },
		hasWarning(){ return false },
		error(){
			var err = ''
			if(this.hasError){
				if(this.errorCode == 1) err = 'Config: metric ID not provided'
				else if(this.errorCode == 2) err = 'Metric not found - ID: ' + this.metricID + '\n' + this.formLink
				else if(this.errorCode == 3) err = 'Metric is not query type - ' + this.metricID + '\n' + this.formLink
				else if(this.errorCode == 4) err = 'Metric missing USP - ID: ' + this.metricID + '\n' + this.formLink
				else if(this.errorCode == 5) err = 'No Metric Data - ID: ' + this.metricID + '; USP: ' + this.metricUSP + '\n' + this.formLink
			}
			return err;
		},
		formLink() { if(this.metricID && this.hasError) return this.$store.getters.getFormLink({ id: this.metricID }) },
	},

	watch: {
		// when store is done refreshing (including initial loading), set needsFetch (also handles if store isn't loaded on mount)
		storeIsRefreshing:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('storeIsRefreshing')
				if(!newVal && oldVal) this.needsFetch = true			// triggers watch to fetch data
			},
		},
		// only fetch once for all needsFetch = true until fetch has completed or draw is cancelled (because of change)
		needsFetch:{
			immediate: false,
			handler(newVal, oldVal) {
				if(newVal && !oldVal){
					if(this.debug) console.log('needsFetch')
					this.fetchMetric()
				}
			},
		},
		// only calc once for all needsSetup = true until calc has completed or draw is cancelled (because of change)
		needsSetup:{
			immediate: false,
			handler(newVal, oldVal){
				if(newVal && !oldVal){
					if(this.debug) console.log('needsSetup')
					this.calculateDatesForChart(this.metricdata, this.uspFetched)			// followed by setupChartData
				}
			},
		},

		// when usp changes (if component recycled), reset/hide chart
		metricUSP:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('metricUSP changed')
				this.isDrawing = false						// stop drawing, won't continue fetching, drawing chart, or updating chart
				this.needsRedraw = true
				this.needsFetch = false						// ensure watcher will be called on init
				this.init()

				/*if(this.historyChart) this.historyChart.reset()

				this.clearChartdata()
				this.needsRedraw = true
				if(newVal) this.needsFetch = true			// triggers watch to fetch data
				else{
					this.dataLoading = false
					this.dataRefreshing = false				// triggers dataRefreshing watch, will clear chart
				}*/
			},
		},
		// log errors
		error:{
			immediate: true,
			handler(newVal, oldVal) {
				if(newVal) console.error(this.error)
			},
		},
		// debug only
		configTimestamp:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.warn('configTimestamp changed')
			},
		},
	},

	// START
	mounted() {
		if(this.debug) console.log('Mounted')
		this.init()
	},
	beforeDestroy() {
		if(this.debug) console.log('Destroy')
		this.clearFetchTimeout()
		this.destroyChart()
		// destroy materialize
		$('.tooltipped').tooltip('destroy')
	},

	methods: {
		init(){
			if(this.debug) console.log('init')
			if(this.needsMatInit) this.initMaterialize()

			this.clearFetchTimeout()

// DOES CHART NEED TO BE DESTROYED WHEN REUSED?
			this.destroyChart()
			this.needsDraw = true

			this.dataLoading = true
			this.metricdata = []
			this.clearChartData()

			this.needsFetch = true		// trigger watcher to fetch data

			/*if(!this.storeIsRefreshing && this.metricUSP) this.fetchData()
			else if(!this.storeIsRefreshing && !this.metricUSP){
				this.dataLoading = false
				this.dataRefreshing = false
			}*/
		},
		initMaterialize() {
			$('.tooltipped').tooltip()
			this.needsMatInit = false
		},

		// fetch metric history data (handles no metricUSP)
		fetchData() {
			// needsFetch = true, watcher is what calls this method

			if(this.metricUSP){
				if(this.debug) console.log('fetchData - calling metricUSP')
				this.isDrawing = true
				this.dataRefreshing = true
				var _usp = this.metricUSP

				axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
					uspName: _usp,
					DetOrAvg: 'AGG'
				}).then(results => {
					// confirm drawing hasn't been cancelled and metricUSP still matches returned data
					if(if(this.isDrawing && this.metricUSP == _usp){){
						this.uspFetched = _usp
						if (results.data[0]) this.metricdata = results.data[0]
						else this.metricdata = []
						this.dataLoading = false
						this.dataRefreshing = false
						this.needsSetup = true				// trigger watcher to setup (or clear) chart
						this.needsFetch = false
					}
				}).catch(function(error){
					console.error('ERROR fetching history - ' + this.metricUSP + '\n' + error);
					// confirm drawing hasn't been cancelled and metricUSP still matches attempt
					if(this.isDrawing && _usp == this.metricUSP){
						// if chart not already drawn with previous data, try again on timeout
						if((this.needsDraw || this.needsRedraw) && this.isOpen){
							this.fetchTimeout = setTimeout(this.fetchData, 2000);
						}
						// else, still technically needsFetch, but try again on next refresh/modal open
						else{
							this.dataLoading = false
							this.dataRefreshing = false
							this.needsFetch = false					// set false so next open/store refresh will trigger
							this.isDrawing = false
						}
					}
				})
			}
			// no usp => clear data
			else{
				this.uspFetched = this.metricUSP
				this.metricdata = []
				this.dataLoading = false
				this.dataRefreshing = false
				this.needsSetup = true			// trigger watcher to clear chart
				this.needsFetch = false
			}
		},
		clearFetchTimeout(){
			if(this.fetchTimeout) this.fetchTimeout = clearTimeout(this.fetchTimeout)
			this.dataLoading = false
			this.dataRefreshing = false
		},

		// calculates date labels for chart, handles no data
		calculateDatesForChart(_data, _usp) {
			if(this.debug) console.log('calculateDatesForChart')

			if(this.metricdata && this.metricdata.length > 0){
				// not necessary for single line chart
				/*
					var dates = this.metricdata.map(row => row.date)
					// gets rid of duplicates?
					this.chartdates = dates.filter((item, pos) => { return dates.indexOf(item) == pos })
				*/
				this.chartdates = this.metricdata.map(row => row.date)

				// fixes any gaps in data & sorts
				this.chartdata = this.fillInGaps(this.metricdata, this.chartdates, false)
			}
			else{
				this.metricdata = []
				this.chartdates = []
				this.chartdata = []
			}

			this.setupChartData(_data, _usp)
		},

		// set up data to go into line chart, handles no data to clear chart
		setupChartData(_data, _dates, _usp) {
			// confirm drawing hasn't been cancelled
			if(this.isDrawing){
				if(this.debug) console.log('setupChartData')

				var newlabels = _dates.map(date => Moment.utc(date).format('YYYY-MM-DD')).sort()
				var newdata = _data.map(row => row.value)
				var newgoaldata = (this.config.hasOwnProperty('goal')) ? _data.map(row => this.config.goal) : null
				var newmin = this.config.hasOwnProperty('min') ? Math.min(this.config.min, Math.min(..._data.map(row => row.value))) : Math.min(..._data.map(row => row.value))
				var newmax = this.config.hasOwnProperty('max') ? Math.max(this.config.max, Math.max(..._data.map(row => row.value))) : Math.max(..._data.map(row => row.value))

				// only draw once, check that data exists
				if(this.needsDraw && newdata.length > 0){
					var config = {
						type: 'line',
						data: {
							labels: newlabels,
							datasets: [
								{
									label: this.dataLabel,
									backgroundColor: 'rgba(0,191,165 ,.3)',
									borderColor: 'rgba(0,191,165 ,1)',
									data: newdata,
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
								duration: this.config.anim ? this.config.anim : 1500
							}
						}
					}

					if (this.config.hasOwnProperty('goal')) {
						config.data.datasets.push({
							label: 'Goal',
							backgroundColor: 'transparent',
							borderColor: 'red',
							data: newgoaldata,
							spanGaps: false,
							pointRadius: 0
						})
					}

					var ctx = document.querySelector('#' + this.compid + ' canvas.cvs')
					Vue.nextTick(() => { this.drawChart(ctx, config, _usp) })
				}
				// if chart has been created
				else if(!this.needsDraw){
					if(newdata.length > 0){
						if(this.historyChart == null) console.error('historyChart null')
						else{
							if(this.debug) console.log('update chart')
							this.historyChart.data.labels = newlabels

							this.historyChart.data.datasets[0].data = newdata
							this.historyChart.data.datasets[0].label = this.dataLabel

							if(this.config.hasOwnProperty('goal')) this.historyChart.data.datasets[1].data = newgoaldata
							
							this.redrawChart(_usp)
						}
					}
					// destroy chart if no data
					else{
						this.destroyChart()
						this.clearChartData()
						this.needsDraw = true
						this.isDrawing = false
					}
				}
			} else if(this.debug) console.log('setupChartData CANCELLED')
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

		// render line chart - takes a resize param so that animation only happens on initial load
		drawChart(ctx, config, _usp) {
			// confirm drawing hasn't been cancelled and metricUSP still matches data provided
			if(this.isDrawing && this.uspFetched == _usp){
				if(this.debug) console.log('drawChart')

				this.historyChart = new Chart(ctx, config)

				this.needsDraw = false
				this.isDrawing = false
			} else if(this.debug) console.log('drawChart CANCELLED')
		},
		// Charts.js call .update
		redrawChart(_usp) {
			// confirm drawing hasn't been cancelled and metricUSP still matches data provided
			if(this.isDrawing && this.uspFetched == _usp){
				if(this.debug) console.log('redrawChart')

				if(this.historyChart == null) console.error('historyChart null')
				else{
					if(!this.needsRedraw) this.historyChart.update({ duration: 0 })
					// REDRAW: include animation
					else{
						this.historyChart.update()
						this.needsRedraw = false
					}
				}
				this.isDrawing = false
			} else if(this.debug) console.log('redrawChart CANCELLED')
		},
		// resizer not needed???
		/*resizer() {
			if(!this.isDrawing){
				this.isDrawing = true
				this.redrawTable(this.uspFetched)
			}
		},*/

		clearChartData(){
			if(this.debug) console.log('clearChartData')
			this.chartdates = []
			this.chartdata = []
		},
		destroyChart() {
			if(this.historyChart){
				if(this.debug) console.log('destroyChart')
				this.historyChart.destroy()
			}
		},
	}
}
</script>

<style scoped>
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
</style>
