<template>
	<div class="card outer">
		<div class="title grey lighten-2 grey-text text-darken-1">
			{{ config.dept || 'All' }} Metrics
			<i class="material-icons right tooltipped" :data-tooltip="config.why" data-delay="0" v-if="config.why">help</i>
		</div>
		<div :id="config.compid" class="content center-align white">
			<canvas class="cvs"></canvas>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
import Chart from 'chart.js'
export default {
	name: 'GoalsPie2',
	components: {},
	props: ['config'],
	data () {
		return {
			chartdata: []
		}
	},

	computed: {
		isLoading() {
			return this.$store.state.softReloading
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
			// if (!this.isLoading) this.formatDataForChart()
		}
	},

	// START
	mounted() {
		this.formatDataForChart()
	},

	beforeDestroy() {
	},

	methods: {

		// set up data to go into line chart
		formatDataForChart() {
			if (!this.metrics) return
			else {
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
				var pct = {
					red: sums.red / this.metrics.length,
					yellow: sums.yellow / this.metrics.length,
					green: sums.green / this.metrics.length
				}
				this.chartdata = [
					['Label', 'Total'],
					['Exceeding expectations ' + pct.green.toString(), sums.green],
					['On track ' + pct.yellow.toString(), sums.yellow],
					['Delayed ' + pct.red.toString(), sums.red]
				]

				var config = {
					type: 'doughnut',
					data: {
						labels: [
							'Exceeding expectations (' + (pct.green*100).toFixed(2).toString() + '%)',
							'On track (' + (pct.yellow*100).toFixed(2).toString() + '%)',
							'Delayed (' + (pct.red*100).toFixed(2).toString() + '%)'
						],
						datasets: [
							{
								data: [
									sums.green,
									sums.yellow,
									sums.red
								],
								backgroundColor: [
									'rgba(76,175,80 ,1)',
									'rgba(205,220,57 ,1)',
									'rgba(244,67,54 ,1)'
								],
							}
						]
					},
					options: {
						maintainAspectRatio: false,
						responsive: true,
						legend: {
							position: 'top'
						},
						animation: {
							animateScale: true,
							animateRotate: true,
							duration: 1500
						}
					}
				}

				var ctx = document.querySelector('#'+this.config.compid+' canvas.cvs')
				Vue.nextTick(() => { this.drawPieChart(ctx, config) })
			}
		},

		// render line chart - takes a resize param so that animation only happens on initial load
		drawPieChart(ctx, config) {
			if (this.isLoading) return
			var chart = new Chart(ctx, config)
		}
	}
}
</script>

<style scoped>
canvas {
    width: 100%;
    height: 100%;
}
.outer.card {
	height: 100%
}
.title {
	font-size: 1.4rem;
	font-family: 'Product Sans';
	margin: 0;
	padding: 8px 16px;
}
.pie-chart-container {
	height: 100%;
}
.content {
	/*height: 100%;*/
	height: calc(100% - 48px);
	padding: 16px;
	/*position: relative;*/
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
