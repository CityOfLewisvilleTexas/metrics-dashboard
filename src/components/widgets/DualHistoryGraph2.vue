<template>
	<div :id="compid + '-outer'" class="card outer">
		<div class="title grey lighten-2 grey-text text-darken-1">
			{{ title }}
			<i class="material-icons right tooltipped pointy" :data-tooltip="config.why" data-delay="0" v-if="config.why">info</i>
		</div>
		<div :id="compid" class="content white center-align">
			<canvas class="cvs"></canvas>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'
import Moment from 'moment'
import Chart from 'chart.js'
export default {
	name: 'DualLineChart2',					// USED IN Default.vue
	components: {},
	props: {
		// compid, title, recordid1, recordid2, min, anim
		config: {
			type: Object,
			required: true,
		},
	},
	data () {
		return {
			debug: true,
			needsDraw: true,

			// loading/refreshing just this component history data
			isLoading1: true,
			isRefreshing1: true,
			isLoading2: true,
			isRefreshing2: true,

			historyChart: null,

			metricdata1: [],
			metricdata2: [],

			chartdates: [],
			chartdata1: [],
			chartdata2: [],

			metric1Timeout: null,
			metric2Timeout: null,
		}
	},

	computed: {
		storeIsLoading() { return this.$store.state.isLoading },
		storeIsRefreshing() { return this.$store.state.softReloading },

		isLoading(){ return this.isLoading1 || this.isLoading2 },
		isRefreshing(){ return this.isRefreshing1 || this.isRefreshing2 },

		compid(){
			if(this.config && this.config.hasOwnProperty('compid')) return this.config.compid
			else return 'dualhistory2'
		},
		metric1() {
			if(!this.storeIsLoading && this.config.recordid1) return this.$store.getters.findMetricByID({ id: this.config.recordid1} )
			else return null
		},
		metricusp1(){
			if(this.metric1) return this.metric1.uspname
			else return null
		},
		metric2(){
			if(!this.storeIsLoading && this.config.recordid2) return this.$store.getters.findMetricByID({ id: this.config.recordid2} )
			else return null
		},
		metricusp2(){
			if(this.metric2) return this.metric2.uspname
			else return null
		},
		title() {
			var title = ''
			if(this.config && this.config.hasOwnProperty('title')) return this.config.title
			else if(this.metric1 && this.metric2) title = this.metric1.realtimeshortname + ' / ' + this.metric2.realtimeshortname
			else title = 'Dual History Graph'
			if(this.storeIsLoading) title += ' (Loading...)'
			return title
		},
		datalabel1() {
			if(this.isLoading2) return 'Loading...'
			else if(this.config && this.config.hasOwnProperty('label1')) return this.config.label1
			else if(this.metric1) return this.metric1.realtimeshortname
			else return 'ERROR'
		},
		datalabel2() {
			if(this.isLoading2) return 'Loading...'
			else if(this.config && this.config.hasOwnProperty('label2')) return this.config.label2
			else if(this.metric2) return this.metric2.realtimeshortname
			else return 'ERROR'
		},

		error(){
			var err = ''
			if(!this.config.recordid1 || !this.config.recordid2) err += '\tConfig: 2 record ids not provided'
			else if(!this.storeIsLoading){
				if(!this.metric1 || !this.metric2){
					if(!this.metric1) err += '\tMetric not found - id: ' + this.config.recordid1
					if(!this.metric2) err += '\tMetric not found - id: ' + this.config.recordid2
				}
				else if(!this.isRefreshing){
					if(this.metricdata1.length == 0) err += '\tNo Metric Data - id: ' + this.config.recordid1
					if(this.metricdata2.length == 0) err += '\tNo Metric Data - id: ' + this.config.recordid1
				}
			}
			return err;
		},
		hasError(){
			return this.error.length > 0
		},
	},

	watch: {
	// ensures that isloading set when this component is recycled
		metricusp1:{
			immediate: false,
			handler(newVal, oldVal) {
				if(newVal){
					if(this.debug) console.log('metricusp1 changed')
					this.clearChartdata1();
					if(this.historyChart) this.historyChart.destroy()
					this.needsDraw = true
					this.chartdates = []
				}
			},
		},
		metricusp2:{
			immediate: false,
			handler(newVal, oldVal) {
				if(newVal){
					if(this.debug) console.log('metricusp2 changed')
					this.clearChartdata2();
					if(this.historyChart) this.historyChart.destroy()
					this.needsDraw = true
					this.chartdates = []
				}
			},
		},
		storeIsRefreshing:{
			immediate: false,
			handler(newVal, oldVal) {
				if(!newVal && oldVal){
					if(this.metricusp1 && this.metricusp2){
						this.fetchData()
					}
					else{
						if(this.debug) console.log('post refresh needs clear')
						this.clearChartdata1();
						this.clearChartdata2();
						if(this.historyChart) this.historyChart.destroy()
						this.needsDraw = true
						this.chartdates = []
					}
				}
				//else this.calculateDatesForChart()
			},
		},
		isRefreshing:{
			immediate: false,
			handler(newVal, oldVal) {
				if(!newVal && oldVal){
					if(this.metricdata1.length > 0 && this.metricdata2.length > 0) this.calculateDatesForChart()
				}
			},
		},
		hasError:{
			immediate: false,
			handler(newVal, oldVal) {
				if(newVal){
					console.error(this.error)
				}
			},
		},

	},

	mounted() {
		if(this.debug) console.log('Mounted')
		$('.tooltipped').tooltip()
		if(!this.storeIsRefreshing && this.metricusp1 && this.metricusp2) this.fetchData()
	},
	beforeDestroy() {
		if(this.debug) console.log('Destroy')
		this.clearChartdata1()
		this.clearChartdata2()
		if(this.historyChart) this.historyChart.destroy()
		$('.tooltipped').tooltip('destroy')
	},

	methods: {
		fetchData(){
			this.fetchMetric1();
			this.fetchMetric2();
		},

		// fetch widget data
		fetchMetric1() {
			if(this.debug) console.log('fetchMetric1')
			this.isRefreshing1 = true

			// fetch
			axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
				// webservice: 'Performance Measures/Get Details or History',
				uspName: this.metricusp1,
				DetOrAvg: 'AGG'
			}).then(results => {
				this.metricdata1 = results.data[0]
				this.isRefreshing1 = false
				this.isLoading1 = false
			}).catch(function(error){
				console.error('Webservice not returned - ' + this.metricusp1)
				// if already have data, wait for next refresh to try again
				if(this.metricdata1.length > 0){
					this.isRefreshing1 = false
					this.isLoading1 = false
				}
				else{
					this.metric1Timeout = setTimeout(this.fetchMetric1, 2000)
				}
			})
		},

		// fetch widget data
		fetchMetric2(from) {
			if(this.debug) console.log('fetchMetric2')
			this.isRefreshing2 = true

			// fetch
			axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
				// webservice: 'Performance Measures/Get Details or History',
				uspName: this.metricusp2,
				DetOrAvg: 'AGG'
			}).then(results => {
				this.metricdata2 = results.data[0]
				this.isRefreshing2 = false
				this.isLoading2 = false
			}).catch(function(error){
				console.error('Webservice not returned - ' + this.metricusp2)
				if(this.metricdata2.length > 0){
					this.isRefreshing2 = false
					this.isLoading2 = false
				}
				else{
					this.metric2Timeout = setTimeout(this.fetchMetric2, 2000)
				}
			})
		},

		calculateDatesForChart() {
			if(this.debug) console.log('calculateDataForChart')

			var dates = this.metricdata1.map(row => row.date).concat(this.metricdata2.map(row => row.date))
			this.chartdates = dates.filter((item, pos) => { return dates.indexOf(item) == pos })

			// fixes any gaps in data
			this.chartdata1 = this.fillInGaps(this.metricdata1, this.chartdates)
			this.chartdata2 = this.fillInGaps(this.metricdata2, this.chartdates)

			this.formatDataForChart(this.chartdata1, this.chartdata2, this.chartdates)
		},
		// set up data to go into line chart
		formatDataForChart(_data1, _data2, _dates) {
			if(this.debug) console.log('formatDataForChart')

			var newlabels = _dates.map(date => Moment.utc(date).format('YYYY-MM-DD')).sort()
			var newdata1 = _data1.map(row => row.value)
			var newdata2 = _data2.map(row => row.value)
			var newmin = this.config.hasOwnProperty('min') ? Math.min(this.config.min, Math.min(..._data1.map(row => row.value))*0.99, Math.min(..._data2.map(row => row.value))*0.99) : Math.min(Math.min(..._data1.map(row => row.value))*0.99, Math.min(..._data2.map(row => row.value))*0.99)
			var newmax = Math.max(Math.max(..._data1.map(row => row.value))*1.01, Math.max(..._data2.map(row => row.value))*1.01)

			// only draw once
			if(this.needsDraw){
				var config = {
					type: 'line',
					data: {
						labels: newlabels,
						datasets: [
							{
								label: this.datalabel1,
								backgroundColor: 'rgba(33,150,243 ,0.2)',
								borderColor: 'rgba(33,150,243 ,1)',
								data: newdata1,
								spanGaps: false,
							},
							{
								label: this.datalabel2,
								backgroundColor: 'rgba(244,67,54 ,0.2)',
								borderColor: 'rgba(244,67,54 ,1)',
								data: newdata2,
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
									suggestedMin: newmin,
									suggestedMax: newmax,
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
				var ctx = document.querySelector('#'+this.config.compid+' canvas.cvs')
				Vue.nextTick(() => { this.drawLineChart(ctx, config) })
			}
			else{
				if(this.historyChart == null) console.error('goalsChart null')
				else{
					if(this.debug) console.log('update chart')
					this.historyChart.data.labels = newlabels
					this.historyChart.data.datasets[0].data = newdata1
					this.historyChart.data.datasets[1].data = newdata2
					this.historyChart.update({ duration: 0 })
				}
			}
		},

		// render line chart - takes a resize param so that animation only happens on initial load
		drawLineChart(ctx, config) {
			if(this.debug) console.log('draw chart')
			this.historyChart = new Chart(ctx, config)
			this.needsDraw = false
		},

		fillInGaps(arr, dates) {
			dates.forEach(date => {
				if (arr.map(row=>row.date).indexOf(date) == -1) arr.push({ date: date, value: null, lastimported: null })
			})
			return arr.sort((a,b) => {
				if (a.date < b.date) return -1
				if (a.date > b.date) return 1
				return 0
			})
		},
		clearChartdata1(){
			if(this.debug) console.log('clearChartdata1')
			this.isLoading1 = true
			if(this.metric1Timeout) clearTimeout(this.metric1Timeout)
			this.metricdata1 = []
			this.chartdata1 = []
		},
		clearChartdata2(){
			if(this.debug) console.log('clearChartdata2')
			this.isLoading2 = true
			if(this.metric2Timeout) clearTimeout(this.metric2Timeout)
			this.metricdata2 = []
			this.chartdata2 = []
		},
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
