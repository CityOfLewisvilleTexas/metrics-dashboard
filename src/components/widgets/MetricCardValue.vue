<template>
	<div :id="getCompID('metriccardvalue-outer')"
		class="center-align metric-value">
		<div class="white">
			<div v-if="isLoading" class="loader"></div>
			<div v-show="!isLoading">
				<div v-if="showGauge" :id="gaugeID"
					class="gauge-holder">
					gauge
				</div>
				<p v-if="!showGauge" :id="getCompID('metriccard-value')"
					class="kpi-value center-align grey-text text-darken-3" :style="{'font-size': determineFontSize(currentValueText)}">
					{{ currentValueText }}
				</p>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
export default {
	name: 'MetricCardValue',
	components: {},
	props: {
		metric: {
			type: Object,
			required: true,
		},
		config: {	// timestamp
			type: Object,
			required: true,
		},
	},
	data () {
		return {
			debug: false,

			needsDraw: true,
			isDrawing: true,

			gaugeChart: null,
			chartdata: null,
			chartoptions: null,
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
		currentValue() { return this.$store.getters.metricValue({metric: this.metric}) },

		// loading icon if store hasnt loaded yet (no current metric loaded)
		isLoading() {
			if (this.storeIsLoading) return true
			if(this.showGauge) return this.needsDraw
			return false
		},
		gaugeID() { return 'metriccard-gauge-' + this.metricID },

		// config
		configTimestamp() { return this.config.timestamp },

		// metric props
		metricID() { return this.metric[this.primaryKey] },
		currentValueText() {
			if(this.currentValue.error) return '[[error 1000]]'
			else return this.currentValue.commaStr
		},
		showGauge() {
			if(this.currentValue.error) return false
			else return this.currentValue.showGauge
		},
		percentVal(){
			if(this.showGauge) return this.currentValue.percentVal
		},
	},

	watch: {
		// setup on load (if not loaded on mount)
		googleChartsLoaded:{
			immediate: false,
			handler(newVal, oldVal) {
				if(newVal && this.showGauge && this.needsDraw){
					this.setupGaugeData()
				}
			}
		},
		// this ensures that gauges are drawn on department changes (where this component doesn't necessarily get re-mounted (gets recycled instead))
		metricID:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('metricID changed')
				this.needsDraw = true
				if(this.showGauge && this.googleChartsLoaded){
					this.setupGaugeData()
				}
			}
		},
		percentVal:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('metric percentVal changed')
				if(this.showGauge && this.googleChartsLoaded){
					this.setupGaugeData()
				}
			}
		},

		//debug
		configTimestamp:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('configTimestamp changed')
			}
		},
		currentValueText:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('metric currentValueText changed')
			}
		},
	},

	// initial draw must be on mounted, cannot do in watch immediate
	mounted() {
		if(this.debug) console.log('mounted')
		this.init()
	},
	beforeDestroy() {
		if(this.debug) console.log('destroy')
		if(this.gaugeChart) this.gaugeChart.clearChart()
		$(window).off('resize', this.resizer)
	},

	methods: {
		init(){
			$(window).resize(this.resizer)
			if(this.showGauge && this.googleChartsLoaded){
				this.setupGaugeData()
			}
		},
		getCompID(comp){
			return comp + '-' + this.metricID;
		},

		setupGaugeData() {
			if(this.debug) console.log('setupGaugeData')
			this.isDrawing = true

			var value = this.currentValue.percentVal

			// add percent sign to value, blank label
			if(this.needsDraw){
				this.chartdata = new google.visualization.DataTable()
				this.chartdata.addColumn('string', 'Label')
				this.chartdata.addColumn('number', 'Value')
				this.chartdata.addRow(['', {v: value, f: value+'%'}])
			}
			else{
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

			// google chart options
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

			if(this.needsDraw) this.renderGauge()
			else this.redrawGauge()
		},

		renderGauge() {
			this.gaugeChart = new google.visualization.Gauge(document.getElementById(this.gaugeID))
			this.gaugeChart.draw(this.chartdata, this.chartoptions)
			this.needsDraw = false
			this.isDrawing = false
		},
		redrawGauge() {
			if(this.gaugeChart == null) console.error('gaugeChart null')
			else{
				this.gaugeChart.draw(this.chartdata, this.chartoptions)
				this.isDrawing = false
			}
		},
		resizer() {
			if(this.showGauge && !this.isDrawing){
				this.isDrawing = true
				this.redrawGauge()
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
