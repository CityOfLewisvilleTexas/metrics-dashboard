<template>
	<div :class="config.compid + '-outer'" class="card outer">
		<div class="title grey lighten-2 grey-text text-darken-1">
			{{ config.title }}
			<i class="material-icons right tooltipped pointy" :data-tooltip="config.why" data-delay="0" v-if="config.why">info</i>
		</div>
		<div :id="config.compid" class="content white center-align">
			<canvas class="cvs"></canvas>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'
import moment from 'moment'
import Chart from 'chart.js'
export default {
	name: 'DualLineChart2',
	components: {},
	props: ['config'],
	data () {
		return {
			chartdata: [],
			chartdata2: [],
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
		}
	},

	watch: {
		isLoadingMaster() {
			if (!this.isLoadingMaster) this.formatDataForChart(this.chartdata, this.chartdata2)
		}
	},

	// START
	mounted() {
		$('.tooltipped').tooltip()
		this.fetchData()
	},

	// remove any listeners
	beforeDestroy() {
	},

	methods: {

		getUspNameFromId(recordid) {
			for (var i in this.metrics) if (this.metrics[i].psofia_recordid == recordid) { return this.metrics[i].uspname }
		},

		// fetch widget data
		fetchData() {

			// get the usp name from metrics
			var uspName = this.getUspNameFromId(this.config.recordid1)

			// set loading
			this.isLoading = true

			// fetch
			axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
				// webservice: 'Performance Measures/Get Details or History',
				uspName: uspName,
				DetOrAvg: 'AGG'
			}).then(results => {
				this.chartdata = results.data[0]
				this.fetchData2()
			})
		},

		// fetch widget data
		fetchData2(from) {

			// get the usp name from metrics
			var uspName = this.getUspNameFromId(this.config.recordid2)

			// set loading
			this.isLoading = true

			// fetch
			axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
				// webservice: 'Performance Measures/Get Details or History',
				uspName: uspName,
				DetOrAvg: 'AGG'
			}).then(results => {
				// save data
				this.chartdata2 = results.data[0]
				if (!this.isLoadingMaster) this.formatDataForChart(this.chartdata, this.chartdata2)
			})
		},

		// set up data to go into line chart
		formatDataForChart(_data, _data2) {
			if (!_data || !_data2) return

			var dates = _data.map(row => row.date).concat(_data2.map(row => row.date))
			dates = dates.filter((item, pos) => { return dates.indexOf(item) == pos })

			// fixes any gaps in data
			_data = fillInGaps(_data, dates)
			_data2 = fillInGaps(_data2, dates)
			function fillInGaps(arr, dates) {
				dates.forEach(date => {
					if (arr.map(row=>row.date).indexOf(date) == -1) arr.push({ date: date, value: null, lastimported: null })
				})
				return arr.sort((a,b) => {
					if (a.date < b.date) return -1
					if (a.date > b.date) return 1
					return 0
				})
			}

			var ctx = document.querySelector('#'+this.config.compid+' canvas.cvs')
			var config = {
				type: 'line',
				data: {
					labels: dates.map(date => moment(date.replace('Z','')).format('YYYY-MM-DD')).sort(),
					datasets: [
						{
							label: 'PD Response Time (min)',
							backgroundColor: 'rgba(33,150,243 ,0.2)',
							borderColor: 'rgba(33,150,243 ,1)',
							data: _data.map(row => row.value),
							spanGaps: false,
						},
						{
							label: 'FD Response Time (min)',
							backgroundColor: 'rgba(244,67,54 ,0.2)',
							borderColor: 'rgba(244,67,54 ,1)',
							data: _data2.map(row => row.value),
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
								suggestedMin: Math.min(this.config.min, Math.min(..._data.map(row => row.value))*0.99, Math.min(..._data2.map(row => row.value))*0.99),
								suggestedMax: Math.max(Math.max(..._data.map(row => row.value))*1.01, Math.max(..._data2.map(row => row.value))*1.01),
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
