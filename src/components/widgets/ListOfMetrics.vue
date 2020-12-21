<template>
	<div :id="compid" class="card" :class="{ 'donna': routeName == 'Donna', 'low-padding': (isLandingPageCarousel || isDetailCarousel) }">
		<div class="title col-purple white-text left-align">
			{{ title }}
			<small v-if="countFilteredMetrics > 0" class="white-text">( {{ countFilteredMetrics }} )</small>
			<i v-if="config.why" class="material-icons right tooltipped" :data-tooltip="config.why" data-delay="0">help</i>
			<i v-if="isLandingPageCarousel" @click="fetchLPCarousel"
				class="material-icons right" :class="{ active : storeIsRefreshing }">refresh</i>
		</div>
		<div class="background white">
			<div class="filters">
				<b>Sort by: </b>
				<a :id="compid + '-sorter-dropdown'" :data-activates="compid + '-sorter-content'" class="dropdown-button btn">
					{{ sorter.by == 'CurrentColor' ? 'Value' : 'Name' }}
					<i class="material-icons right">
						{{ sorter.order == 1 ? 'arrow_downward' : 'arrow_upward' }}
					</i>
				</a>
				<ul :id="compid + '-sorter-content'" class="dropdown-content">
					<li :class="{ active: sorter.by == 'realtimeshortname' }">
						<a @click="setSorter('realtimeshortname')">
							Name
							<i v-if="sorter.by == 'realtimeshortname'" class="material-icons right">
								{{ sorter.order == 1 ? 'arrow_upward' : 'arrow_downward' }}
							</i>
						</a>
					</li>
					<li :class="{ active: sorter.by == 'CurrentColor' }">
						<a @click="setSorter('CurrentColor')">
							Value
							<i v-if="sorter.by == 'CurrentColor'" class="material-icons right">
								{{ sorter.order == 1 ? 'arrow_upward' : 'arrow_downward' }}
							</i>
						</a>
					</li>
				</ul>
			</div>

			<div class="filters" v-if="!onlyStats">
				<b>Filter by: </b>

				<a :id="compid + '-filter-dropdown'" :data-activates="compid + '-filter-content'" class="dropdown-button btn">
					{{ filter1.value == 'red' ? 'Delayed' : filter1.value == 'light-green' ? 'On track' : filter1.value == 'green' ? 'Exceeding Expectations' : 'All' }}
				</a>
				<ul :id="compid + '-filter-content'" class="dropdown-content">
					<li :class="{ active: filter1.attr == '' }">
						<a @click="setFilter(1)">
							All
						</a>
					</li>
					<li :class="{ active: filter1.value == 'red' }">
						<a @click="setFilter(1, 'red', 'CurrentColor')">
							Delayed
						</a>
					</li>
					<li :class="{ active: filter1.value == 'light-green' }">
						<a @click="setFilter(1, 'light-green', 'CurrentColor')">
							On Track
						</a>
					</li>
					<li :class="{ active: filter1.value == 'green' }">
						<a @click="setFilter(1, 'green', 'CurrentColor')">
							Exceeding Expectations
						</a>
					</li>
				</ul>
			</div>
			<div class="loader" v-if="isLoading"></div>
			<ListOfDepartmentsButton v-if="isEditable && !departmentsLoading"
				:config="{compid: compid+'-deptdropdown'}" :filteredDepartments="filteredDepartments" :callback="setDepartment" class="edit-button" />
			<table v-if="!isLoading" class="highlight bordered">
				<thead>
					<tr>
						<th class="col-purple-text">Metric</th>
						<th v-if="showDeptCol" class="col-purple-text hide-on-small-only">Dept</th>
						<th v-if="isCombo" class="col-purple-text hide-on-small-only">Type</th>
						<th v-if="!onlyStats" class="col-purple-text">Goal</th>
						<th class="center-align col-purple-text">Value</th>
						<th class="center-align col-purple-text hide-on-med-and-down">Weekly Avg</th>
						<th class="center-align col-purple-text hide-on-small-only">Monthly Avg</th>
						<th v-if="isAdmin" class="center-align col-purple-text">Location</th>
						<th v-if="isAdmin" class="center-align col-purple-text">Status</th>
						<th v-if="isAdmin" class="center-align col-purple-text">Edit</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="metric in splitMetrics[page-1]">
						<td @click="gotoMetric(metric)" class="grey-text text-darken-2">{{ metric.realtimeshortname }}</td>
						<td v-if="showDeptCol" @click="gotoMetric(metric)" class="grey-text text-darken-2 hide-on-small-only">{{ metric.Department }}</td>

						<td v-if="isCombo" @click="gotoMetric(metric)" class="grey-text text-darken-2 hide-on-small-only">{{ getTypeOfText(metric) }}</td>
						<!--<td v-if="!onlyQuery" @click="gotoMetric(metric)" class="grey-text text-darken-2 hide-on-small-only"><small>{{ checkIfStatic(metric) ? 'static' : '' }}</small></td>-->

						<td v-if="!onlyStats" @click="gotoMetric(metric)" class="grey-text text-darken-2">
							{{ !(checkIfStat(metric)) ? metric.metricgoal : '' }}
						</td>

						<td @click="gotoMetric(metric)" class="center-align value" :class="getTextColor(metric, 'current')">
							{{ metricValue(metric, 'current') }}
						</td>
						<td @click="gotoMetric(metric)" class="center-align value hide-on-med-and-down" :class="getTextColor(metric, 'weekly')">
							{{ metricValue(metric, 'weekly') }}
						</td>
						<td @click="gotoMetric(metric)" class="center-align value hide-on-small-only" :class="getTextColor(metric, 'monthly')">
							{{ metricValue(metric, 'monthly') }}
						</td>

						<td v-if="isAdmin" @click="gotoMetric(metric)" class="grey-text text-darken-2 hide-on-small-only">{{ getLocationText(metric) }}</td>
						<td v-if="isAdmin" @click="gotoMetric(metric)" class="grey-text text-darken-2 hide-on-small-only">{{ getStatusText(metric) }}</td>

						<td v-if="isEditable" class="center-align grey-text text-darken-2">
							<a @click="gotoMetricForm(metric)" class="btn-flat grey lighten-2">
								<i class="material-icons">edit</i>
							</a>
						</td>
					</tr>
					<tr v-if="filteredMetrics.length == 0">
						<td :colspan="noMetricsColSpan" class="center-align grey-text text-darken-2">No Metrics Found Here</td>
					</tr>
				</tbody>
			</table>
			<div v-if="!isLoading && splitMetrics.length > 1" class="page-system left-align">
				<ul class="pagination">
				    <li class="pointy" :class="{ disabled : page == 1 }" @click="setPage(page == 1 ? page : page-1, true)">
				    	<a><i class="material-icons">chevron_left</i></a>
				    </li>
				    <li v-for="(split, idx) in splitMetrics.length" class="pointy" :class="{ active : page == (idx+1) }">
				    	<a @click="setPage(idx+1, true)">{{ idx+1 }}</a>
				    </li>
				    <li class="pointy" :class="{ disabled : page == splitMetrics.length }">
				    	<a @click="setPage(page == splitMetrics.length ? page : page+1, true)"><i class="material-icons">chevron_right</i></a>
				    </li>
				</ul>
				<div class="autoplay">
					<div class="progress" v-if="autoplay">
						<div class="determinate" :style="'width: '+ progress +'%'"></div>
					</div>
					<div class="switch">
					    <label>
							Auto-cycle?
							<input type="checkbox" v-model="autoplay">
							<span class="lever"></span>
					    </label>
				  	</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
import ListOfDepartmentsButton from '../widgets/ListOfDepartmentsButton'
export default {
	name: 'ListOfMetrics',					// USED IN Details.vue, Stats.vue, Admin.vue, Default.vue, Donna.vue
	components: { ListOfDepartmentsButton },
	props: {
		config: {
			type: Object,
			required: true,
		},
		// used by statsCarousel and metricsCarousel
		currentCategory: {
			type: Object,
			required: false,
			default: null,
		},
		saveSettings: {
			type: Object,
			required: false,
			default: null,
		},
	},
	data () {
		return {
			debug: false,
			needsInit: true,
			needsMatInit: true,
			needsInit_timer: true,

			department: null,
			isLoadingSaved: true,
			sorter: {
				by: 'realtimeshortname',
				order: 1,
			},
			filter1: { attr: '', value: '' },
			filter2: { attr: '', value: '' },
			filter3: { attr: '', value: '' },	// unused
			page: 1,
			timer: null,
			autoplay: true,
			progress: 100
		}
	},

	computed: {
			// route
			routeName() { return this.$route.name },
			routeParams() { return this.$route.params },
			locationParam() { return this.routeParams.location },
			deptParam() { return this.routeParams.dept },

			// store.getters
			isStats() { return this.$store.getters.isStats },
			departmentsLoading() { return this.$store.getters.isLoading_categories },
			departments() { return this.$store.getters.categoriesByType('department') },
			routeDepts() { return this.$store.getters.routeDepts },		// categories + all + none
				category_all() { return this.routeDepts.find(routeDept => routeDept.deptParam == 'all') },

			// store.state or store.getters
			storeIsLoading() {
				if(this.isLandingPageCarousel) return this.$store.getters.isLoading_landingPageCarousel
				else if(this.isStatsCarousel || this.isMetricsCarousel) return this.$store.getters.isLoading_detailCarousel
				else return this.$store.state.isLoading
			},
			storeIsRefreshing() {
				if(this.isLandingPageCarousel) return this.$store.state.landingPageCarouselSoftReloading
				else if(this.isStatsCarousel || this.isMetricsCarousel) return this.$store.state.detailCarouselSoftReloading
				else return this.$store.state.softReloading
			},

		isLoading() { return this.storeIsLoading || this.isLoadingSaved },

		compid() {
			if(this.isLandingPageCarousel) return 'landingcarousel'
			else if(this.isStatsCarousel) return 'statscarousel'
			else if(this.isMetricsCarousel) return 'metricscarousel'
			else if(this.config && this.config.hasOwnProperty('compid')) return this.config.compid
			else return 'listcarousel'
		},

		// set in config
		timestamp() { return this.config.hasOwnProperty('timestamp') ? this.config.timestamp : null },
		isLandingPageCarousel() { return (this.config.hasOwnProperty('type') && this.config.type == 'landingPageCarousel') },
		isDetailCarousel() { return (this.isStatsCarousel || this.isMetricsCarousel) },
		isStatsCarousel() { return (this.config.hasOwnProperty('type') && this.config.type == 'statsCarousel') },
		isMetricsCarousel() { return (this.config.hasOwnProperty('type') && this.config.type == 'metricsCarousel') },
		detailCarouselCategory() {
			if(this.isDetailCarousel){
				if(this.currentCategory){
					if(this.currentCategory.hasOwnProperty('id')) return this.currentCategory
					// handle if not provided fullCategory
					else return this.$store.getters.fullCategory(this.currentCategory)
				}
				// handle if not provided currentCategory (statsCarousel and metricsCarousel is required)
				else if(this.deptParam) return this.$store.getters.fullCategoryByDeptParam(this.deptParam)
				else return this.category_all
			}
			else return null
		},

		// set either in config or by route
		isAdmin() {
			if(this.config.hasOwnProperty('admin')) return this.config.admin
			else return (this.routeName == 'Admin')
		},
		isEditable() {
			if(this.config.hasOwnProperty('editable')) return this.config.editable
			else return false
		},
		detailsEditing() {
			if(this.isDetailCarousel){
				if(this.config.hasOwnProperty('editing')) return this.config.editing
				else return (this.routeName == 'DetailsEdit' || this.routeName == 'DetailsWithIdEdit')
			}
			else return false
		},

		metrics_included() {
			if(this.storeIsLoading) return []
			else if (this.isLandingPageCarousel) {
				// including both static and query, deployed only
				return this.$store.state.landingPageCarousel
			}
			else if (this.isDetailCarousel) {
				// including both static and query, deployed only, filter by category (from route)
				if(this.detailCarouselCategory && this.detailCarouselCategory.id != 'all'){
					return this.$store.getters.detailCarouselByPayload({ category: this.detailCarouselCategory, checkAll: true })
				}
				else return this.$store.state.detailCarousel
			}
			// query metrics only, filtered by department
			else {
				if(this.isLoadingSaved) return []
				else if(this.department.id != 'all'){
					return this.$store.getters.metricsByPayload({ type: 'query', category: this.department, status: 'deployed' })
				}
				else return this.$store.getters.metricsByPayload({ type: 'query', status: 'deployed' })
			}
		},
		// filtered by dropdown values
		filteredMetrics() {
			return this.metrics_included.filter(metric => {
				var keep = true
				if (this.filter1.attr) keep = metric[this.filter1.attr] == this.filter1.value
				if (!keep) return false
				if (this.filter2.attr) keep = metric[this.filter2.attr] == this.filter2.value
				if (!keep) return false
				if (this.filter3.attr) keep = metric[this.filter3.attr] == this.filter3.value
				return keep
			})
		},
		countFilteredMetrics(){ return this.filteredMetrics.length },
		sortedMetrics(){
			return this.filteredMetrics.sort((a,b) => {
				if(this.sorter.by == 'CurrentColor'){
					var colorA = this.getColorOrder(a[this.sorter.by])
					var colorB = this.getColorOrder(b[this.sorter.by])
					if(colorA > colorB) return 1
					if(colorA < colorB) return -1
				}
				else if(isNaN(a[this.sorter.by]) || isNaN(b[this.sorter.by])){
					if(a[this.sorter.by].toLowerCase().replace(/ /g, '') > b[this.sorter.by].toLowerCase().replace(/ /g, '')) return (this.sorter.order)
					if(a[this.sorter.by].toLowerCase().replace(/ /g, '') < b[this.sorter.by].toLowerCase().replace(/ /g, '')) return (this.sorter.order*-1)
				}
				else{
					var comp = a[this.sorter.by] - b[this.sorter.by]
					if(comp > 0) return (this.sorter.order)
					if(comp < 0) return (this.sorter.order*-1)
				}
				if(this.sorter.by != 'realtimeshortname'){
					if(a.realtimeshortname.toLowerCase().replace(/ /g, '') > b.realtimeshortname.toLowerCase().replace(/ /g, '')) return 1
					if(a.realtimeshortname.toLowerCase().replace(/ /g, '') < b.realtimeshortname.toLowerCase().replace(/ /g, '')) return -1
				}
				return 0
			})
		},
		splitMetrics() {
			var splits = []
			var pageSize = ((this.config.hasOwnProperty('pageSize') && this.config.pageSize) ? this.config.pageSize : 10)
			var _copy = JSON.parse(JSON.stringify(this.sortedMetrics))
			while (_copy.length) {
				splits.push(_copy.slice(0,pageSize))
				_copy = _copy.slice(pageSize)
			}
			return splits
		},

		queryMetrics() {
			if(!this.isLandingPageCarousel && !this.isDetailCarousel){
				return this.$store.getters.metricsByPayload({ type: 'query', status: 'deployed' })
			}
		},
		filteredDepartments(){
			if(this.isEditable && !this.departmentsLoading){
				if(this.queryMetrics.length == 0) return this.departments
				else return this.departments.filter(department => {
					return this.queryMetrics.some(metric => {
						var metricCategory = this.$store.getters.metricCategory({ metric: metric, type: 'department' })
						if(metricCategory && metricCategory.toLowerCase() == department.id.toLowerCase()) return true
					})
				})
			} else return null
		},

		title(){
			var title = ''
			if(this.isLandingPageCarousel || this.isDetailCarousel){
				if(this.isLandingPageCarousel) title = 'All Departments'
				else{
					if(this.detailCarouselCategory) title = this.detailCarouselCategory.display
					else title = 'ERROR'
				}
				if(this.storeIsLoading) title += ' (Loading...)'
			}
			else{
				if(this.department){
					if(this.department.id != 'all') title = this.department.display
					else title = 'All Departments'
					if(this.storeIsLoading) title += ' (Loading...)'
				}
				else if(this.isLoadingSaved) title = 'Loading...'
				else title = 'ERROR'
			}
			return title
		},
		showDeptCol(){
			if(this.isLandingPageCarousel) return true
			else if(this.isDetailCarousel){
				if(this.detailCarouselCategory) return (this.detailCarouselCategory.type != 'department')
				else return true
			}
			else if(this.department) return (this.department.id == 'all')
			else return false
		},
		noMetricsColSpan(){
			var len = 4
			if(this.showDeptCol) len++
			if(this.isCombo) len++
			if(!this.onlyQuery) len++
			if(!this.onlyStats) len++
			if(this.isAdmin) len += 3
			return len
		},

		onlyMetrics(){ return ( this.isMetricsCarousel || (!this.isStats && !this.isAdmin && !this.isLandingPageCarousel && !this.isStatsCarousel) ) },
		onlyStats(){ return ( this.isStatsCarousel || (this.isStats && !this.isAdmin && !this.isLandingPageCarousel && !this.isMetricsCarousel) ) },
		isCombo(){ return (this.isAdmin || this.isLandingPageCarousel) },
		onlyQuery(){ return !(this.isLandingPageCarousel || this.isStatsCarousel || this.isMetricsCarousel) },
	},

	watch: {

		autoplay:{
			immediate: false,
			handler(newVal, oldVal) {
				console.log('autoplay: ' + oldVal + ' -> ' + newVal)
				if( newVal ) this.startTimer()
				else this.setPage(this.page, true)
			},
		},
		isLoading:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('isLoading: ' + oldVal  + ' -> ' + newVal)
				// during load, reset timer, needs initialization again
				if(newVal && !oldVal){
					this.resetTimer()
					this.needsInit_timer = true
				}
				// after load
				else{
					// set page so if current page is out of range, it will go back to pg 1
					this.setPage(this.page, false)
					// start timer if needed
					if(this.needsInit_timer){
						Vue.nextTick(this.initTimer)
					}
				}
			},
		},
		timestamp:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.isStatsCarousel || this.isMetricsCarousel){
					if(this.debug) console.log('routeParams changed: /' + newVal.location)
				}
			},
		},

		//debug
		storeIsLoading:{	// debug only
			immediate: true,
			handler(newVal, oldVal) {
				if(this.debug) console.log('storeIsLoading: ' + oldVal  + ' -> ' + newVal)
			},
		},
	},

	mounted() {
		if(this.debug) console.log('Mounted')
		this.init()
	},

	beforeDestroy() {
		if(this.debug) console.log('Destroy')
		$('#' + this.compid + '-sorter-dropdown').dropdown('destroy')
		$('#' + this.compid + '-filter-dropdown').dropdown('destroy')
	},

	methods: {
		init(){
			if(this.timer) this.timer = clearInterval(this.timer)

			if(this.routeName.toLowerCase() == 'donna'){
				this.sorter.by = 'CurrentColor'
				this.sorter.order = -1
			}
			else if(this.config.hasOwnProperty('sorter')){
				if(this.config.sorter.hasOwnProperty('by') && this.config.sorter.by) this.sorter.by = this.config.sorter.by
				if(this.config.sorter.hasOwnProperty('order') && this.config.sorter.order){
					if(this.config.sorter.order == -1 || this.config.sorter.order == 1) this.sorter.order = this.config.sorter.order
					else if(this.config.sorter.order.toLowerCase().startsWith('a')){
						if(this.sorter.by == 'CurrentColor') this.sorter.order = -1
						else this.sorter.order = 1
					}
					else if(this.config.sorter.order.toLowerCase().startsWith('d')){
						if(this.sorter.by == 'CurrentColor') this.sorter.order = 1
						else this.sorter.order = -1
					}
				}
			}
			if(this.needsMatInit) this.initMaterialize()	// dropdowns visible initially so can call on init

			// don't start timer if config autoplay is off
			if(this.config.hasOwnProperty('autoplay') && !this.config.autoplay) this.autoplay = this.config.autoplay

			if(this.isLandingPageCarousel || this.isStatsCarousel || this.isMetricsCarousel) this.isLoadingSaved = false
			else if(this.saveSettings) this.checkLocalStorage()
			else{
				this.department = this.category_all
				this.isLoadingSaved = false
			}

			this.needsInit = false
		},
		initMaterialize(){
			$('#' + this.compid + '-sorter-dropdown').dropdown({
				constrainWidth: true, // Does not change width of dropdown to that of the activator
				belowOrigin: true,  // Displays dropdown below the button
				alignment: 'left' // Displays dropdown with edge aligned to the left of button
			})
			$('#' + this.compid + '-filter-dropdown').dropdown({
				constrainWidth: false, // Does not change width of dropdown to that of the activator
				belowOrigin: true,  // Displays dropdown below the button
				alignment: 'left' // Displays dropdown with edge aligned to the left of button
			})
			this.needsMatInit = false
		},

		initTimer(){
			if(this.debug) console.log('initTimer')
			if(this.autoplay) this.startTimer()
			this.needsInit_timer = false
		},
		startTimer() {
			if(this.debug) console.log('startTimer')
			this.timer = setInterval(function() {
				this.progress -= 10
				if (this.progress <= 0) this.setPage(this.page+1, false)
			}.bind(this), 1000)
		},
		restartTimer(){
			if(this.debug) console.log('restartTimer')
			this.page = 1	// goto page 1
			this.progress = 100		// start 10 seconds again
			if(!this.config.hasOwnProperty('autoplay') || this.config.autoplay){
				// if autoplay was cancelled, call starttimer through watcher
				if(!this.autoplay) this.autoplay = true
				//else call starttimer directly
				else this.startTimer()
			}
		},
		// clears interval, doesn't change this.autoplay, doesn't change this.page or this.progress yet
		resetTimer(){
			if(this.debug) console.log('resetTimer')
			if(this.timer) this.timer = clearInterval(this.timer)
		},

		setPage(pg, sticky) {
			this.progress = 100
			if (sticky) {
				if(this.timer) this.timer = clearInterval(this.timer)
				this.autoplay = false
			}
			if (pg > this.splitMetrics.length) this.page = 1
			if (pg <= this.splitMetrics.length && pg >= 1) this.page = pg
		},

		gotoMetric(metric) {
			if(this.detailsEditing) this.gotoMetricEdit(metric)
			else{
				var metricLinks = this.$store.getters.metricLinks(metric)
				if(metricLinks.editOnly){
					if(!this.isAdmin){
						console.error('EDIT ONLY ROUTE')
					}
					else this.gotoMetricEdit(metric)
				}
				else{
					var params = metricLinks.viewParams
					if(this.isLandingPageCarousel || this.isStatsCarousel || this.isMetricsCarousel || metricLinks.viewRedirect){
						var fullViewURL = metricLinks.viewURL + '/dashboard/' + params.location + '/details/' + params.dept + '/' + params.id
						window.open(fullViewURL, '_blank');
					}
					else this.$router.push({ name: 'DetailsWithId', params: params })
				}
			}
		},
		gotoMetricEdit(metric) {
			var metricLinks = this.$store.getters.metricLinks(metric)
			this.$router.push({ name: 'DetailsWithIdEdit', params: metricLinks.editParams })
		},
		gotoMetricForm(metric) {
			var metricLinks = this.$store.getters.metricLinks(metric)
			window.open(metricLinks.formURL, '_blank');
		},

		setFilter(id, filter, attr) {
			this.resetTimer()
			this['filter'+id].attr = attr ? attr : ''
			this['filter'+id].value = filter ? filter : ''
			this.restartTimer()
		},
		setSorter(by) {
			this.resetTimer()
			if (this.sorter.by == by){
				this.sorter.order = this.sorter.order*-1
			}
			else{
				this.sorter.by = by
				this.sorter.order = 1
				if(by == 'CurrentColor' && this.routeName.toLowerCase() == 'donna') this.sorter.order = -1
			}
			this.restartTimer()
		},
		setDepartment(department) {
			if(this.debug) console.log('setDepartment')
			if (!department) return
			this.resetTimer()
			var fullCategory
			if(typeof department === 'object'){
				if(department.hasOwnProperty('id')) fullCategory = department
				else fullCategory = this.$store.getters.fullCategory(department)
			}
			else{
				console.error('ERROR - must send department object')
				fullCategory = this.category_all
			}
			this.department = fullCategory
			this.restartTimer()
			if (this.saveSettings) this.saveSettings.callback(this.compid, department.display)
		},

		metricValue(metric, col) {
			var isStatic = false
			if(!this.onlyQuery){
				isStatic = this.checkIfStatic(metric)
			}

			if(!isStatic || (isStatic && col == 'current')){
				var metricValue = this.$store.getters.metricValue({metric: metric, val: col, short: true})
				if(metricValue.error) return '[[error 1000]]'
				else return metricValue.str
			}
			else return '---'
		},
		checkIfStat(metric){
			if(this.onlyStats) return true
			else if(this.onlyMetrics) return false
			else return this.$store.getters.checkIfStat(metric)
		},
		checkIfStatic(metric){
			if(this.onlyQuery) return false
			else return this.$store.getters.checkIfStatic(metric)
		},
		getTextColor(metric, col){
			if(this.checkIfStatic(metric)){
				if(col == 'current') return 'grey-text text-darken-1'
				else return 'grey-text'
			}
			else return metric.CurrentColor + '-text text-darken-1'
		},
		get_metricRouteLocation(metric){
			return this.$store.getters.metricRouteLocation(metric)
		},
		getTypeOfText(metric){
			if(this.isCombo) return this.get_metricRouteLocation(metric).typeOf

			/*var typeOf = '', type = ''
			if(this.isCombo) typeOf = this.get_metricRouteLocation(metric).typeOf
			if(!this.onlyQuery && this.checkIfStatic(metric)) type = 'Static'
			if(typeOf && type) return typeOf + ' - ' + type
			else if(type) return type
			else return typeOf*/
		},
		getLocationText(metric){
			return this.get_metricRouteLocation(metric).display
		},
		getStatusText(metric){
			var status = this.$store.getters.metricStatus(metric)
			if(!status) return '?'
			else if(status == 'deployed') return 'Public'
			else if(status == 'review') return 'Review'
			else return 'Development'
		},

		getColorOrder(color){
			if(color === null) return 4
			else if(color.toLowerCase() == 'grey') return 4
			else if(color.toLowerCase() == 'light-green') return 2
			else if(color.toLowerCase() == 'green'){
				if(this.sorter.order < 0) return 3
				else return 1
			}
			else if(color.toLowerCase() == 'red'){
				if(this.sorter.order < 0) return 1
				else return 3
			}
			else return 5
		},

		// for refreshing
		fetchLPCarousel() {
			if(this.debug) console.log('Landing Page Carousel - fetch metrics')
			this.$store.dispatch('clearLandingPageCarousel')
			this.$store.dispatch('fetchLandingPageCarousel')
		},

		checkLocalStorage() {
			try {
				if (localStorage.getItem(this.saveSettings.localStorageKey)) {
					var _root = JSON.parse(localStorage.getItem(this.saveSettings.localStorageKey))
					if (_root.hasOwnProperty(this.compid)){
						var departmentDisplay = _root[this.compid]
						var savedDepartment = this.$store.getters.findCategoryByDisplay({ type:'department', display: departmentDisplay})
						if(!savedDepartment) this.department = this.category_all
						else this.department = savedDepartment
						this.isLoadingSaved = false
					}
					else{
						this.department = this.category_all
						this.isLoadingSaved = false
					}
				}
				else{
					this.department = this.category_all
					this.isLoadingSaved = false
				}
			} catch(e) {
				console.error(e)
				this.department = this.category_all
				this.isLoadingSaved = false
			}
		},
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.pointy {
	cursor: pointer;
}

/* colors */
.col-purple {
    background-color: #5A348D !important;
    color: white;
}
.col-purple-text{
	color: #5A348D !important;
}

.donna .background {
	padding: 0 24px;
}
.background {
	height: 100%;
	padding: 16px 24px;
	position: relative;
}
.card {
	margin-bottom: 0;
}
.dark .background {
	background-color: rgba(0,0,0,0.1)
}

.edit-button {
	position: absolute;
	top: 0;
	right: 8px;
	padding: 0;
}

.title {
	font-size: 1.4rem;
	font-family: 'Product Sans';
	padding: 8px 16px;
}

.donna table > thead > tr > th, .donna table > tbody > tr > td {
	padding: 8px 5px !important;
}
.low-padding table > thead > tr > th, .low-padding table > tbody > tr > td {
	padding: 5px 5px !important;
}
table > tbody > tr > td a {
	padding: 0 16px;
}

table.highlight > tbody > tr:hover {
    background-color: rgba(0,0,0, 0.2);	/* grey */
    cursor: pointer;
}
table td.value:not(.static-metric) {
	font-family: 'Product Sans';
	font-weight: bold;
	font-size: 1.25rem;
}
table td.value.static-metric {
	font-family: 'Product Sans';
	font-size: 1rem;
}

/* buttons */
.switch label input[type=checkbox]:checked + .lever{
	background-color: #AD9AC6;	/*light purple*/
}
.btn, .btn-flat, .switch label input[type=checkbox]:checked + .lever:after {
	background-color: #5A348D; /*col purple*/
	color: white;
}
.btn-flat.active {
    background-color: #3c225d;
    color: white;
}

/* dropdowns */
.dropdown-content li > a, .dropdown-content li > span {
	color: #5A348D;		/*col purple*/
}
/*.dropdown-content li.active {
	background-color: #9FC24C;	 med green
}*/
.dropdown-content li:hover, .dropdown-content li.active:hover{
  background-color: rgba(0,0,0, 0.2);	/* grey */
}

/* filters */
.filters {
	margin-right: 16px;
	display: inline-block;
}
.filter {
	margin: 0 16px 32px 16px;
	display: inline-block;
}
.filter a {
	margin-top: 4px;
}

/* pages */
.page-system .pagination li.active {
	background-color: #9FC24C;	/* med green */
}
.progress {
	background-color: #CEC2DD; /*lightest purple*/
}
.page-system {
	user-select: none;
}
.page-system .pagination, .page-system .autoplay {
	display: inline-block;
}
.progress .determinate {
	background-color: #5A348D;	/*col purple*/
	transition: none !important;
	-webkit-transition: none !important;
}

/* loading */
.loader {
    border: 6px solid #D1C4E9;
    border-top: 6px solid #673AB7;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 2s linear infinite;
    display: inline-block;
}
i.material-icons.active {
	animation: spin 2s linear infinite;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
/* transitions */
.fade-enter-active, .fade-leave-active {
  transition: all 0.5s;
}
.fade-enter, .fade-leave-to{
  opacity: 0;
  transform: translate3d(0, 100px,0);
}
.slideup-transition {
	transition: transform 5s ease-in-out;
}
.slideup-enter, .slideup-leave {
	transform: translate3d(0, -100px, 0);
}

</style>
