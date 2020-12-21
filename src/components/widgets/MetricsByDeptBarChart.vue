<template>
	<div :id="compid + '-outer'" class="card outer">

		<div class="title grey lighten-2 grey-text text-darken-1 center-align">
			{{ title }}

			<i v-if="hasError || hasWarning" class="material-icons darken-1"
				:class="{'red': hasError, 'orange': hasWarning}">{{hasError ? 'error' : 'warning'}}</i>
			<i v-if="config.why" :data-tooltip="config.why" data-delay="0"
				class="material-icons right tooltipped pointy">help</i>
		</div>

		<div :id="compid" :ref="compid" class="content center-align"
			:class="{'grey': hasError, 'lighten-4': hasError, 'white': !hasError}">

			<div v-if="isLoading" class="loader"></div>

			<div v-show="!isLoading && !hasError">
				<div>
					<b>Sitename: </b>
					<a class="btn-flat grey lighten-2" @click="setSitename('metricPublic')" :class="{ active : metricsitename == 'metricPublic' }">Metrics</a>
					<a class="btn-flat grey lighten-2" @click="setSitename('stat')" :class="{ active : metricsitename == 'stat' }">Stats</a>
					<b>Type: </b>
					<a class="btn-flat grey lighten-2" @click="setType('')" :class="{ active : metrictype == '' }">All</a>
					<a class="btn-flat grey lighten-2" @click="setType('query')" :class="{ active : metrictype == 'query' }">Query</a>
					<a class="btn-flat grey lighten-2" @click="setType('static')" :class="{ active : metrictype == 'static' }">Static</a>
				</div>

				<div :id="chartID" class="chart-holder"></div>
				
			</div>

		</div>

	</div>
</template>

<script>
import Vue from 'vue'
export default {
	name: 'MetricsByDeptBarChart',					// USED IN Admin.vue
	components: {},
	props: {
		// compid
		config: {
			type: Object,
			required: false,
			default: null,
		},
	},
	data () {
		return {
			debug: true,
			needsMatInit: true,		// materialize init
			setupWaiting: false,
			needsDraw: true,
			isDrawing: false,

			metricsitename: 'metricPublic',
			includeInternal: false,
			metrictype: '',

			calcDepartments: null,

			colChart: null,
			chartdata: null,
			chartoptions: null,
		}
	},

	computed: {
			// store.state
			storeIsLoading() { return this.$store.state.isLoading },
			storeIsRefreshing() { return this.$store.state.softReloading },
			googleChartsLoaded() { return this.$store.state.googleChartsLoaded },
			// store.getters
			isStats() { return this.$store.getters.isStats },
			departmentsLoading() { return this.$store.getters.isLoading_categories },
			departments() { return this.$store.getters.categoriesByType('department') },
				countDepartments(){ return this.departments.length },
			routeDepts() { return this.$store.getters.routeDepts },		// categories + all + none
				category_all() { return this.routeDepts.find(routeDept => routeDept.deptParam == 'all') },

		isLoading() {
			if (this.departmentsLoading || this.storeIsLoading) return true
			else return this.needsDraw
		},

		compid(){
			if(this.config && this.config.hasOwnProperty('compid') && this.config.compid) return this.config.compid
			else return 'deptbarchart'
		},
		chartID() { return this.compid + '-chart-holder' },

		// Metrics and Stats on Admin
		allMetrics() {
			return this.$store.getters.metricsByPayload({ status: 'deployed' })
		},

		filteredDepartments (){
			return this.calcDepartments.filter((dept) => {
				if(this.metricsitename == 'metricPublic'){
					if(!this.includeInternal){
						if(this.metrictype == '') return dept.metrics.total > 0
						else return dept.metrics[this.metrictype] > 0
					}
					else{
						if(this.metrictype == '') return (dept.metrics.total + dept.metrics_internal.total) > 0
						else return (dept.metrics[this.metrictype] + dept.metrics_internal[this.metrictype]) > 0
					}
				}
				else if(this.metricsitename == 'stat'){
					if(this.metrictype == '') return dept.stats.total > 0
					else return dept.stats[this.metrictype] > 0
				}
			})
		},
		countFilteredDepartments(){ return this.filteredDepartments.length },

		title() {
			var title = 'Total Metrics by Department'
			if(this.metricsitename == 'stat') title = 'Total Stats by Department'
			if(this.metrictype != ''){
				title += ' - ' + this.metrictype + ' only'
			}
			if(this.storeIsLoading) title += ' (Loading...)'
			return title
		},
	},

	watch: {
		// setup after charts load (if not loaded on mount)
		googleChartsLoaded:{
			immediate: false,
			handler(newVal, oldVal) {
				if(newVal && this.needsDraw && this.setupWaiting){
					this.calculateDataForChart()
				}
			}
		},
		// recalculate when metrics refresh
		storeIsRefreshing:{
			immediate: false,
			handler(newVal, oldVal) {
				if(!newVal && oldVal){
					if( this.countFilteredDepartments > 0 ){
						this.calculateDataForChart()
					}
					else{
						if(this.debug) console.log('post refresh needs clear')
						this.clearCalc();
						if(this.colChart) this.colChart.clearChart()
						this.needsDraw = true
					}
				}
			}
		},
		// setup chart again when sitename changes (no need to recalculate)
		metrictype:{
			immediate: false,
			handler(newVal, oldVal) {
				if(!this.isDrawing){
					this.setupChartData()
				}
			}
		},
		// setup chart again when type changes (no need to recalculate)
		metricsitename:{
			immediate: false,
			handler(newVal, oldVal) {
				if(!this.isDrawing){
					this.setupChartData()
				}
			}
		},
	},

	// START
	mounted() {
		if(this.debug) console.log('Mounted')
		$(window).resize(this.resizer)
		this.init()
	},

	// remove window resize listener
	beforeDestroy() {
		if(this.debug) console.log('Destroy')
		if(this.colChart) this.colChart.clearChart()
		$(window).off('resize', this.resizer)
	},

	methods: {
		init() {
			if(this.debug) console.log('init')
			if(this.needsMatInit) this.initMaterialize()

			if(this.googleChartsLoaded) this.calculateDataForChart()
			else this.setupWaiting = true
		},
		initMaterialize() {
			$('.tooltipped').tooltip()
			this.needsMatInit = false
		},

		setType(type) {
			this.metrictype = type
		},
		setSitename(sitename) {
			this.metricsitename = sitename
		},

		calculateDataForChart() {
			if(this.debug) console.log('calculateDataForChart')
			var depts = []
			this.allMetrics.forEach(metric => {
				var exists = false
				var type = this.$store.getters.metricType(metric)
				var sitename = this.$store.getters.metricSitename(metric)
				for(var i in depts) {
					if(depts[i].name == metric.Department.replace(' ', '\n')) {
						exists = true
						depts[i].total++
						if(sitename && sitename.toLowerCase() == 'metricpublic'){
							depts[i].metrics.total++
							if(type && type.toLowerCase() == 'query') depts[i].metrics.query++
							if(type && type.toLowerCase() == 'static') depts[i].metrics.static++
						}
						else if(sitename && sitename.toLowerCase() == 'stat'){
							depts[i].stats.total++
							if(type && type.toLowerCase() == 'query') depts[i].stats.query++
							if(type && type.toLowerCase() == 'static') depts[i].stats.static++
						}
						else if(sitename && sitename.toLowerCase() == 'metricinternal'){
							depts[i].internal_metrics.total++
							if(type && type.toLowerCase() == 'query') depts[i].internal_metrics.query++
							if(type && type.toLowerCase() == 'static') depts[i].internal_metrics.static++
						}
					}
				}
				if (!exists) {
					depts.push({
						name: metric.Department.replace(' ', '\n'),
						total: 1,
						metrics: {
							total: (sitename && sitename.toLowerCase() == 'metricpublic') ? 1 : 0,
							query: (sitename && sitename.toLowerCase() == 'metricpublic' && type && type.toLowerCase() == 'query') ? 1 : 0,
							static: (sitename && sitename.toLowerCase() == 'metricpublic' && type && type.toLowerCase() == 'static') ? 1 : 0,
						},
						stats: {
							total: (sitename && sitename.toLowerCase() == 'stat') ? 1 : 0,
							query: (sitename && sitename.toLowerCase() == 'stat' && type && type.toLowerCase() == 'query') ? 1 : 0,
							static: (sitename && sitename.toLowerCase() == 'stat' && type && type.toLowerCase() == 'static') ? 1 : 0,
						},
						internal_metrics: {
							total: (sitename && sitename.toLowerCase() == 'metricinternal') ? 1 : 0,
							query: (sitename && sitename.toLowerCase() == 'metricinternal' && type && type.toLowerCase() == 'query') ? 1 : 0,
							static: (sitename && sitename.toLowerCase() == 'metricinternal' && type && type.toLowerCase() == 'static') ? 1 : 0,
						},
					})
				}
			})

			this.calcDepartments = depts.sort((a,b) => {
				if (a.name < b.name) return -1
				if (a.name > b.name) return 1
				return 0
			})

			this.setupChartData()
		},

		setupChartData() {
			if(this.debug) console.log('setupChartData')
			this.isDrawing = true

			/* DATA TABLE */
			// create datatable, add department column (always exists)
			if(this.needsDraw){
				this.chartdata = new google.visualization.DataTable()
				this.chartdata.addColumn('string')
			}
			// remove all rows, query and static columns
			else{
				var numRows = this.chartdata.getNumberOfRows()
				if(numRows > 0) this.chartdata.removeRows(0, numRows)
				var numCols = this.chartdata.getNumberOfColumns() - 1
				if(numCols > 0) this.chartdata.removeColumns(1, numCols)
			}

			// add query and static columns according to selected type
			if (this.metrictype == '' || this.metrictype == 'query'){
				this.chartdata.addColumn('number', 'Query')
				this.chartdata.addColumn({ type: 'string', role: 'style' })
			}
			if (this.metrictype == '' || this.metrictype == 'static'){
				this.chartdata.addColumn('number', 'Static')
				this.chartdata.addColumn({ type: 'string', role: 'style' })
			}

			this.filteredDepartments.forEach(dept => {
				if (this.metrictype == '') this.chartdata.addRow([dept.name, dept.metrics.query, '#651FFF', dept.metrics.static, '#E91E63'])
				else if (this.metrictype == 'query') this.chartdata.addRow([dept.name, dept.metrics.query, '#651FFF'])
				else if (this.metrictype == 'static') this.chartdata.addRow([dept.name, dept.metrics.static, '#E91E63'])
			})

			if(this.needsDraw){
				var chartheight = $('#' + this.compid).height() - 48;
				var chartwidth = $('#' + this.compid).width() - 32;

				/* OPTIONS */
				this.chartoptions = {
					width: chartwidth,
					height: chartheight,
					chartArea: { top: 40, height: '55%' },
					titleTextStyle: { color: 'grey' },
					backgroundColor: 'transparent',
					hAxis: {
						textPosition: 'out',
						textStyle: { color: '#212121', fontSize: 12 },
						gridlines: { color: 'grey' },
						baselineColor: 'grey',
						maxTextLines: 3,
						slantedText: true,
					},
					vAxis: {
						gridlines: { color: '#E0E0E0' },
						textStyle: { color: '#212121' },
						baselineColor: 'black',
						minValue: 0
					},
					series: {
						0: { color: this.metrictype == 'static' ? '#E91E63' : '#651FFF' },
						1: { color: '#E91E63' }
					},
					isStacked: true,
					amimation: {
						startup: true,
						duration: 1000
					}
				}
				this.renderColChart()
			}
			else{
				if(this.metrictype == 'static') this.chartoptions.series[0].color = '#E91E63'
				else this.chartoptions.series[0].color = '#651FFF'

				this.redrawColChart()
			}
		},

		renderColChart() {
			this.colChart = new google.visualization.ColumnChart(document.getElementById(this.chartID))
			this.colChart.draw(this.chartdata, this.chartoptions)
			this.needsDraw = false
			this.isDrawing = false
		},
		redrawColChart() {
			if(this.colChart == null) console.error('colChart null')
			else{
				var chartheight = $('#' + this.compid).height() - 48;
				var chartwidth = $('#' + this.compid).width() - 32;

				this.chartoptions.width = chartwidth;
				this.chartoptions.height = chartheight;

				this.colChart.draw(this.chartdata, this.chartoptions)
				this.isDrawing = false
			}
		},
		resizer() {
			if(!this.needsDraw && !this.isDrawing){
				this.isDrawing = true
				this.redrawColChart()
			}
		},
	}
}
</script>

<style scoped>
.outer.card {
	height: 100%;
}

.title {
	font-size: 1.4rem;
	font-family: 'Product Sans';
	margin: 0;
	padding: 8px 16px;
}

.content {
	height: calc(100% - 48px);
	padding: 16px;
}
.colchart-holder {
	height: 100%;
	width: 100%;
}

.btn-flat.active {
	background-color: #5A348D !important;
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
