<template>
	<div :id="getCompID('metriccard-value-outer')" class="center-align metric-value">

		<div :class="{'grey': hasError, 'lighten-4': hasError, 'white': !hasError}">

			<div v-if="isLoading" class="loader"></div>

			<div v-show="!isLoading">

				<div v-show="showGauge && !hasError" :id="gaugeID" class="gauge-holder"></div>

				<p v-if="!showGauge || hasError" :id="getCompID('metriccard-value')"
					class="kpi-value center-align grey-text text-darken-3"
						:style="{'font-size': determineFontSize(currentValueText)}">
					{{ currentValueText }}
				</p>

			</div>

		</div>
		
	</div>
</template>

<script>
import Vue from 'vue'
export default {
	name: 'MetricCardValue',					// USED IN MetricCard.vue -> Details.vue
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
			setupWaiting: false,

			needsDraw: true,
			needsRedraw: false,				// component is being reused, hide/clear chart until fully reset
			isDrawing: false,

			gaugeval: null,

			needsSetup: false,
			gaugeChart: null,
			chartdata: null,
			chartoptions: null,
		}
	},

	computed: {
			// store.state
			storeIsLoading() { return this.$store.state.isLoading },
			storeIsRefreshing() { return this.$store.state.softReloading },
			googleChartsLoaded() { return this.$store.state.googleChartsLoaded },
			// store.getters
			primaryKey() { return this.$store.getters.psofiaVars.primaryKey },

		// loading icon if store hasnt loaded yet (no current metric loaded)
		isLoading() { return (this.storeIsLoading || (this.showGauge && this.needsDraw)) },

		gaugeID() { if(this.metricID) return 'metriccard-gauge-holder' + this.metricID },

		// metric data (metric prop REQUIRED)
		metricID() { if(this.metric) return this.metric[this.primaryKey] },
		currentValue() { if(this.metric) return this.$store.getters.metricValue({metric: this.metric}) },
		showGauge() {
			if(this.currentValue){
				if(this.currentValue.error) return false
				else return this.currentValue.showGauge
			}
		},
		currentValueText() {
			if(this.currentValue){
				if(this.currentValue.error) return '[[error 1000]]'
				else return this.currentValue.commaStr
			}
			else return '[[error 1000]]'
		},
		percentVal(){ if(this.showGauge) return this.currentValue.percentVal },

		// config/other setup
		configTimestamp() { return this.config.timestamp },

		errorCode(){
			var err = 0
			if(!this.metric) err = 1
			// don't need to check storeLoading, wouldn't receive metric prop if so
			else if(!this.metricID) err = 2
			else if(this.currentValue && this.currentValue.error) err = 3

			return err;
		},
		hasError(){ return this.errorCode > 0 },
		hasWarning(){ return false },
		error(){
			var err = ''
			if(this.hasError){
				if(this.errorCode == 1) err = 'Prop: Metric not provided'
				else if(this.errorCode == 2) err = 'MetricID missing'
				else if(this.errorCode == 3) err = 'Metric current value has error - ' + this.metricID + '\n' + this.formLink
			}
			return err;
		},
		formLink() { if(this.metricID && this.hasError) return this.$store.getters.getFormLink({ id: this.metricID }) },
	},

	watch: {
		// setup on load (if not loaded on mount)
		googleChartsLoaded:{
			immediate: false,
			handler(newVal, oldVal) {
				if(newVal && this.showGauge && this.needsDraw && this.setupWaiting){
					this.setupGaugeData()
				}
			}
		},

		// IF charts are loaded and showGauge, only calc once for all needsSetup = true until calc has completed or draw is cancelled (because of change)
		needsSetup:{
			immediate: false,
			handler(newVal, oldVal){
				if(newVal && !oldVal){
					if(this.debug) console.log('needsSetup')
					if(this.showGauge){
						if(this.googleChartsLoaded) this.setupGaugeData()
						else this.setupWaiting = true
					}
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

		// update gauge (handle destroy if error or not query)
		storeIsRefreshing:{
			immediate: false,
			handler(newVal, oldVal) {
				if(!newVal && oldVal) this.needsSetup = true
			}
		},
		// this ensures that gauges are recreated on department/category changes (where this component doesn't necessarily get re-mounted (gets recycled instead))
		// 		gaugeID will also be changed (don't add watch for gaugeID)
		metricID:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('metricID changed')
				this.isDrawing = false
				this.destroyChart()										// destroy old chart because element has changed ids?
				this.needsDraw = true									// bc chart was destroyed
				this.needsRedraw = true									// triggers watch to call init again
			}
		},
		// can't remember what this was for
		configTimestamp:{				// change category
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('configTimestamp changed')
			}
		},

		// log errors
		error:{
			immediate: true,
			handler(newVal, oldVal) {
				if(newVal) console.error(this.error)
			},
		},
	},

	// initial draw must be on mounted, cannot do in watch immediate
	mounted() {
		if(this.debug) console.log('mounted')
		$(window).resize(this.resizer)
		this.init()
	},
	beforeDestroy() {
		if(this.debug) console.log('destroy')
		if(this.gaugeChart) this.gaugeChart.clearChart()
		$(window).off('resize', this.resizer)
	},

	methods: {
		init(){
			if(this.debug) console.log('init')

			if(this.showGauge) this.needsSetup = true		// trigger watcher to setup gauge
		},

		getCompID(comp){
			return comp + '-' + this.metricID;
		},

		// set up data to go into gauge, handles no data to clear gauge
		setupGaugeData() {
			if(this.showGauge){
				if(this.debug) console.log('setupGaugeData')
				this.isDrawing = true

				this.gaugeval = this.currentValue.percentVal

				// add percent sign to value, blank label
				if(this.needsDraw){
					if(this.debug) console.log('setupGaugeData - new')
					this.chartdata = new google.visualization.DataTable()
					this.chartdata.addColumn('string', 'Label')
					this.chartdata.addColumn('number', 'Value')
					this.chartdata.addRow(['', {v: value, f: value+'%'}])
				}
				else{
					if(this.debug) console.log('setupGaugeData - update')
					this.chartdata.removeRow(0)
					this.chartdata.addRow(['', {v: value, f: value+'%'}])
				}

				// get the gauge values for the ranges
				var gmin = this.metric.gaugegreenfromamount
				var gmax = this.metric.gaugegreentoamount
				var ymin = this.metric.gaugeyellowfromamount
				var ymax = this.metric.gaugeyellowtoamount
				var rmin = this.metric.gaugeredfromamount
				var rmax = this.metric.gaugeredtoamount
				var gaugemin = this.metric.gaugeminvalue
				var gaugemax = this.metric.gaugemaxvalue

				// exclude red if not within it
				function between (a, b, value) {
					return (a > b) ? value >= b && value <= a : value >= a && value <= b
				}
				if (!between(rmin, Number(rmax), Number(value))) {
					rmin = 0
					rmax = 0
				}

				if(this.needsDraw){
					/* OPTIONS - SET */
					this.chartoptions = {
						height: 300,
						width: 170,
						greenFrom: gmin,
						greenTo: gmax,
						greenColor: 'green',
						yellowFrom: ymin,
						yellowTo: ymax,
						yellowColor: 'lightgreen',
						redFrom: rmin,
						redTo: rmax,
						redColor: 'red',
						min: gaugemin,
						max: gaugemax
					}

					this.drawGauge(this.chartdata, this.chartoptions)
				}
				else{
					/* OPTIONS - UPDATE */
					this.chartoptions.greenFrom = gmin
					this.chartoptions.greenTo = gmax
					this.chartoptions.yellowFrom = ymin
					this.chartoptions.yellowTo = ymax
					this.chartoptions.redFrom = rmin
					this.chartoptions.redTo = rmax
					this.chartoptions.min = gaugemin
					this.chartoptions.max = gaugemax

					this.redrawGauge(this.chartdata, this.chartoptions)
				}
			}
			else{
				this.gaugeval = null
				this.needsSetup = false
			}
		},

		drawGauge(_chartdata, _chartoptions) {
			this.needsSetup = false
			this.gaugeChart = new google.visualization.Gauge(document.getElementById(this.gaugeID))
			this.needsDraw = false
			this.gaugeChart.draw(_chartdata, _chartoptions)
			this.needsDraw = false
			this.isDrawing = false
		},
		redrawGauge(_chartdata, _chartoptions) {
			if(this.gaugeChart == null) console.error('gaugeChart null')
			else{
				this.needsSetup = false
				if(!this.needsRedraw) this.gaugeChart.draw(_chartdata, _chartoptions)
				// REDRAW: Google charts has no animation, no difference
				else{
					this.gaugeChart.draw(_chartdata, _chartoptions)
					this.needsRedraw = false
				}
				this.isDrawing = false
			}
		},
		resizer() {
			if(this.showGauge && !this.needsDraw && !this.isDrawing){
				this.isDrawing = true
				this.redrawGauge(this.chartdata, this.chartoptions)
			}
		},

		// do not actually clear chartdata or chartoptions (only for Google Visualization) clearChartData(){ },
		destroyChart() {
			if(this.gaugeChart){
				if(this.debug) console.log('destroyChart - clearChart')
				this.gaugeChart.clearChart()
				if(this.debug) console.log(this.gaugeChart)
				if(this.debug) console.log(this.chartdata)
				if(this.debug) console.log(this.chartoptions)
			}
		},

		determineFontSize(node) {
			let len = node.length
			if(len >= 8) {
				return '2.3rem'
			} else if(len >= 7) {
				return '2.7rem'
			} else if(len >= 6) {
				return '3rem'
			} else if(len >= 5) {
				return '3.5rem'
			} else return '5rem'
		},
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.kpi-value {
	font-size: 4rem;
	line-height: 5rem;
	margin: 0;
	font-family: 'Product Sans', 'Roboto';
	padding: 32px;
}
.gauge-holder {
	height: 150px;
	display: inline-block;
	margin-bottom: 32px;
}

.loader {
	width: 40px;
    height: 40px;
	display: inline-block;
    border: 6px solid #D1C4E9;
    border-top: 6px solid #673AB7;
    border-radius: 50%;
    animation: spin 2s linear infinite;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
