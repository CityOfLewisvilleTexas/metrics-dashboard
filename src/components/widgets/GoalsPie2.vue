<template>
	<div :id="compid + '-outer'" class="card outer">
		<div class="title grey lighten-2 grey-text text-darken-1">
			{{ title }}
			<i class="material-icons right tooltipped" :data-tooltip="config.why" data-delay="0" v-if="config.why">help</i>
		</div>
		<div :id="compid" class="content center-align white">
			<canvas class="cvs"></canvas>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
import Chart from 'chart.js'
export default {
	name: 'GoalsPie2',					// USED IN Default.vue, Donna.vue
	components: {},
	props: {
		// compid, noBackground, dept(? - display)
		config: {
			type: Object,
			required: true,
		},
	},
	data () {
		return {
			debug: true,
			needsDraw: true,

			goalsChart: null,
			calcsums: {
				red: 0,
				yellow: 0,
				green: 0
			},
			calcpct: {
				red: 0,
				yellow: 0,
				green: 0
			},
		}
	},

	computed: {
		storeIsLoading() { return this.$store.state.isLoading },
		storeIsRefreshing() { return this.$store.state.softReloading },
		departmentsLoading(){ return this.$store.getters.isLoading_categories },
		routeDepts() { return this.$store.getters.routeDepts },
		category_all() { return this.routeDepts.find(routeDept => routeDept.deptParam == 'all') },

		compid(){
			if(this.config && this.config.hasOwnProperty('compid')) return this.config.compid
			else if(this.department) return 'goalspie2-' + this.department.id
			//else if(this.config && this.config.hasOwnProperty('dept')) return 'goalspie2-' + this.config.dept.toLowerCase().replace(/ /g, '')
			else return 'goalspie2'
		},
		department(){
			if(this.config.hasOwnProperty('dept')){
				if(!this.departmentsLoading){
					var dept = this.$store.findCategoryByDisplay({ type:'department', display: this.config.dept })
					if(!dept) dept = this.category_all
					return dept
				} else return null
			}
			else return this.category_all
		},
		deptID(){
			if(this.department) return this.department.id
		},

		filteredMetrics() {
			if(this.storeIsLoading || this.departmentsLoading) return []
			else {
				if(this.deptID && this.deptID != 'all'){
					return this.$store.getters.metricsByPayload({ type: 'query', category: this.department })
				}
				else return this.$store.getters.metricsByPayload({ type: 'query' })
			}
		},
		countFilteredMetrics(){ return this.filteredMetrics.length },

		title() {
			var title = ''
			if(this.department) title = this.department.display + ' Metrics'
			else if(this.config.hasOwnProperty('dept')) title = this.config.dept + ' Metrics'
			if(this.storeIsLoading) title += ' (Loading...)'
			return title
		},
	},

	watch: {
		// ensures that chart is destroyed and needsDraw is set when this component is recycled
		deptID:{
			immediate: false,
			handler(newVal, oldVal) {
				if(newVal){
					if(this.debug) console.log('department changed')
					this.clearCalc();
					if(this.goalsChart) this.goalsChart.destroy()
					this.needsDraw = true
				}
			},
		},
		storeIsRefreshing:{
			immediate: false,
			handler(newVal, oldVal) {
				if(!newVal && oldVal){
					if( this.countFilteredMetrics > 0 ){
						this.calculateDataForChart()
					}
					else{
						if(this.debug) console.log('post refresh needs clear')
						this.clearCalc();
						if(this.goalsChart) this.goalsChart.destroy()
						this.needsDraw = true
					}
				}
			},
		},
	},

	mounted() {
		if(this.debug) console.log('Mounted')
		$('.tooltipped').tooltip()
		if(!this.storeIsRefreshing && this.countFilteredMetrics > 0) this.calculateDataForChart()
	},

	beforeDestroy() {
		if(this.debug) console.log('Destroy')
		if(this.goalsChart) this.goalsChart.destroy()
		$('.tooltipped').tooltip('destroy')
	},

	methods: {
		calculateDataForChart() {
			if(this.debug) console.log('calculateDataForChart')
			var sums = {
				red: 0,
				yellow: 0,
				green: 0
			}
			this.filteredMetrics.forEach((metric) => {
				if (metric.CurrentColor == 'green') sums.green++
				else if (metric.CurrentColor == 'light-green') sums.yellow++
				else if (metric.CurrentColor == 'red') sums.red++
			})
			var pct = {
				red: sums.red / this.filteredMetrics.length,
				yellow: sums.yellow / this.filteredMetrics.length,
				green: sums.green / this.filteredMetrics.length
			}

			if( this.needsDraw || !(this.compareCalculated(sums, pct))) this.formatDataForChart(sums, pct)
		},
		compareCalculated(sums, pct){
			if(this.calcsums.red != sums.red) return false
			if(this.calcsums.yellow != sums.yellow) return false
			if(this.calcsums.green != sums.green) return false
			if(this.calcpct.red != pct.red) return false
			if(this.calcpct.yellow != pct.yellow) return false
			if(this.calcpct.green != pct.green) return false
			return true
		},
		// set up data to go into line chart
		formatDataForChart(sums, pct) {
			if(this.debug) console.log('formatDataForChart')
			this.calcsums = sums
			this.calcpct = pct

			//this.chartdata = [ ['Label', 'Total'], ['Exceeding expectations ' + pct.green.toString(), sums.green], ['On track ' + pct.yellow.toString(), sums.yellow], ['Delayed ' + pct.red.toString(), sums.red] ]

			var newlabels = [
				'Exceeding expectations (' + (pct.green*100).toFixed(2).toString() + '%)',
				'On track (' + (pct.yellow*100).toFixed(2).toString() + '%)',
				'Delayed (' + (pct.red*100).toFixed(2).toString() + '%)'
			]
			var newdata = [
				sums.green,
				sums.yellow,
				sums.red
			]

			// only draw once
			if(this.needsDraw){
				var config = {
					type: 'doughnut',
					data: {
						labels: newlabels,
						datasets: [
							{
								data: newdata,
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

				var ctx = document.querySelector('#' + this.config.compid + ' canvas.cvs')
				Vue.nextTick(() => { this.drawPieChart(ctx, config) })
			}
			// update chart data object to new values, duration 0 means no redraw animation
			else{
				if(this.goalsChart == null) console.error('goalsChart null')
				else{
					if(this.debug) console.log('update chart')
					this.goalsChart.data.labels = newlabels
					this.goalsChart.data.datasets[0].data = newdata
					this.goalsChart.update({ duration: 0 })
				}
			}
		},

		// render line chart - takes a resize param so that animation only happens on initial load
		drawPieChart(ctx, config) {
			if(this.debug) console.log('draw chart')
			this.goalsChart = new Chart(ctx, config)
			this.needsDraw = false
		},

		clearCalc(){
			this.calcsums = { red: 0, yellow: 0, green: 0 }
			this.calcpct = { red: 0, yellow: 0, green: 0 }
		},
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
