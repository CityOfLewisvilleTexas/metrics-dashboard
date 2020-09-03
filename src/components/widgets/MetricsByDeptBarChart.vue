<template>
	<div class="outer">
		<div v-if="!isLoading" class="title grey darken-3 white-text center-align">
			{{ 'Total Metrics by Department' + ((metrictype) ? ' (' + metrictype.toLowerCase() + ' only)' : '') }}
			<i class="material-icons right tooltipped" :data-tooltip="config.why" data-delay="0" v-if="config.why">help</i>
		</div>
		<div class="background center-align white">
			<div class="loader" v-if="isLoading"></div>
			<div v-if="!isLoading">
				<b>Type: </b>
				<a class="btn-flat grey lighten-2" @click="setType('')" :class="{ active : metrictype == '' }">All</a>
				<a class="btn-flat grey lighten-2" @click="setType('Query')" :class="{ active : metrictype == 'Query' }">Query</a>
				<a class="btn-flat grey lighten-2" @click="setType('Static')" :class="{ active : metrictype == 'Static' }">Static</a>
			</div>
			<div id="barchart-by-dept" v-if="!isLoading"></div>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
export default {
	name: 'MetricsByDeptBarChart',					// USED IN Admin.vue
	components: {},
	props: ['config'],
	data () {
		return {
			debug: true,

			metrictype: ''
		}
	},

	computed: {
		metrics() {
			return this.$store.state.metrics
		},

		isLoading() {
			return this.$store.state.isLoading || this.isLoadingMaster
		},

		departments() {
			var depts = []
			this.metrics.forEach(metric => {
				var exists = false
				for (var i in depts) {
					if (depts[i].name == metric.Department) {
						exists = true
						if (metric.metrictype == this.metrictype || this.metrictype == '')
							depts[i].count++
						if (metric.metrictype == 'Query')
							depts[i].query++
						if (metric.metrictype == 'Static')
							depts[i].static++
					}
				}
				if (!exists) {
					depts.push({
						name: metric.Department,
						count: (metric.metrictype == this.metrictype || this.metrictype == '') ? 1 : 0,
						query: (metric.metrictype == 'Query') ? 1 : 0,
						static: (metric.metrictype == 'Static') ? 1 : 0,
					})
				}
			})
			return depts.sort((a,b) => {
				if (a.name < b.name) return -1
				if (a.name > b.name) return 1
				return 0
			})
		}
	},

	watch: {
		isLoading() {
			if (this.isLoading) $('#barchart-by-dept').html('')
		},
		departments() {
			this.formatDataForChart('depts')
		},
		metrictype() {
			this.formatDataForChart('type')
		}
	},

	// START
	mounted() {
		if(this.debug) console.log('MOUNTED')
		this.formatDataForChart()
		$(window).resize(this.formatDataForChart)
	},

	// remove window resize listener
	beforeDestroy() {
		$(window).off('resize', this.formatDataForChart)
	},

	methods: {

		setType(type) {
			this.metrictype = type
		},

		// set up data to go into column chart
		formatDataForChart(from) {
			if (!this.departments.length || this.isLoading) return

			// sort by date, then build array of arrays for google
			var chartdata = []
			if (this.metrictype == '') chartdata = [['Department', 'Query', { role: 'style'}, 'Static', { role: 'style'}]]
			else if (this.metrictype == 'Query') chartdata = [['Department', 'Query', { role: 'style'}]]
			else if (this.metrictype == 'Static') chartdata = [['Department', 'Static', { role: 'style'}]]
			this.departments.forEach(dept => {
				if (this.metrictype == '') chartdata.push([dept.name, dept.query, '#651FFF', dept.static, '#E91E63'])
				else if (this.metrictype == 'Query') chartdata.push([dept.name, dept.query, '#651FFF'])
				else if (this.metrictype == 'Static') chartdata.push([dept.name, dept.static, '#E91E63'])
			})

			// done loading, draw chart on next tick
			Vue.nextTick(() => {
				this.drawBarChart(chartdata)
			})
		},

		// render line chart - takes a resize param so that animation only happens on initial load
		drawBarChart(_data) {
			if (this.isLoading) return

			// apply data
			var data = google.visualization.arrayToDataTable(_data)

			// chart options
			var options = {
				// title: 'Total Metrics by Department' + ((this.metrictype) ? ' (' + this.metrictype.toLowerCase() + ' only)' : ''),
				height: 250+8,
				width: '100%',
				titleTextStyle: { color: 'grey' },
				legend: {
					position: 'top',
					textStyle: {
						color: '#212121'
					}
				},
				backgroundColor: 'transparent',
				hAxis: {
					textStyle: {
						color: '#212121'
					},
					gridlines: {
						color: 'grey'
					},
					baselineColor: 'grey'
				},
				vAxis: {
					gridlines: {
						color: '#E0E0E0'
					},
					textStyle: { color: '#212121' },
					baselineColor: 'black',
					minValue: 0
				},
				series: {
					0: { color: this.metrictype == 'Static' ? '#E91E63' : '#651FFF' },
					1: { color: '#E91E63' }
				},
				isStacked: true,
				amimation: {
					startup: true,// this.config.hasOwnProperty('anim') ? this.config.anim : false,
					duration: 1000
				}
			}

			// fix weird error with loading google charts multiple times
			if (typeof(google.visualization.ColumnChart) == 'undefined') return

			// draw chart
			var chart = new google.visualization.ColumnChart(document.getElementById('barchart-by-dept'))
			chart.draw(data, options)
		}
	}
}
</script>

<style scoped>
.outer {
	height: 100%;
}
.line-chart-container {
	height: 100%;
}
.title {
	font-size: 1.4rem;
	font-family: 'Product Sans';
	padding: 8px;
	border-radius: 5px 5px 0 0;
}
.background {
	border-radius: 0 0 5px 5px;
	height: 100%;
	padding: 16px;
	position: relative;
	/*border-top: 6px solid #512da8;*/
}
.btn-flat.active {
	background-color: #512da8 !important;
	color: white !important;
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
