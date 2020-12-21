<template>
	<div>
		<div class="title center-align grey darken-3 white-text" v-if="!isLoading">
			{{ config.dept || 'All' }} Metrics
			<i class="material-icons right tooltipped" :data-tooltip="config.why" data-delay="0" v-if="config.why">help</i>
		</div>
		<div class="content center-align white">
			<div class="loader" v-if="isLoading"></div>
			<div :id="config.compid" class="pie-chart-container" v-if="!isLoading"></div>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
export default {
	name: 'GoalsPie',					// NO LONGER USED IN ADMIN
	components: {},
	props: ['config'],
	data () {
		return {
			debug: true,

			chartdata: []
		}
	},

	computed: {
		isLoading() {
			return this.$store.state.isLoading
		},
		metrics() {
			return this.$store.state.metrics.filter(metric => {
				if (this.config.dept) return metric.metrictype == 'Query' && metric.Department == this.config.dept
				else return metric.metrictype == 'Query'
			})
		},
	},

	watch: {
		metrics() {
			this.formatDataForChart()
		},
		isLoading() {
			$('#'+this.config.compid).html('')
		}
	},

	// START
	mounted() {
		if(this.debug) console.log('MOUNTED')
		this.validateConfig()
		$(window).resize(this.drawPieChart)
	},

	// remove window resize listener
	beforeDestroy() {
		$(window).off('resize')
	},

	methods: {

		// makes sure the config prop is valid (has something inside of it)
		validateConfig() {
			var empty = true
			for (var prop in this.config) if (this.config.hasOwnProperty(prop)) empty = false
			if (empty) return

			// continue to get data
			this.formatDataForChart()
		},

		// set up data to go into line chart
		formatDataForChart() {
			if (!this.metrics) return
			else {
				Vue.nextTick(() => {
					var sums = {
						red: 0,
						yellow: 0,
						green: 0
					}
					this.metrics.forEach((metric) => {
						if (metric.metrictype == 'Query') {
							if (metric.CurrentColor == 'green') sums.green++
							else if (metric.CurrentColor == 'light-green') sums.yellow++
							else if (metric.CurrentColor == 'red') sums.red++
						}
					})
					this.chartdata = [
						['Label', 'Total'],
						['Exceeding expectations', sums.green],
						['On track', sums.yellow],
						['Delayed', sums.red]
					]
					this.drawPieChart()
				})
			}
		},

		// render line chart - takes a resize param so that animation only happens on initial load
		drawPieChart() {

			if (this.isLoading) return

			// apply data
			var data = google.visualization.arrayToDataTable(this.chartdata)

			// chart options
			var options = {
				pieHole: 0.4,
                height: 296,
                pieSliceBorderColor: 'transparent',
                backgroundColor: 'transparent',
                legend: 'none',
                pieSliceText: 'none',
                chartArea: {
                    height: '90%',
                    width: '90%'
                },
                slices: {
                    0: { color: '#048204' },
                    1: { color: '#10d310' },
                    2: { color: '#d50000' },
                    3: { color: '#666666' }
                },
                fontSize: 12
			}

			// draw chart
			var chart = new google.visualization.PieChart(document.getElementById(this.config.compid))
			chart.draw(data, options)
		}
	}
}
</script>

<style scoped>
.title {
	font-size: 1.4rem;
	font-weight: bold;
	font-family: 'Product Sans';
	margin: 0;
	padding: 8px;
	border-radius: 5px 5px 0 0;
}
.pie-chart-container {
	height: 100%;
}
.content {
	border-radius: 0 0 5px 5px;
	height: 100%;
	padding: 16px;
	position: relative;
}
.noBorder {
	border: none;
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
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
