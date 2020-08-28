<template>
	<div :class="config.compid + '-outer'" class="card outer">
		<div v-if="config.title || title" class="title grey lighten-2 grey-text text-darken-1">
			{{ config.title || title }}
			<i class="material-icons right tooltipped" :data-tooltip="config.why" data-delay="0" v-if="config.why">help</i>
		</div>
		<div :id="config.compid" class="content white center-align" >
			<canvas class="cvs"></canvas>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'
import Moment from 'moment'
import ListOfMetricsButton from '../widgets/ListOfMetricsButton'
import Chart from 'chart.js'
export default {
	name: 'LineChart2',
	components: {
		ListOfMetricsButton
	},
	props: ['config', 'saveSettings'],
	data () {
		return {
			chartdata: [],
			isLoading: true // loading just this history data
		}
	},

	computed: {
		metrics() {
			return this.$store.state.metrics
		},
		isLoadingMaster() {
			// loading overall metrics
			return this.$store.state.softReloading
		},
		title() {
			for (var i in this.metrics)
				if (this.metrics[i].psofia_recordid == this.config.recordid) {
					return this.metrics[i].realtimeshortname
				}
		}
	},

	watch: {
		isLoadingMaster() {
			if (!this.isLoadingMaster) this.formatDataForChart(this.chartdata)
		}
	},

	// START
	mounted() {
		$('.tooltipped').tooltip()
		this.fetchData()
	},

	// remove window resize listener
	beforeDestroy() {
	},

	methods: {

		getUspNameFromId(recordid) {
			for (var i in this.metrics) if (this.metrics[i].psofia_recordid == recordid) { return this.metrics[i].uspname }
		},

		// fetch widget data
		fetchData() {

			// get the usp name from metrics
			var uspName = this.getUspNameFromId(this.config.recordid)

			// set loading
			this.isLoading = true

			// fetch
			axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
				// webservice: 'Performance Measures/Get Details or History',
				uspName: uspName,
				DetOrAvg: 'AGG'
			}).then(results => {
				this.chartdata = results.data[0]
				if (!this.isLoadingMaster) this.formatDataForChart(this.chartdata)
			})
		},

		// set up data to go into line chart
		formatDataForChart(_data) {
			if (!_data) return
			var ctx = document.querySelector('#'+this.config.compid+' canvas.cvs')
			_data.sort((a,b) => {
				if (a.date < b.date) return -1
				if (a.date > b.date) return 1
				return 0
			})
			var config = {
				type: 'line',
				data: {
					labels: _data.map(row => Moment(row.date.replace('Z','')).format('MM-DD-YYYY')),
					datasets: [
						{
							label: this.config.title ? this.config.title : this.title,
							backgroundColor: 'rgba(0,191,165 ,.3)',
							borderColor: 'rgba(0,191,165 ,1)',
							data: _data.map(row => row.value),
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
								suggestedMin: Math.min(this.config.min, ..._data.map(row => row.value)),//*0.99,
								suggestedMax: Math.max(this.config.max, ..._data.map(row => row.value))//*1.01
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
					data: _data.map(row => this.config.goal),
					spanGaps: false,
					pointRadius: 0
				})
			}
			Vue.nextTick(() => { this.drawLineChart(ctx, config) })
		},

		// render line chart - takes a resize param so that animation only happens on initial load
		drawLineChart(ctx, config) {
			var chart = new Chart(ctx, config)
		}
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
