<template>
	<div :id="getCompID('detailsbutton-outer')" class="outer">

		<a v-if="isQuery" :id="getCompID('detailsbutton')" :data-target="modalID"
			:disabled="!metricUSP && !debug"
			class="btn btn-flat details-btn white grey-text text-darken-2 waves-effect waves-dark modal-trigger">
			details
		</a>

		<div :id="modalID" class="modal"
			:class="{'grey': hasError, 'lighten-4': hasError, 'white': !hasError}">
			<div class="modal-content">
				<p class="flow-text">{{ title }}</p>

				<div v-if="isLoading" class="loader"></div>

				<div v-show="!isLoading">
					
					<p v-show="hasError" class="flow-text">ERROR: no USP set for metric</p>

					<div v-show="!hasError" class="center-align details-table">
						<div :id="chartID" class="chart-holder"></div>
					</div>

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
export default {
	name: 'DetailsButton',					// USED IN MetricCard.vue -> Details.vue
	components: {},
	props: {
		// timestamp
		config: {
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
			needsMatInit2: true,			// materialize init, based on computed IDs
			setupWaiting: false,			// waiting for google charts to load

			needsDraw: true,
			needsRedraw: false,				// component is being reused, hide/clear chart until fully reset
			isDrawing: false,

			needsFetch: false,				// only refresh details data as often as store refreshes (when open, will keep same data if reopened before refreshed)
			dataLoading: true,
			dataRefreshing: false,
			metricdata: [],
			uspFetched: null,
			fetchTimeout: null,

			needsSetup: false,
			tableChart: null,
			chartdata: null,
			countHeaders: 0,
			countRows: 0,

			isOpen: false,
		}
	},

	computed: {
			// store.state
			storeIsLoading() { return this.$store.state.isLoading },
			storeIsRefreshing() { return this.$store.state.softReloading },
			googleChartsLoaded() { return this.$store.state.googleChartsLoaded },
			// store.getters
			primaryKey() { return this.$store.getters.psofiaVars.primaryKey },

		// when to show chart: initial - wait until calculating done; usp changed - wait until calculating done
		isLoading() { return this.storeIsLoading || ((this.needsDraw || this.needsRedraw) && (this.dataLoading || this.needsFetch || this.needsSetup)) },
		isRefreshing() { return this.isLoading || this.storeIsRefreshing || this.dataRefreshing || this.isDrawing },
		
		// compid calc in method, uses idForComp at end
		idForComp(){
			if(this.config && this.config.hasOwnProperty('compid') && this.config.compid) return this.config.compid
			else if(this.metricID) return this.metricID
			else return 'detailstable'
		},
		modalID() { return 'details-modal-' + this.idForComp },
		chartID() { return 'details-chart-holder-' + this.idForComp },

		// metric data (metric prop REQUIRED)
		metricID() { if(this.metric) return this.metric[this.primaryKey] },
		metricUSP() { if(this.metric) return this.metric.uspname },
		metricType() { if(this.metric) return this.$store.getters.metricType(this.metric) },
		isQuery() { if(this.metricType) return (this.metricType.toLowerCase() == 'query') },
		currentValue() { if(this.metric) return this.$store.getters.metricValue({metric: this.metric}) },

		// config/other setup
		configTimestamp() { if(this.config && this.config.hasOwnProperty('timestamp')) return this.config.timestamp },
		title() {
			var title = ''
			if(this.config && this.config.hasOwnProperty('title') && this.config.title) title = this.config.title
			else if(this.metric) title = this.metric.metricname
			else title = 'Details'
			return title
		},

		errorCode(){
			var err = 0
			if(!this.metric) err = 1
			// don't need to check storeLoading, wouldn't receive metric prop if so
			else if(!this.metricID) err = 2
			else if(!this.isQuery) err = 3
			else if(!this.metricUSP) err = 4
			else if(!this.dataLoading && !this.dataRefreshing && this.metricdata.length == 0) err = 5

			return err;
		},
		hasError(){ return this.errorCode > 0 },
		hasWarning(){ return false },
		error(){
			var err = ''
			if(this.hasError){
				if(this.errorCode == 1) err = 'Prop: Metric not provided'
				else if(this.errorCode == 2) err = 'MetricID missing'
				else if(this.errorCode == 3) err = 'Metric is not query type - ' + this.metricID + '\n' + this.formLink
				else if(this.errorCode == 4) err = 'Metric missing USP - ' + this.metricID + '\n' + this.formLink
				else if(this.errorCode == 5) err = 'No Metric Data - ID: ' + this.metricID + '; USP: ' + this.metricUSP + '\n' + this.formLink
			}
			return err;
		},
		formLink() { if(this.metricID && this.hasError) return this.$store.getters.getFormLink({ id: this.metricID }) },
	},

	watch: {
		// setup after charts load (if not loaded on mount)
		googleChartsLoaded:{
			immediate: false,
			handler(newVal, oldVal) {
				if(newVal && this.needsDraw && this.setupWaiting){
					this.setupChartData(this.metricdata, this.uspFetched)
				}
			}
		},
		// when store is done refreshing (including initial load), set needsFetch (also handles if store isn't loaded on mount)
		storeIsRefreshing:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('storeIsRefreshing')
				if(!newVal && oldVal) this.needsFetch = true			// triggers watch to fetch data if open
			},
		},
		// only fetch once for all needsFetch = true until fetch has completed or draw is cancelled (because of change)
		needsFetch:{
			immediate: false,
			handler(newVal, oldVal) {
				if(newVal && !oldVal){
					if(this.debug) console.log('needsFetch')
					if(this.isOpen) this.fetchMetric()
				}
			},
		},
		// IF charts are loaded, only calc once for all needsSetup = true until calc has completed or draw is cancelled (because of change)
		needsSetup:{
			immediate: false,
			handler(newVal, oldVal){
				if(newVal && !oldVal){
					if(this.debug) console.log('needsSetup')
					if(this.googleChartsLoaded){									// will finish drawing even if modal closes
						this.setupChartData(this.metricdata, this.uspFetched)
					}
					else this.setupWaiting = true
				}
			},
		},
		// only call init once for all needsRedraw = true until draw has completed or draw is cancelled (because of change)
		needsRedraw:{
			immediate: false,
			handler(newVal, oldVal) {
				if(newVal && !oldVal){
					if(this.debug) console.log('needsRedraw')
					this.init()
				}
			},
		},

		// only fetch once for all needsFetch = true until fetch has completed or draw is cancelled (because of change)
		isOpen:{
			immediate: false,
			handler(newVal, oldVal) {
				if(newVal && !oldVal){
					if(this.debug) console.log('modal opened')
					if(this.needsFetch) this.fetchMetric()
				}
				else if(!newVal && oldVal){
					if(this.debug) console.log('modal closed')
					this.clearFetchTimeout()							// cancel fetching
				}
			},
		},

		// when usp changes (if component recycled), reset/hide chart
		metricUSP:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('metricUSP changed')
				this.isDrawing = false									// stop drawing, won't continue fetching, setting up, or drawing/updating chart
				this.needsFetch = false									// ensure watcher will be called on init
				this.needsRedraw = true									// triggers watch to call init again
			},
		},
		// handle computed id changing when component is reused
		chartID:{														// can't be immediate, element doesn't exist until after mount
			immediate: false,
			handler(newVal, oldVal) {
				if(oldVal){
					this.isDrawing = false								// stop drawing, won't continue fetching, setting up, or drawing/updating chart
					this.destroyChart()									// destroy old chart because element has changed ids?
					this.needsFetch = false								// ensure watcher will be called on init
					this.needsDraw = true								// bc chart was destroyed
					this.needsRedraw = true								// triggers watch to call init again
				}
			},
		},
		// handle materialize computed id changing when component is reused
		modalID:{
			immediate: false,											// can't be immediate, element doesn't exist until after mount
			handler(newVal, oldVal) {
				// destroy and set needs init again
				if(oldVal){
					$('#' + oldVal).modal('destroy')
					this.needsMatInit2 = true
				}
				if(newVal && newVal != oldVal){
					if(this.needsMatInit2) this.initMaterialize2()		// init materialize (don't rely on init? fine to call multiple times)
				}
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

	mounted() {
		if(this.debug) console.log('Mounted')
		this.init()
	},
	beforeDestroy() {
		if(this.debug) console.log('Destroy')
		this.clearFetchTimeout()
		this.destroyChart()
		// destroy materialize
		$('#' + this.modalID).modal('destroy')
	},

	methods: {
		init() {
			if(this.debug) console.log('init')
			if(this.needsMatInit2) this.initMaterialize2()

			this.clearFetchTimeout()
			this.clearMetricData()
			this.clearChartData()

			this.needsFetch = true		// trigger watcher to fetch data if open
		},
		initMaterialize2(){
			if(this.modalID){
				$('#' + this.modalID).modal({ ready: this.onModalOpen, complete: this.onModalClose })
				this.needsMatInit2 = false
			}
		},

		getCompID(comp){ return comp + '-' + this.idForComp; },

		// fetch metric details data (handles no metricUSP)
		fetchData() {
			// needsFetch = true, isOpen = true, watcher on both is what calls this method
			if(this.metricUSP){
				if(this.debug) console.log('fetchData - calling metricUSP')
				this.isDrawing = true
				this.dataRefreshing = true
				var _usp = this.metricUSP

				axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
					uspName: _usp,
					DetOrAvg: 'DETAILS'
				}).then(results => {
					// confirm drawing hasn't been cancelled and metricUSP still matches returned data
					if(this.isDrawing && this.metricUSP == _usp){
						this.uspFetched = _usp
						if (results.data[0]) this.metricdata = results.data[0]
						else this.metricdata = []
						this.dataLoading = false
						this.dataRefreshing = false
						this.needsSetup = true				// trigger watcher to setup (or clear) chart
						this.needsFetch = false
					}
				}).catch(error => {
					console.error('ERROR fetching details - ' + this.metricUSP + '\n' + error);
					// confirm drawing hasn't been cancelled and metricUSP still matches attempt
					if(this.isDrawing && this.metricUSP == _usp){
						// if chart not already drawn with previous data and modal is open, try again on timeout
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
				});
			}
			// no usp => clear data
			else{
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

		// set up data to go into table chart, handles no data to clear chart
		setupChartData(_data, _usp) {
			// confirm drawing hasn't been cancelled and metricUSP still matches data provided
			if(this.isDrawing && this.uspFetched == _usp){
				if(this.debug) console.log('setupChartData')

				if(_data.length > 0){
					if(this.needsDraw || !this.chartdata){
						if(this.debug) console.log('setupChartData - new')
						this.chartdata = new google.visualization.DataTable()
					}
					else{
						if(this.debug) console.log('setupChartData - update')
						this.chartdata.removeRows(0, this.countRows)
						this.chartdata.removeColumns(0, this.countHeaders)
					}

					this.countHeaders = 0
					// add each header
					for(var prop in _data[0]) {
						if(_data[0].hasOwnProperty(prop)) {
							this.chartdata.addColumn('string', prop)
							this.countHeaders++
						}
					}

					// fill in the chartdata
					this.countRows = 0
					_data.forEach(entry => {
						var row = []
						for (var prop in entry) {
							if (entry.hasOwnProperty(prop)) {
								row.push(String(entry[prop]))
							}
						}
						this.chartdata.addRow(row)
						this.countRows++
					})

					if(this.needsDraw || !this.tableChart) this.drawChart(this.chartdata, _usp)
					else this.redrawChart(this.chartdata, _usp)
				}
				else{
// DOES CHART NEED TO BE DESTROYED?
					//this.destroyChart()
					this.needsDraw = true

					this.clearChartData()
					this.isDrawing = false
					// in case component is reused, modal is open, but no longer a query metric?
					if(this.isOpen && !this.debug) $('#' + this.modalID).modal('close')
				}
			}
		},

		drawChart(_chartdata, _usp) {
			// confirm drawing hasn't been cancelled and metricUSP still matches data provided
			if(this.isDrawing && this.uspFetched == _usp){		// ??? && this.isOpen
				if(this.debug) console.log('drawChart')
				
				this.needsSetup = false
				this.tableChart = new google.visualization.Table(document.getElementById(this.chartID))
				this.tableChart.draw(_chartdata, {height: 300})

				$('.google-visualization-table').css('width', '100%')
				$('.google-visualization-table-table th')
					.css('padding', '8px')
					.css('background-image', 'none')
					.css('background-color', 'white')
				$('th.google-visualization-table-th').css('border-bottom', '3px solid lightgrey')

				if(this.countHeaders > 5) $('#' + this.modalID).css('width', '80%')
				else $('#' + this.modalID).css('width', '55%')

				this.needsDraw = false
				this.isDrawing = false

			} else if(this.debug) console.log('drawChart CANCELLED')
			// what happens if modal was closed before draw, and opens again?
		},
		// Google charts call .draw again
		redrawChart(_chartdata, _usp) {
			// confirm drawing hasn't been cancelled and metricUSP still matches data provided
			if(this.isDrawing && this.uspFetched == _usp){		// ??? && this.isOpen

				if(this.tableChart == null) console.error('tableChart null')
				else{
					this.needsSetup = false
					if(!this.needsRedraw) this.tableChart.draw(_chartdata, {height: 300})
					// REDRAW: Google charts has no animation, no difference
					else{
						this.tableChart.draw(_chartdata, {height: 300})
						this.needsRedraw = false
					}
				}
				this.isDrawing = false

			} else if(this.debug) console.log('redrawChart CANCELLED')
			// what happens if modal was closed before draw, and opens again?
		},
		// resizer not needed???
		/*resizer() {
			if(!this.needsDraw && !this.isDrawing){
				this.isDrawing = true
				this.redrawTable(this.chartdata, this.uspFetched)
			}
		},*/

		clearMetricData(){
			if(this.debug) console.log('clearMetricData')
			this.dataLoading = true
			this.metricdata = []
		},
		// calcs from creating chartdata; do not actually clear chartdata (only for Google Visualization)
		clearChartData(){
			if(this.debug) console.log('clearChartData')
			countHeaders = 0
			countRows = 0
		},
		destroyChart() {
			if(this.tableChart){
				if(this.debug) console.log('destroyChart - clearChart')
				this.tableChart.clearChart()
				if(this.debug) console.log(this.tableChart)
				if(this.debug) console.log(this.chartdata)
			}
		},

		onModalOpen(modal, trigger) {
			this.isOpen = true
		},
		onModalClose(modal, trigger) {
			this.isOpen = false
		},
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.outer {
	height: 100%;
}
.google-visualization-table-table th {
	padding: 8px !important;
}

.details-btn, .history-btn, .in-depth-btn {
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
.details-btn i {
	margin: 0 8px 0 -4px;
}

.details-table {
	
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