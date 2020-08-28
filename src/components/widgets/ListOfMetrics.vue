<template>
	<div :id="config.compid" class="card" :class="{ donna: $route.name == 'Donna', 'met-carousel': $route.name == 'Carousel' }">
		<div class="title grey lighten-2 grey-text text-darken-1 left-align" v-if="!isLoading">
			{{ department }}
			<small class="grey-text">( {{ metrics.length }} )</small>
			<i class="material-icons right tooltipped" :data-tooltip="config.why" data-delay="0" v-if="config.why">help</i>
		</div>
		<div class="background white">
			<div class="filters">
				<b>Sort by: </b>
				<a id="sorter-button" class="dropdown-button btn" data-activates="sorter-dropdown">
					{{ sorter.by == 'CurrentColor' ? 'Value' : 'Name' }}
					<i class="material-icons right">
						{{ sorter.order == 1 ? 'arrow_upward' : 'arrow_downward' }}
					</i>
				</a>
				<ul id="sorter-dropdown" class="dropdown-content">
					<li>
						<a class=""
							@click="setSorter('realtimeshortname')"
							:class="{ active: sorter.by == 'realtimeshortname' }">
							Name
						</a>
					</li>
					<li>
						<a class=""
							@click="setSorter('CurrentColor')"
							:class="{ active: sorter.by == 'CurrentColor' }">
							Value
						</a>
					</li>
				</ul>
			</div>

			<div class="filters" v-if="!isLoading && (!isStats || (isStats && !isCarousel))">
				<b>Filter by: </b>

				<a id="filter-button" class="dropdown-button btn" data-activates="filter-dropdown">
					{{ filter1.value == 'red' ? 'Delayed' : filter1.value == 'light-green' ? 'On track' : filter1.value == 'green' ? 'Exceeding Expectations' : 'All' }}
				</a>
				<ul id="filter-dropdown" class="dropdown-content">
					<li>
						<a class=""
							@click="setFilter(1)"
							:class="{ active: filter1.attr == '' }">
							All
						</a>
					</li>
					<li>
						<a class=""
							@click="setFilter(1, 'red', 'CurrentColor')"
							:class="{ active: filter1.value == 'red' }">
							Delayed
						</a>
					</li>
					<li>
						<a class=""
							@click="setFilter(1, 'light-green', 'CurrentColor')"
							:class="{ active: filter1.value == 'light-green' }">
							On Track
						</a>
					</li>
					<li>
						<a class=""
							@click="setFilter(1, 'green', 'CurrentColor')"
							:class="{ active: filter1.value == 'green' }">
							Exceeding Expectations
						</a>
					</li>
				</ul>
			</div>
			<ListOfDepartmentsButton :compid="config.compid+'-listbutton'" :callback="setDepartment" class="edit-button" v-if="config.editable" />
			<div class="loader" v-if="isLoading"></div>
			<table v-if="!isLoading" class="highlight bordered">
				<thead>
					<tr>
						<th class="grey-text">Metric</th>
						<th class="grey-text hide-on-small-only" v-if="department == 'All Departments'">Dept</th>
						<th class="grey-text hide-on-small-only" v-if="isCarousel">Type</th>
						<th class="grey-text" v-if="(!isStats || (isStats && !isCarousel))">Goal</th>
						<th class="center-align grey-text">Value</th>
						<th class="center-align grey-text hide-on-med-and-down">Weekly Avg</th>
						<th class="center-align grey-text hide-on-small-only">Monthly Avg</th>
						<th class="center-align grey-text" v-if="admin">Location</th>
						<th class="center-align grey-text" v-if="admin">Edit</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="metric in splitMetrics[page-1]">
						<td @click="gotoMetric(metric)" class="grey-text text-darken-2">{{ metric.realtimeshortname }}</td>
						<td @click="gotoMetric(metric)" class="grey-text text-darken-2 hide-on-small-only" v-if="department == 'All Departments'">
							{{ metric.Department }}
						</td>
						<td @click="gotoMetric(metric)" class="grey-text text-darken-2 hide-on-small-only" v-if="isCarousel">{{ showSitename(metric) }}</td>
						<td @click="gotoMetric(metric)" class="grey-text text-darken-2" v-if="(!isStats || (isStats && !isCarousel))">
							{{ !(checkIfStat(metric)) ? metric.metricgoal : '' }}
						</td>
						<td @click="gotoMetric(metric)" class="center-align text-darken-1 value" :class="!(checkIfStat(metric)) ? (metric.CurrentColor+'-text' || 'grey-text') : 'grey-text'">
							{{ correctValue(metric.CurrentValue, metric) }}
						</td>
						<td @click="gotoMetric(metric)" class="center-align text-darken-1 value hide-on-med-and-down" :class="!(checkIfStat(metric)) ? (metric.CurrentColor+'-text' || 'grey-text') : 'grey-text'">
							{{ correctValue(metric.WeeklyValue, metric) }}
						</td>
						<td @click="gotoMetric(metric)" class="center-align text-darken-1 value hide-on-small-only" :class="!(checkIfStat(metric)) ? (metric.CurrentColor+'-text' || 'grey-text') : 'grey-text'">
							{{ correctValue(metric.MonthlyValue, metric) }}
						</td>
						<td class="center-align grey-text text-darken-2" v-if="admin">
							    <select class="browser-default" @change="setMetricLocation(metric.psofia_recordid, $event)">
							      <option value="public" :selected="metric.metricispublic">Public</option>
							      <option value="internal" :selected="metric.metricisinternal">Internal</option>
							      <option value="stat" :selected="!(checkIfStat(metric))">Stat</option>
							      <option value="development" :selected="metric.metricstatus == 'development'">Development</option>
							      <option value="review" :selected="metric.metricstatus == 'review'">Review</option>
							    </select>
						</td>
						<td class="center-align grey-text text-darken-2" v-if="admin">
							<a class="btn-flat grey lighten-2"
								:href="'http://eservices.cityoflewisville.com/psofia/node/index.html?form=42&amp;recordnumber='+metric.psofia_recordid"
								target="_blank">
								<i class="material-icons">edit</i>
							</a>
						</td>
					</tr>
				</tbody>
			</table>
			<div class="page-system left-align" v-if="splitMetrics.length > 1">
				<ul class="pagination" v-if="!isLoading">
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
				<div class="autoplay" v-if="!isLoading">
					<div class="progress" v-if="autoplay">
						<div class="determinate" :style="'width: '+ progress +'%'"></div>
					</div>
					<div class="switch">
					    <label>
							Auto-cycle?
							<input type="checkbox" v-model="autoplay">
							<span class="lever"></span>
							<!-- on -->
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
	name: 'ListOfMetrics',
	components: {
		ListOfDepartmentsButton
	},
	props: //['saveSettings','admin', 'config'],
		{
			saveSettings: Object,
			admin: Boolean,
			config: Object,
			department: {
				type: String,
				default: 'All Departments'
			}
		},
	data () {
		return {
			//department: 'All Departments',
			sorter: {
				by: this.$route.name == 'Donna' ? 'CurrentColor' : 'realtimeshortname',
				order: this.$route.name == 'Donna' ? 1 : -1,
			},
			filter1: {
				attr: '',
				value: ''
			},
			filter2: {
				attr: '',
				value: ''
			},
			filter3: {
				attr: '',
				value: ''
			},
			adminMetric: {},
			page: 1,
			timer: null,
			autoplay: true,
			progress: 100
		}
	},

	computed: {
		metrics() {
			if (this.config.stats) {
				return this.$store.state.stats
				.filter(metric => {
					var keep = true
					keep = metric.metrictype == 'Query'
					if (!keep) return false
					if (this.filter1.attr)
						keep = metric[this.filter1.attr] == this.filter1.value
					if (!keep) return false
					if (this.filter2.attr)
						keep = metric[this.filter2.attr] == this.filter2.value
					if (!keep) return false
					if (this.filter3.attr)
					keep = metric[this.filter3.attr] == this.filter3.value
					if (!keep) return false
					if (this.department != 'All Departments')
						keep = metric.Department == this.department
					if (!keep) return false
					return keep
				})
				.sort((a,b) => {
					// if (!this.config.sortBy) return
					if (a[this.sorter.by] < b[this.sorter.by]) return (this.sorter.order)
					if (a[this.sorter.by] > b[this.sorter.by]) return (this.sorter.order*-1)
					else {
						if (a.realtimeshortname.toLowerCase().replace(/ /g, '') < b.realtimeshortname.toLowerCase().replace(/ /g, '')) return -1
						if (a.realtimeshortname.toLowerCase().replace(/ /g, '') > b.realtimeshortname.toLowerCase().replace(/ /g, '')) return 1
						return 0
					}
				})
			} else {
				return this.$store.state.metrics
				.filter(metric => {
					var keep = true
					keep = metric.metrictype == 'Query'
					if (!keep) return false
					if (this.filter1.attr)
						keep = metric[this.filter1.attr] == this.filter1.value
					if (!keep) return false
					if (this.filter2.attr)
						keep = metric[this.filter2.attr] == this.filter2.value
					if (!keep) return false
					if (this.filter3.attr)
					keep = metric[this.filter3.attr] == this.filter3.value
					if (!keep) return false
					if (this.department != 'All Departments')
						keep = metric.Department == this.department
					if (!keep) return false
					return keep
				})
				.sort((a,b) => {
					// if (!this.config.sortBy) return
					if (a[this.sorter.by] < b[this.sorter.by]) return (this.sorter.order)
					if (a[this.sorter.by] > b[this.sorter.by]) return (this.sorter.order*-1)
					else {
						if (a.realtimeshortname.toLowerCase().replace(/ /g, '') < b.realtimeshortname.toLowerCase().replace(/ /g, '')) return -1
						if (a.realtimeshortname.toLowerCase().replace(/ /g, '') > b.realtimeshortname.toLowerCase().replace(/ /g, '')) return 1
						return 0
					}
				})
			}
			
		},

		splitMetrics() {
			var splits = []
			var pageSize = (this.config.pageSize ? this.config.pageSize : 10)
			var _copy = JSON.parse(JSON.stringify(this.metrics))
			while (_copy.length) {
				splits.push(_copy.slice(0,pageSize))
				_copy = _copy.slice(pageSize)
			}
			return splits
		},

		departments() {
			var depts = []
			this.$store.state.metrics.forEach(metric => {
				var exists = false
				depts.forEach(cat => {
					if (cat == metric.Department) exists = true
				})
				if (!exists) depts.push(metric.Department)
			})
			return depts.sort((a,b) => {
				if (a < b) return -1
				if (a > b) return 1
				return 0
			})
		},

		isLoading() {
			return this.$store.state.isLoading
		},

		isStats() {
			return this.$store.state.site=='stats'
		},

		isCarousel() {
			return this.$route.name == 'Carousel'
		}
	},

	watch: {

		autoplay() {
			if (this.autoplay) this.startTimer()
			else this.setPage(this.page, true)
		}
	},

	mounted() {
		// $('select').material_select()
		$('.collapsible').collapsible()
		$('#sorter-button').dropdown({
			constrainWidth: true, // Does not change width of dropdown to that of the activator
			belowOrigin: true,  // Displays dropdown below the button
			alignment: 'left' // Displays dropdown with edge aligned to the left of button
		})
		$('#filter-button').dropdown({
			constrainWidth: false, // Does not change width of dropdown to that of the activator
			belowOrigin: true,  // Displays dropdown below the button
			alignment: 'left' // Displays dropdown with edge aligned to the left of button
		})
		if (this.saveSettings) this.checkLocalStorage()
		this.startTimer()
	},

	beforeDestroy() {
	},

	methods: {
		checkLocalStorage() {
			try {
				if (localStorage.getItem(this.saveSettings.localStorageKey)) {
					var _root = JSON.parse(localStorage.getItem(this.saveSettings.localStorageKey))
					if (_root.hasOwnProperty(this.config.compid)) this.department = _root[this.config.compid]
				}
			} catch(e) {
				console.log(e)
			}
		},

		correctValue(value, metric) {
			if (metric.gaugedataformat == 'PERCENT') return Number((value).toFixed(2))+'%'
			else if (metric.prevaluetext == '$') return (value).toFixed(2)
			else return Number(value.toFixed(2))
		},

		setDepartment(department) {
			if (!department) return
			if (department == 'All Departments') this.department = 'All Departments'
			this.department = department
			if (this.saveSettings)
				this.saveSettings.callback(this.config.compid, department)
		},

		// checks both sitename and metricisstat and metricispublic
		checkIfStat(metric){
			if (metric.sitename_VSVal_){
				if(metric.sitename == 'stat'){
					// works for only one (correct) and more than one checked, sitename takes precedence
					if (metric.metricisstat) return true
					else { 
						// works for no checkboxes
						if (!(metric.metricispublic) && !(metric.metricisinternal)) return true
						else return false
					}
				}
				else{
					// if stat is the only one checked, assue wrong sitename, check takes precedence
					if (metric.metricisstat && !(metric.metricispublic) && !(metric.metricisinternal)) return true
					else return false
				}
			}
			else{
				if (metric.metricisstat && !(metric.metricispublic) && !(metric.metricisinternal)) return true
				else return false
			}
		},
		showSitename(metric){
			if (this.checkIfStat(metric)) return 'Stat'
			else return 'Metric'
		},

		gotoMetric(metric) {
			var dept = metric.Department.toLowerCase().replace(/ /g, '')

			if(this.isCarousel){
				if(this.checkIfStat(metric)){
					window.open('http://stats.cityoflewisville.com/d/#/dashboard/stats/details/'+dept+'/'+metric.psofia_recordid, '_blank');
				}
				else{
					window.open('https://metrics.cityoflewisville.com/d/#/dashboard/public/details/'+dept+'/'+metric.psofia_recordid, '_blank');
				}
			}
			else if(this.config.stats && window.location.hostname.startsWith('metrics')){
				window.open('http://stats.cityoflewisville.com/d/#/dashboard/stats/details/'+dept+'/'+metric.psofia_recordid, '_blank');
			}
			else{
				var isStats = this.$route.fullPath.toLowerCase().indexOf('stats') != -1 || this.config.stats
				// go to the details page
				this.$router.push({ path: '/dashboard/' + ((isStats) ? 'stats' : 'public') + '/details/'+dept+'/'+metric.psofia_recordid })//, query: { id: id }})
			}
		},

		setFilter(id, filter, attr) {
			this['filter'+id].attr = attr ? attr : ''
			this['filter'+id].value = filter ? filter : ''
			this.page = 1
			this.progress = 100
		},

		setSorter(by) {
			this.sorter.by = by
			this.sorter.order = this.sorter.order*-1
			this.page = 1
			this.progress = 100
		},

		setMetricLocation(id, e) {
			console.log(id, e.target.value)
		},

		startTimer() {
			this.timer = setInterval(function() {
				this.progress -= 10
				if (this.progress <= 0) this.setPage(this.page+1, false)
			}.bind(this), 1000)
		},

		setPage(pg, sticky) {
			this.progress = 100
			if (sticky) {
				clearInterval(this.timer)
				this.autoplay = false
			}
			if (pg > this.splitMetrics.length) this.page = 1
			if (pg <= this.splitMetrics.length && pg >= 1) this.page = pg
		},

		test(metric) {
			console.log(metric)
		}
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.donna td {
	padding: 8px 5px;
}

.met-carousel td {
	padding: 5px 5px;
}
.met-carousel .btn, .met-carousel .progress .determinate, .met-carousel .switch label input[type=checkbox]:checked + .lever:after {
	background-color: #5A348D;
}
.met-carousel .title {
	background-color: #5A348D !important;
}
.met-carousel li a.active {
	background-color: #73529E !important;
}
.met-carousel .progress {
	background-color: #CEC2DD;
}
.met-carousel .switch label input[type=checkbox]:checked + .lever{
	background-color: #AD9AC6;
}
.met-carousel .pagination li.active {
	background-color: #9FC24C;
}
.met-carousel .dropdown-content li > a {
	color: #5A348D;
}
.met-carousel th {
	color: #5A348D !important;
}
.met-carousel .title, .met-carousel .title small {
	color: #FFF !important;
}

.background {
	height: 100%;
	padding: 16px 24px;
	position: relative;
	overflow-x: scroll;
}
.pointy {
	cursor: pointer;
}
.title {
	font-size: 1.4rem;
	font-family: 'Product Sans';
	padding: 8px 16px;
}
table.highlight > tbody > tr:hover {
    background-color: rgba(0,0,0, 0.2);
    cursor: pointer;
}
table td.value {
	font-family: 'Product Sans';
	font-weight: bold;
	font-size: 1.25rem;
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
.edit-button {
	position: absolute;
	top: 0;
	right: 0;
}
li a.active {
	background-color: #512da8 !important;
	color: white !important;
}
.btn-flat.active {
    background-color: #512da8 !important;
    color: white !important;
}
.collapsible, .collapsible-body, .collapsible-header {
	border: none;
}
.filters {
	display: inline-block;
	margin-right: 16px;
}
.filter {
	margin: 0 16px 32px 16px;
	display: inline-block;
}
.filter a {
	margin-top: 4px;
}
td a {
	padding: 0 16px !important
}
.page-system {
	user-select: none;
}
.page-system .pagination, .page-system .autoplay {
	display: inline-block;
}
.progress .determinate {
	transition: none !important;
	-webkit-transition: none !important;
}
</style>
