<template>
	<div :class="config.compid + '-outer'">
		<a 	class="btn btn-flat history-btn white grey-text text-darken-2 waves-effect waves-dark"
			@click="openHistoryModal">
			history
		</a>

		<div :id="'history-modal-'+metric.psofia_recordid" class="modal white">
			<div class="modal-content">
				<p class="flow-text">{{ metric.metricname }}</p>
				<div class="history-graph-holder">
					<!-- <HistoryGraph2 :config="config" v-if="isVisible" /> -->
					<canvas :id="'cvs-' + metric.psofia_recordid" class="cvs" />
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
import moment from 'moment'
import ListOfMetricsButton from '../widgets/ListOfMetricsButton'
import HistoryGraph2 from '../widgets/HistoryGraph2'
import Chart from 'chart.js'
export default {
	name: 'HistoryButton',
	components: {
		ListOfMetricsButton, HistoryGraph2
	},
	props: ['metric'],
	data () {
		return {
			chartdata: [],
			isVisible: false,
			isLoading: true // loading just this history data,
		}
	},

	computed: {
		config() {
			return {
				compid: this.metric.psofia_recordid + '-historygraph',
				uspName: this.metric.uspname,
				editable: false,
				chart: null
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
		$('#history-modal-'+this.metric.psofia_recordid).modal()
	},

	// remove window resize listener
	beforeDestroy() {
	},

	methods: {

		// fetch widget data
		fetchData() {

			// set loading
			this.isLoading = true

			// fetch
			axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
				// webservice: 'Performance Measures/Get Details or History',
				uspName: this.config.uspName,
				DetOrAvg: 'AGG'
			}).then(results => {
				this.chartdata = results.data[0].sort((a,b) => {
					if (new Date(a.date) < new Date(b.date)) return -1
					if (new Date(a.date) > new Date(b.date)) return 1
					return 0
				})
				this.isLoading = false
				this.formatDataForChart(this.chartdata)
			})
		},

		// set up data to go into line chart
		formatDataForChart(_data) {
			if (!_data) return
			var ctx = document.querySelector('#cvs-' + this.metric.psofia_recordid)
			var config = {
				type: 'line',
				data: {
					labels: _data.map(row => moment(row.date.replace('Z','')).format('MM-DD-YYYY')),
					datasets: [
						{
							label: 'value',
							backgroundColor: 'rgba(244,67,54 ,0.2)',
							borderColor: 'rgba(244,67,54 ,1)',
							data: _data.map(row => row.value),
							spanGaps: false,
							pointRadius: 0
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
								suggestedMin: Math.min(..._data.map(row => row.value))*0.99,
								suggestedMax: Math.max(..._data.map(row => row.value))*1.01
							},
							display: true,
							scaleLabel: {
								display: false
							}
						}],
						xAxes: [{
							gridLines: {
								display: false
							}
						}]
					},
					animation: {
						duration: 1500
					}
				}
			}
			Vue.nextTick(() => { this.drawLineChart(ctx, config) })
		},

		// render line chart - takes a resize param so that animation only happens on initial load
		drawLineChart(ctx, config) {
			if (this.chart) this.chart.destroy()
			this.chart = new Chart(ctx, config)
		},

		openHistoryModal() {
			$('#history-modal-'+this.metric.psofia_recordid).modal('open')
			Vue.nextTick(this.fetchData)
		}
	}
}
</script>

<style scoped>
canvas {
    width: 100%;
    min-height: 300px;
    height: 306px;
}
.outer {
	height: 100%;
}
.line-chart-container {
	height: 100%;
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
</style>
