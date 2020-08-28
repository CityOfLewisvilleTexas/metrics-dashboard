<template>
	<div :id="getCompID('detailsbutton-outer')" class="outer">
		<a v-if="isQuery" :id="getCompID('detailsbutton')" :data-target="modalID"
			:disabled="!metricUSP && !debug"
			class="btn btn-flat details-btn white grey-text text-darken-2 waves-effect waves-dark modal-trigger">
			details
		</a>

		<div :id="modalID" class="modal white">
			<div class="modal-content">
				<p class="flow-text">{{ metric.metricname }}</p>
				<p v-show="hasError" class="flow-text">ERROR: no USP set for metric</p>
				<div v-if="isLoading" class="loader"></div>
				<div v-show="!isLoading && !hasError" class="center-align details-table">
					<div :id="tableID"></div>
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
	name: 'DetailsButton',
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
			debug: true,

			isLoading: true, 		// initial load of just this history data,
			needsMatInit: true,		// materialize init
			setupWaiting: false,
			needsDraw: true,
			isDrawing: false,
			needsRefresh: false,	// only refresh details data as often as metrics refreshes (when open, will keep same data if reopened before refreshed)

			metricdata: [],
			uspFetched: null,
			tableChart: null,
			chartdata: null,
			countHeaders: 0,
			countRows: 0,

			isOpen: false,
			fetchTimeout: null,
		}
	},

	computed: {
		// state
		storeIsLoading() { return this.$store.state.isLoading },
		storeIsRefreshing() { return this.$store.state.softReloading },
		googleChartsLoaded() { return this.$store.state.googleChartsLoaded },
		// getters
		primaryKey() { return this.$store.getters.psofiaVars.primaryKey },
		// getters with payload
		metricType() { return this.$store.getters.metricType(this.metric) },
		currentValue() { return this.$store.getters.metricValue({metric: this.metric}) },
		
		modalID() { return 'detailsbutton-modal-' + this.metricID },
		tableID() { return 'detailsbutton-table-' + this.metricID },

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
		// setup on load (if not loaded on mount)
		googleChartsLoaded:{
			immediate: false,
			handler(newVal, oldVal) {
				if(newVal && this.needsDraw && this.setupWaiting){
					this.setupTableData()
					this.isLoading = false
				}
			}
		},
		// set needsFetch on metrics refresh
		storeIsRefreshing:{
			immediate: false,
			handler(newVal, oldVal) {
				if(!newVal && oldVal){
					this.needsRefresh = true
					if(this.isOpen) this.fetchData()
				}
			},
		},
		// ensures that isloading set when this component is recycled
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
					this.isDrawing = false
					console.error(this.error)
				}
				if(!newVal && oldVal){
					this.needsMatInit = true
					this.initModal()
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
			if(this.debug) console.log('init')
			this.isLoading = true
			this.isDrawing = false					// stop drawing, won't continue fetching, drawing chart, or updating chart

			if(this.needsMatInit) this.initModal()

			this.destroyChart()
			this.clearFetchTimeout()

			this.needsDraw = true
			this.needsRefresh = false
			this.metricdata = []
			this.countHeaders = 0
			this.countRows = 0

			if(this.isOpen) this.fetchData()
		},
		initModal(){
			$('#' + this.modalID).modal({ ready: this.onModalOpen, complete: this.onModalClose })
			this.needsMatInit = false
		},
		getCompID(comp){
			return comp + '-' + this.metricID;
		},

		// fetch widget data
		fetchData() {
			if(this.debug) console.log('fetchData')
			this.isDrawing = true
			this.uspFetched = this.metricUSP

			if(!this.hasError){
				// fetch
				axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
					uspName: this.metricUSP,
					DetOrAvg: 'DETAILS'
				}).then(results => {
					if(this.isDrawing && this.isOpen && this.uspFetched == this.metricUSP){
						if (results.data[0]) this.metricdata = results.data[0]
						else this.metricdata = []
						this.needsRefresh = false
						if(this.googleChartsLoaded){
							this.setupTableData()
							this.isLoading = false
						}
						else this.setupWaiting = true
					}
				}).catch(error => {
					console.error('ERROR fetching data - ' + this.metricUSP + '\n' + error);
					if(this.isDrawing && this.isOpen && this.uspFetched == this.metricUSP){
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
			}
			// else no details, clear table, close modal if open
			else{
				this.destroyChart()
				this.needsDraw = true
				this.isDrawing = false
				this.isLoading = false
				if(this.isOpen && !this.debug) $('#' + this.modalID).modal('close')
			}
		},
		clearFetchTimeout(){
			if(this.fetchTimeout) this.fetchTimeout = clearTimeout(this.fetchTimeout)
		},
		
		setupTableData(entries) {
			if(this.debug) console.log('setupTableData')

			if(this.isDrawing && this.isOpen && this.uspFetched == this.metricUSP){
				if(this.metricdata.length > 0){
					if(this.needsDraw || !this.chartdata){
						if(this.debug) console.log('setupTableData - new')
						this.chartdata = new google.visualization.DataTable()
					}
					else{
						if(this.debug) console.log('setupTableData - update')
						this.chartdata.removeColumns(0, this.countHeaders)
						this.chartdata.removeRows(0, this.countRows)
					}

					this.countHeaders = 0
					// add each header
					for(var prop in this.metricdata[0]) {
						if(this.metricdata[0].hasOwnProperty(prop)) {
							this.chartdata.addColumn('string', prop)
							this.countHeaders++
						}
					}

					// fill in the chartdata
					this.countRows = 0
					this.metricdata.forEach(entry => {
						var row = []
						for (var prop in entry) {
							if (entry.hasOwnProperty(prop)) {
								row.push(String(entry[prop]))
							}
						}
						this.chartdata.addRow(row)
						this.countRows++
					})

					if(this.needsDraw) this.drawChart()
					else this.redrawChart()
				}
				else{
					this.destroyChart()
					this.needsDraw = true
					this.countHeaders = 0
					this.countRows = 0
					this.isDrawing = false
					if(this.isOpen && !this.debug) $('#' + this.modalID).modal('close')
				}
			}
		},

		drawChart() {
			if(this.debug) console.log('drawChart')

			if(this.isDrawing && this.isOpen && this.uspFetched == this.metricUSP){
				if(this.debug) console.log('drawChart - create')
				this.tableChart = new google.visualization.Table(document.getElementById(this.tableID))
				this.tableChart.draw(this.chartdata, {height: 300})

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
			}
		},
		redrawChart() {
			if(this.tableChart == null) console.error('tableChart null')
			else{
				if(this.isDrawing && this.isOpen){
					this.tableChart.draw(this.chartdata, {height: 300})
					this.isDrawing = false
				}
			}
		},
		/*resizer() {
			if(!this.isDrawing){
				this.isDrawing = true
				this.redrawTable()
			}
		},*/
		destroyChart() {
			if(this.tableChart){
				if(this.debug) console.log('CLEAR CHART')
				this.tableChart.clearChart()
				if(this.debug) console.log(this.tableChart)
				if(this.debug) console.log(this.chartdata)
			}
		},


		onModalOpen(modal, trigger) {
			if(this.debug) console.log('open modal')
			this.isOpen = true
			if(this.needsDraw || this.needsRefresh) this.fetchData()
		},
		onModalClose(modal, trigger) {
			if(this.debug) console.log('close modal')
			this.isOpen = false
			this.clearFetchTimeout()
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