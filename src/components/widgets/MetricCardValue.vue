<template>
	<div class="center-align metric-value">
		<div class="white">
			<div class="loader" v-if="isLoading"></div>
			<div v-if="!isLoading">
				<div :id="'metric-gauge-' + metric.psofia_recordid"
					v-if="(metric.gaugedataformat == 'PERCENT' && metric.metrictype == 'Query') || (metric.metrictype == 'Static' && metric.staticsymbol == 'Gauge')"
					class="gauge-holder">
					gauge
				</div>
				<p v-else class="kpi-value center-align grey-text text-darken-3" :style="{'font-size': determineFontSize(`${metric.prevaluetext === null ? '' : metric.prevaluetext}${currentValue}${metric.postvaluetext === null ? '' : metric.postvaluetext}`)}">{{ metric.prevaluetext }}{{ currentValue }}{{ metric.postvaluetext }}</p>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
export default {
	name: 'MetricCardValue',
	components: {
	},
	props: ['metric'],
	data () {
		return {
			chartdata: {},
			chartoptions: {},
			isDrawing: true
		}
	},

	computed: {
		currentValue() {

			var decPlaces = this.metric.decimalplaces == null ? 2 : this.metric.decimalplaces

			if (this.metric.metrictype == 'Static') {
				if (this.metric.staticsymbol == 'Gauge') return this.metric.staticgauge
				if (this.metric.staticsymbol == 'Text') return this.metric.statictext
			}
			else if (this.metric.metrictype == 'Query') {
				if (this.metric.gaugedataformat == 'PERCENT') return Number((this.metric.CurrentValue).toFixed(decPlaces))+'%'
				else if (this.metric.prevaluetext == '$') return (this.metric.CurrentValue).toFixed(2)
				else return Number(this.metric.CurrentValue.toFixed(decPlaces))
			}
			else return '[[error 1000]]'
		},

		// loading icon if store hasnt loaded yet (no current metric loaded)
		isLoading() {
			if (!this.metric) return true
			return this.metric.hasOwnProperty('psofia_recordid') ? false : true
		}
	},

	watch: {
		// this ensures that gauges are drawn on department changes (where this component doesn't necessarily get re-mounted (gets recycled instead))
		metric() {
			if ((this.metric.gaugedataformat == 'PERCENT' && this.metric.metrictype == 'Query') || (this.metric.metrictype == 'Static' && this.metric.staticsymbol == 'Gauge')) {
				google.charts.load('current', {'packages':['gauge']})
				google.charts.setOnLoadCallback(this.setupGaugeData)
				$(window).resize(this.resizer)
			}
		}
	},

	mounted() {
		// if we need gauges, load google charts up
		if ((this.metric.gaugedataformat == 'PERCENT' && this.metric.metrictype == 'Query') || (this.metric.metrictype == 'Static' && this.metric.staticsymbol == 'Gauge')) {
			google.charts.load('current', {'packages':['gauge']})
			google.charts.setOnLoadCallback(this.setupGaugeData)
			$(window).resize(this.resizer)
		}
	},

	beforeDestroy() {
		$(window).off('resize', this.resizer)
	},

	methods: {
		determineFontSize(node) {
			let len = node.length
			console.log(node, len)
			if(len >= 8) {
				return '2.4vw'
			} else if(len >= 7) {
				return '2.8vw'
			} else if(len >= 6) {
				return '3vw'
			} else if(len >= 5) {
				return '3.6vw'
			} else return '5rem'
		},
		resizer() {
			if (!this.isDrawing) this.renderGauge()
		},
		setupGaugeData() {
			// grab the metric's value and multiply by 100 (%)
			var value = null
			if (this.metric.metrictype == 'Query') value = Number((this.metric.CurrentValue).toFixed(2))
			else if (this.metric.metrictype == 'Static') value = Number((this.metric.staticgauge*100).toFixed(2))

			// add percent sign to value, blank label
			this.chartdata = new google.visualization.DataTable()
			this.chartdata.addColumn('string', 'Label')
			this.chartdata.addColumn('number', 'Value')
			this.chartdata.addRow(['', {v: value, f: value+'%'}])

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
			this.renderGauge()
		},

		renderGauge() {
			var chart = new google.visualization.Gauge(document.getElementById('metric-gauge-'+this.metric.psofia_recordid))
			chart.draw(this.chartdata, this.chartoptions)
			this.isDrawing = false
		}
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
.loader {
	display: inline-block;
    border: 6px solid #D1C4E9;
    border-top: 6px solid #673AB7;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 2s linear infinite;
}
.gauge-holder {
	height: 150px;
	display: inline-block;
	margin-bottom: 32px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
