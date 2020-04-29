<template>
	<div id="container">
		<div class="navbar-fixed">
            <nav>
				<div id="top-nav" class="nav-wrapper col-purple left-align">
				    <a href="#" data-activates="slide-out" id="details-side" class="button-collapse"><i class="material-icons">menu</i></a>
				    <div class="logo"></div>
				    <div class="brand-logo white-text text-darken-3">City of Lewisville</div>
				    <ul class="right">
						<li v-if="filteredStats.length > 0">
							<a href="#stats_carousel"> stats</a>
						</li>
				    	<li v-if="editing">
				    		<!-- <a class="btn amber black-text" @click="setWorking(1)" v-if="!working">
				    			working
				    		</a>
				    		<a class="btn amber black-text" @click="setWorking(0)" v-else>
				    			normal
				    		</a> -->
				    		<select class="browser-default" v-model="metricLocation">
				    			<option>Public</option>
				    			<option>Review</option>
				    			<option>Development</option>
				    		</select>
				    	</li>
				    	<li v-if="!underLarge">
				    		<!--<router-link class="btn amber black-text" :to="{ name: 'Default' }">
				    			<span>dashboard</span>
				    		</router-link>-->
							<a class="btn amber black-text" :href="landingURL">
				    			<span>dashboard</span>
				    		</a>
				    	</li>
				    	<!-- <li>
				    		<a data-position="left" data-delay="100" data-tooltip="Reset page to defaults" class="tooltipped">
				    			<i class="material-icons">clear_all</i>
				    		</a>
				    	</li> -->
				    	<li>
				    		<a @click="fetchMetrics(true)">
				    			<i class="material-icons" :class="{ active : $store.state.isLoading }">refresh</i>
				    		</a>
				    	</li>
				    </ul>
				</div>
			</nav>
		</div>

	    <main>
		<ul id="slide-out" class="side-nav fixed z-depthx-4">
			<li class="search">
				<SearchMetricsBar class="searchbar" :compid="'small-search'" />
			</li>
			<li class="divider"></li>
			<li class="header">Departments</li>
			<!-- <li class="pointy left-align" @click="setCat({ bmpdisplayname: 'All' })" :class="{ 'blue-grey darken-1' : 'All' == currentCat.display }">
				<a :class="{ 'white-text' : 'All' == currentCat.display }">
					All
					<span class="right">{{ metrics.length }}</span>
				</a>
			</li> -->
			<li v-for="dept in departments" class="pointy left-align" @click="setCat(dept)" :class="{ 'blue-grey darken-1' : dept.bmpdisplayname == currentCat.display }">
				<a :class="{ 'white-text' : dept.bmpdisplayname == currentCat.display }">
					{{ dept.bmpdisplayname }}
					<span class="right">{{ countOf(dept, 'd') }}</span>
				</a>
			</li>
			<li class="divider"></li>
			<li class="header">City Priorities</li>
			<li v-for="priority in citypriorities" class="pointy left-align" @click="setCat(priority)" :class="{ 'blue-grey darken-1' : priority.bmpdisplayname == currentCat.display }">
				<a :class="{ 'white-text' : priority.bmpdisplayname == currentCat.display }">
					{{ priority.bmpdisplayname }}
					<span class="right">{{ countOf(priority, 'p') }}</span>
				</a>
			</li>
			<li class="divider"></li>
			<li class="header">Big Moves</li>
			<li v-for="move in bigmoves" class="pointy left-align" @click="setCat(move)" :class="{ 'blue-grey darken-1' : move.bmpdisplayname == currentCat.display }">
				<a :class="{ 'white-text' : move.bmpdisplayname == currentCat.display }">
					{{ move.bmpdisplayname }}
					<span class="right">{{ countOf(move, 'b') }}</span>
				</a>
			</li>
	    </ul>
	    	<div class="row second-nav">
	    		<div class="col s12 white left-align">
	    			<div class="deptname blue-grey-text text-darken-2">
	    				{{ currentCat.display }}
	    				<small class="grey-text"> ({{ filteredMetrics.length }})</small>
	    			</div>
	    		</div>
	    		<ul class="right">
			    	<li v-if="underLarge">
			    		<!--<router-link class="btn amber black-text" :to="{ name: 'Default' }">
			    			<span>dashboard</span>
			    		</router-link>-->
						<a class="btn amber black-text" :href="landingURL">
							<span>dashboard</span>
						</a>
			    	</li>
			    </ul>
	    	</div>
	    	<div class="row main">
	    		<div class="spinner" v-if="isLoading">
	    			<div class="double-bounce1"></div>
	    			<div class="double-bounce2"></div>
	    		</div>
	    		<ul id="metric-list" class="row" v-else>
			    	<li>
			    		<div class="col s12 left-align" v-if="extraLink">
			    			[See also: <a :href="extraLink.link" target="_blank">{{ extraLink.text }}</a>]
			    		</div>
			    	</li>
	    			<li v-if="filteredMetrics.length == 0">
	    				No metrics found here.
	    			</li>
	    			<li class="col s12 m10 l10 xl8 offset-m1 offset-l1 offset-xl2" v-for="metric in filteredMetrics">
	    				<MetricCard :metric="metric" :editing="editing" />
	    			</li>
	    		</ul>

				<div class="divider" v-if="!isStats"></div>
				<H2 v-if="filteredStats.length > 0 && !isStats">Stats</H2>
				<div  v-if="filteredStats.length > 0 && !isStats" class="row" shortcut>
					<!-- <div class="col s12 l6 xl4 nopad">
					</div> -->
					<div class="col s12 l12 xl10 offset-xl1 grid" id="g6">
						<ListOfMetrics id="stats_carousel" :config="config6" :department="currentCat.display" />
						<!-- :saveSettings="saveSettings" -->
					</div>
				</div>

			</div>
		</main>
	</div>
</template>

<script>
import Vue from 'vue'
import FixedNavBar from '../widgets/FixedNavBar'
import HistoryGraph from '../widgets/HistoryGraph'
import ListOfMetrics from '../widgets/ListOfMetrics'
import KPI from '../widgets/KPI'
import SearchMetricsBar from '../widgets/SearchMetricsBar'
import MetricCard from '../widgets/MetricCard'
export default {
	name: 'Details',
	components: {
		FixedNavBar, HistoryGraph, ListOfMetrics, KPI, SearchMetricsBar, MetricCard
	},
	props: [],
	data () {
		return {
			scrolled: false,
			working: false,
			metricLocation: 'Public',
			landingURL: 'http://metrics.cityoflewisville.com/',
			extraLinks: [
				{
					for: 'Citywide',
					text: 'City survey',
					link: 'http://www.cityoflewisville.com/home/showdocument?id=9746'
				},
				{
					for: 'Finance',
					text: 'Check Register (view all checks issued)',
					link : 'http://eservices.cityoflewisville.com/openbook/'
				},
				{
					for: 'Police',
					text: 'Crime Map',
					link : 'http://communitycrimemap.com/#'
				},
				{
					for: 'Citizen Involvement',
					text: 'Citizen Survey',
					link : 'http://www.cityoflewisville.com/residents-info/resident-information/resident-surveys'
				},
				{
					for: 'Controlling Costs',
					text: 'Check Register (view all checks issued)',
					link : 'http://eservices.cityoflewisville.com/openbook/'
				},
				{
					for: 'Neighborhood Services',
					text: 'PEP Awards Dashboard',
					link : 'http://eservices.cityoflewisville.com/pepawards/'
				}
			],
			config6: {
				compid: 'g6-list',
				editable: false,
				department: this.department ? this.department : 'All Departments',
				stats: true
			}
		}
	},

	computed: {
		underLarge() {
			return this.$store.state.underLarge
		},
		extraLink() {
			for (var link of this.extraLinks) {
				if (link.for == this.currentCat.display) return link
			}
			return null
		},
		isLoading() {
			return this.$store.state.isLoading
		},
		isStats() {
			return this.$route.fullPath.indexOf('stats') != -1
		},
		location() {
			console.log(this.$route)
			return this.$route.params.location
		},
		// sort by query -> static, then alphabetical by name
		metrics() {
			return this.$store.state.metrics.sort((a,b) => {
				if (a.metrictype == b.metrictype) {
					return (a.realtimeshortname < b.realtimeshortname) ? -1 : (a.realtimeshortname > b.realtimeshortname) ? 1 : 0
				}
				else {
					return (a.metrictype < b.metrictype) ? -1 : 1
				}
			})
		},

		stats() {
			return this.$store.state.stats.sort((a,b) => {
				if (a.metrictype == b.metrictype) {
					return (a.realtimeshortname < b.realtimeshortname) ? -1 : (a.realtimeshortname > b.realtimeshortname) ? 1 : 0
				}
				else {
					return (a.metrictype < b.metrictype) ? -1 : 1
				}
			})
		},

		filteredMetrics() {
			if (this.currentCat.id == 'all')
				return this.metrics
			return this.metrics.filter(metric => {
				return metric.category1 == this.currentCat.id || metric.cateogry3 == this.currentCat.id || metric.category2 == this.currentCat.id
			})
		},

		filteredStats() {
			if (this.currentCat.id == 'all')
				return this.stats
			return this.stats.filter(metric => {
				return metric.category1 == this.currentCat.id || metric.cateogry3 == this.currentCat.id || metric.category2 == this.currentCat.id
			})
		},


		departments() {
			return this.$store.state.departments.sort((a,b) => {
				if (a.bmpdisplayname < b.bmpdisplayname) return -1
				if (a.bmpdisplayname > b.bmpdisplayname) return 1
				return 0
			})
		},

		citypriorities() {
			return this.$store.state.citypriorities.sort((a,b) => {
				if (a.bmpdisplayname < b.bmpdisplayname) return -1
				if (a.bmpdisplayname > b.bmpdisplayname) return 1
				return 0
			})
		},

		bigmoves() {
			return this.$store.state.bigmoves.sort((a,b) => {
				if (a.bmpdisplayname < b.bmpdisplayname) return -1
				if (a.bmpdisplayname > b.bmpdisplayname) return 1
				return 0
			})
		},

		currentCat() {
			var cat = {}
			for (var i in this.$store.state.departments) {
				var dept = this.$store.state.departments[i]
				if (dept.bmpdisplayname.replace(/ /g,'').toLowerCase() == this.$route.params.dept)
					return { id: dept.bmpid, display: dept.bmpdisplayname }
			}
			for (var i in this.$store.state.citypriorities) {
				var priority = this.$store.state.citypriorities[i]
				if (priority.bmpdisplayname.replace(/ /g,'').toLowerCase() == this.$route.params.dept)
					return { id: priority.bmpid, display: priority.bmpdisplayname }
			}
			for (var i in this.$store.state.bigmoves) {
				var move = this.$store.state.bigmoves[i]
				if (move.bmpdisplayname.replace(/ /g,'').toLowerCase() == this.$route.params.dept)
					return { id: move.bmpid, display: move.bmpdisplayname }
			}
			return {
				id: 'all',
				display: 'All'
			}
		},

		editing() {
			return (this.$route.params.id == 'edit' || this.$route.params.edit == 'edit')// || localStorage.colAuthToken)
		}
	},

	watch: {
		metrics() {
			if (!this.scrolled) Vue.nextTick(this.checkMetricsForRouteId)
		},
		location() {
			this.checkLocation()
		},
		'$route' (to, from) {
			$('html, body').scrollTop(0)
			this.checkMetricsForRouteId()
		},
		metricLocation() {
			var flags = []
			if (this.metricLocation == 'Public') { this.fetchMetrics(); return }
			else if (this.metricLocation == 'Review') flags = [0,0,0,'','review','','']
			else if (this.metricLocation == 'Development') flags = [0,0,0,'','development','','']
			this.setLocation(...flags)
		},
		editing() {
			if (!this.editing) {
				this.fetchMetrics()
				this.metricLocation = 'Public'
			}
			else {
				authenticate()
			}
		}
	},

	mounted() {
		$("#details-side").sideNav();
		if (this.editing) authenticate()
		if (this.$store.state.metrics.length == 0) this.fetchMetrics()
		Vue.nextTick(this.checkMetricsForRouteId)
	},

	methods: {

		// uses store to fetch metrics
		fetchMetrics(clicked) {

			if (clicked == true) this.scrolled = false

			this.$store.commit('clearMetrics')

			// admin
			var admin = this.$route.fullPath.toLowerCase().indexOf('admin')

			var isStats = this.$route.fullPath.toLowerCase().indexOf('stats') != -1

			// specifies which metrics to fetch
			var _params = {
				public: isStats ? 0 : 1,
				internal: 0,
				stat: isStats ? 1 : 0,
				status: 'deployed',
				type: '',
				master: admin == -1 ? '' : 'all'
			}

			if (this.metricLocation != 'Public'){
				_params.public = 0
				_params.internal = 0
				_params.stat = 0
				_params.sitename = ''
				if (this.metricLocation == 'Review') _params.deployed = 'review'
				if (this.metricLocation == 'Development') _params.deployed = 'development'
			}

			// call fetch on Store
			this.$store.dispatch('fetchMetrics', _params)
			this.$store.dispatch('fetchStats', {
				public: 0,
				internal: 0,
				stat: 1,
				status: 'deployed',
				type: '',
				master: admin == -1 ? '' : 'all'
			}).then(res => this.$store.state.stats)
			
		},

		checkMetricsForRouteId() {
			if (!this.$route.params.id) {
				this.scrolled = true
				return
			}
			for (var i in this.filteredMetrics) {
				if (this.filteredMetrics[i].psofia_recordid == this.$route.params.id) {
					this.scrollToMetric('#metric-card-' + this.$route.params.id)
				}
			}
		},

		scrollToMetric(id) {
			Vue.nextTick(() => {
				$(window).scrollTop($(id).offset().top-150)
				// janky
				// $('html, body').animate({ scrollTop: $(id).offset().top - 150 }, 1000)
				this.scrolled = true
			})
		},

		backToDashboad() {
			this.$router.go(-1)
		},

		setCat(cat) {
			// this.currentCat.id = cat.bmpid
			// this.currentCat.display = cat.bmpdisplayname

			// get department without spaces
			var d = cat.bmpdisplayname.toLowerCase().replace(/ /g, '')
			console.log(d)

			// check if admin
			var admin = this.$route.fullPath.toLowerCase().indexOf('admin')

			// if there's a psofia id, include it
			if (this.$route.params.id && this.$route.params.id != 'edit') {
				if (admin == -1) {
					if (this.editing)
						this.$router.push({
							name: 'DetailsWithId',
							params: {
								dept: d,
								id: 'edit'
							}
						})
					else
						this.$router.push({
							name: 'Details',
							params: {
								dept: d
							}
						})
				}
				else this.$router.push({ name: 'AdminDetails', params: { dept: d } })
			}

			// else just move to the department
			else {
				if (this.editing) {
					this.$router.push({
						name: 'DetailsWithId',
						params: {
							dept: d,
							id: 'edit'
						}
					})
				}
				else {
					this.$router.push({
						name: 'Details',
						params: {
							dept: d
						}
					})
				}
			}
		},

		countOf(category, cat) {
			var sum = 0
			this.metrics.forEach(metric => {
				if (cat == 'd') if (metric.category1 == category.bmpid) sum++
				if (cat == 'p') if (metric.cateogry3 == category.bmpid) sum++
				if (cat == 'b') if (metric.category2 == category.bmpid) sum++
			})
			return sum
		},

		checkLocation() {
			if (this.location == 'public') this.setLocation(1, 0, 0, 'metricPublic', 'deployed', '', '')
			else if (this.location == 'internal') this.setLocation(1, 1, 0, 'metricInternal', 'deployed', '', '')
			else if (this.location == 'stats') this.setLocation(0, 0, 1, 'stat', 'deployed', '', '')
		},

		setLocation(pflag, iflag, sflag, status, type, master) {
			this.working = true
			this.$store.commit('clearMetrics')

			// specifies which metrics to fetch
			var _params = {
				public: pflag,
				internal: iflag,
				stat: sflag,
				sitename: sitename,
				status: status,
				type: type,
				master: master
			}

			// call fetch on Store
			this.$store.dispatch('fetchMetrics', _params)

			// // change url accordingly
			// if (iflag) this.$route.params.location = 'internal'
			// else if (pflag) this.$route.params.location = 'public'
		}
	}
}
</script>

<style scoped>
.top {}
.back {
	margin-left: 16px;
	cursor: pointer;
	display: inline-block;
}
.col-purple {
    background-color: #5A348D !important;
}
.sidenav-trigger {
	display: none;
}
.brand-logo {
	white-space: nowrap;
    width: 100%;
    font-size: 1.5rem;
    padding-left: 64px
}
.pointy {
	cursor: pointer;
}
.navbar-fixed {
}
ul.right {
	position: absolute;
    right: 0;
}
#metric-list {
    position: relative;
}
#slide-out {
	margin-top: 64px;
	height: calc(100vh - 64px);
	padding-bottom: 0;
	/*border-right: 10px solid rgb(84,110,122);*/
	/*box-shadow: none;*/
}
.deptname {
	font-size: 1.5rem;
	margin: 8px
}
header, main, footer {
	padding-left: 300px;
}
main .main {
	margin-top: 64px;
}
.logo {
    position: absolute;
	width: 36px;
    display: inline-block;
    height: 100%;
    vertical-align: middle;
    background-image: url(../../../static/pmartin.svg);
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    opacity: 1;
    margin: 0 16px;
}
@media only screen and (max-width : 992px) {
	#slide-out {
		margin-top: 0;
		height: 100vh;
	}
	.brand-logo {
		white-space: nowrap;
	    width: 100%;
	    font-size: 1.5rem;
	    padding-left: 64px;
	}
	.logo {
		display: none;
	}
	header, main, footer {
		padding-left: 0;
	}
}
@media only screen and (max-width : 600px) {
	.second-nav {
		top: 56px !important;
	}
}
.second-nav ul {
	margin-top: 5px;
	margin-right: 8px
}
.second-nav {
	position: fixed;
	top: 64px;
	width: 100%;
	z-index: 80;
	-webkit-box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2);
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2);
}
nav i.material-icons.active {
	animation: spin 2s linear infinite;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

li.search {
	padding: 1px 8px;
}
li.search .searchbar {
	border: 3px solid grey !important;
	z-index: 2;
    position: relative;
}
li.header {
	font-weight: bold;
	text-align: left;
	margin-left: 16px;
}
#top-nav select {
	color: black;
	display: inline-block;
}
.spinner {
  width: 60px;
  height: 60px;

  position: relative;
  margin: 100px auto;
}

.double-bounce1, .double-bounce2 {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgba(0,0,0,0.3);
  position: absolute;
  top: 0;
  left: 0;
  -webkit-animation: sk-bounce 2.0s infinite ease-in-out;
  animation: sk-bounce 2.0s infinite ease-in-out;
}

.double-bounce2 {
  -webkit-animation-delay: -1.0s;
  animation-delay: -1.0s;
}

@-webkit-keyframes sk-bounce {
  0%, 100% { -webkit-transform: scale(0.0) }
  50% { -webkit-transform: scale(1.0) }
}

@keyframes sk-bounce {
  0%, 100% {
    transform: scale(0.0);
    -webkit-transform: scale(0.0);
  } 50% {
    transform: scale(1.0);
    -webkit-transform: scale(1.0);
  }
}
</style>
