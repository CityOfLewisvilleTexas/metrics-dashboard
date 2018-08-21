<template>
	<div :class="config.compid + '-outer'">
		<div v-if="!isLoading && config.title && !isLoadingMaster" class="title grey darken-3 white-text center-align">
			{{ config.title }}
			<i class="material-icons right tooltipped pointy" :data-tooltip="config.why" data-delay="0" v-if="config.why">info</i>
		</div>
		<div class="content white center-align">
			<div class="loader" v-if="isLoading || isLoadingMaster"></div>
			<ListOfMetricsButton :compid="config.compid + '-metrics-button'" :callback="setMetric" v-if="config.editable && !isLoading && !isLoadingMaster" />
			<div :id="config.compid" class="line-chart-container" v-if="!isLoading"></div>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'
import moment from 'moment'
import ListOfMetricsButton from '../widgets/ListOfMetricsButton'
export default {
	name: 'DualLineChart',
	components: {
		ListOfMetricsButton
	},
	props: ['config', 'saveSettings'],
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
			return this.$store.state.isLoading
		}
	},

	watch: {
		// redraw chart if visibility changes (passed in from metric cards for correct sizing)
		'config.isVisible'() {
			this.formatDataForChart(this.chartdata, this.chartdata2)
		},
		// fetch new data if the uspName changes
		'config.uspName'() {
			Vue.nextTick(this.fetchData())
		},
		metrics() {
			if (!this.metrics.length) $('#'+this.config.compid).html('')
			else {
				this.fetchData()
			}
		}
	},

	// START
	mounted() {
		this.validateConfig()
		$(window).resize(() => {
			this.formatDataForChart(this.chartdata, this.chartdata2, true)
		})
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
			if (!this.isLoadingMaster) this.fetchData()
		},

		// fetch widget data
		fetchData(from) {

			// one last check for a uspName
			if (this.config.uspName) {
				// clear chart, set loading
				$('#'+this.config.compid).html('')
				this.isLoading = true

				// fetch
				axios.post('http://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
					// webservice: 'Performance Measures/Get Details or History',
					uspName: this.config.uspName,
					DetOrAvg: 'AGG'
				}).then(results => {

					// for setting up the last refreshed data on metric cards
					if (this.config.callback) this.config.callback(results.data[0])

					// save data
					this.chartdata = results.data[0]

					this.fetchData2()

					// format data correctly for google chart (on window resize also)
					// this.formatDataForChart(this.chartdata)
					// $(window).resize(() => {
					// 	this.formatDataForChart(this.chartdata, 1)
					// })
				})
			} else return
		},

		// fetch widget data
		fetchData2(from) {

			// one last check for a uspName
			if (this.config.uspName2) {
				// clear chart, set loading
				this.isLoading = true

				// fetch
				axios.post('http://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
					// webservice: 'Performance Measures/Get Details or History',
					uspName: this.config.uspName2,
					DetOrAvg: 'AGG'
				}).then(results => {

					// save data
					this.chartdata2 = results.data[0]

					// format data correctly for google chart (on window resize also)
					this.formatDataForChart(this.chartdata, this.chartdata2)
					$(window).resize(() => {
						this.formatDataForChart(this.chartdata, this.chartdata2, 1)
					})
				})
			} else return
		},

		// set up data to go into line chart
		formatDataForChart(_data, _data2, rsz) {
			// check if the graph is a percentage (multiply by 100)
			var isPercent = false
			this.$store.state.metrics.forEach(metric => {
				if (metric.uspname == this.config.uspName) {
					if (metric.gaugedataformat == 'PERCENT') isPercent = true
				}
			})

			var isPercent2 = false
			this.$store.state.metrics.forEach(metric => {
				if (metric.uspname == this.config.uspName2) {
					if (metric.gaugedataformat == 'PERCENT') isPercent2 = true
				}
			})

			// sort by date, then build array of arrays for google
			var chartdata = [['date', 'PD Response Time', 'FD Response Time']]
			_data.sort((a,b) => {
				if (a.date < b.date) return -1
				if (a.date > b.date) return 1
				return 0
			})
			.forEach(row => {
				// chartdata.push([new Date(moment(row.date.slice(0,10), 'YYYY-MM-DD').format('MM-DD-YYYY')), (isPercent) ? row.value * 100 : row.value])
				chartdata.push([row.date.slice(0,10), (isPercent) ? row.value * 100 : row.value])
			})

			// sort by date, then build array of arrays for google
			var chartdata2 = []
			_data2.sort((a,b) => {
				if (a.date < b.date) return -1
				if (a.date > b.date) return 1
				return 0
			})
			.forEach(row => {
				// chartdata.push([new Date(moment(row.date.slice(0,10), 'YYYY-MM-DD').format('MM-DD-YYYY')), (isPercent) ? row.value * 100 : row.value])
				chartdata2.push([row.date.slice(0,10), (isPercent2) ? row.value * 100 : row.value])
			})

			// combine data sets

			var finalchartdata = chartdata.concat(chartdata2)
			finalchartdata.forEach((row, idx) => {
				var matched = false
				finalchartdata.forEach((row2, idx2) => {
					if (row[0] == row2[0] && idx != idx2) {
						row.push(row2[1])
						finalchartdata.splice(idx2, 1)
						matched = true
					}
				})
				if (!matched && idx != 0) {
					if (idx >= chartdata.length) {
						row.push(row[1])
						row[1] = null
					}
					else {
						row.push(null)
					}
				}
			})

			// sort by date
			finalchartdata = finalchartdata.sort((a,b) => {
				if (a[0] == 'date') return -1
				if (a[0] < b[0]) return -1
				if (a[0] > b[0]) return 1
				return 0
			})

			// done loading, draw chart on next tick
			this.isLoading = false
			Vue.nextTick(() => {
				$('.tooltipped').tooltip()
				this.drawLineChart(finalchartdata, rsz, isPercent)
			})
		},

		// render line chart - takes a resize param so that animation only happens on initial load
		drawLineChart(_data, rsz, isPercent) {


			// apply data
			var data = google.visualization.arrayToDataTable(_data)

			var min = this.config.hasOwnProperty('min') ? this.config.min : 'automatic'
			var max = this.config.hasOwnProperty('max') ? this.config.max : 'automatic'
			var anim = this.config.hasOwnProperty('anim') ? 1000 : 0

			// chart options
			var options = {
				// title: null,
				height: 312,
				width: $('.'+this.config.compid+'-outer').width()-48,
				title: 'colton',
				titlePosition: 'none',
				chartArea: {
					// height: '60%'
					width: '100%',
					left: 64
				},
				legend: {
					position: 'top',
					textStyle: {
						color: 'grey'
					}
				},
				backgroundColor: 'transparent',
				hAxis: {
					textStyle: {
						color: '#212121'
					},
					gridlines: {
						color: 'white',
						// count: 4
					},
					baselineColor: 'black',
					slantedText: true
					// baseline: _data[1][0],
					// showTextEvery: Math.floor(this.chartdata.length / 5)
				},
				vAxis: {
					gridlines: {
						color: '#E0E0E0', // bdbdbd
						// count: 4
					},
					textStyle: { color: '#212121' },
					baselineColor: 'black',
					format: '#,###.##',
					minValue: min,
					maxValue: max,
					// minValue: (isPercent) ? 0 : 'automatic',
					// maxValue: (isPercent) ? 100 : 'automatic'
				},
				series: {
					0: { color: '#3F51B5' }
				},
				// lineWidth: 2,
				curveType: '',
				// lineWidth: 3
				animation: {
					startup: true,
					duration: anim
				}
			}

			// draw chart
			var chart = new google.visualization.AreaChart(document.getElementById(this.config.compid))
			chart.draw(data, options)
		},

		// set the line graph's metric to use
		setMetric(metric) {
			this.config.title = metric.realtimeshortname
			this.config.uspName = metric.uspname

			// uses the saveSettings callback to save the selection to localStorage
			this.saveSettings.callback(this.config.compid, {uspName: metric.uspname, title: metric.realtimeshortname})

			// start over
			this.validateConfig()
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
.material-tooltip {
    max-width: 600px !important;
}
</style>
