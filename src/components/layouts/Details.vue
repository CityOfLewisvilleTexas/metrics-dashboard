<template>
	<div>
		<header>
			<div class="navbar-fixed">
				<nav>
					<div id="top-nav" class="nav-wrapper col-purple left-align">
						<a data-activates="slide-out" id="details-side-nav" class="button-collapse">
							<i class="material-icons">menu</i>
						</a>
						<div class="logo hide-on-med-and-down"></div>
						<div class="city-brand white-text text-darken-3">City of Lewisville</div>
						<ul class="right">
							<li v-if="!underLarge && !isLoading && showCarousel">
								<a @click="scrollToCarousel('#details_carousel')">
									{{carouselType == 'statsCarousel' ? 'Stats' : 'Metrics'}}
									<i class="tiny material-icons left">bookmark_border</i>
								</a>
							</li>
							<li v-if="isEditing">
								<select class="browser-default" v-model="showStatusParam">
									<option v-for="routeStatus in filteredRouteStatuses" :value="routeStatus.statusParam">{{ routeStatus.display }}</option>
								</select>
							</li>
							<li v-if="!underLarge">
								<a class="btn amber black-text" :href="landingURL">
									<span>dashboard</span>
								</a>
							</li>
							<li>
								<a @click="fetchMetrics" data-position="left" data-delay="0" data-tooltip="Refresh" class="tooltipped">
									<i class="material-icons" :class="{ active : storeIsRefreshing }">refresh</i>
								</a>
							</li>
						</ul>
					</div>
				</nav>
			</div>

			<ul id="slide-out" class="side-nav fixed">
				<li class="search">
					<SearchMetricsBar class="searchbar" :config="searchconfig" />
				</li>

				<li v-if="isEditing" class="locations no-padding">
					<ul>
						<li class="divider"></li>

						<li class="header">LOCATION</li>

						<li v-if="allLocationsDisabled" class="header">{{ location_all.display }}<span class="right">{{ getCountByLocation(location_all) }}</span></li>

						<li v-for="routeLocation in filteredRouteLocations" @click="setLocationParam(routeLocation)"
							class="pointy left-align" :class="{ 'col-purple': (routeLocation.locationParam == locationParam) }">
							<a :class="{ 'white-text': (routeLocation.locationParam == locationParam), 'col-purple-text': (routeLocation.locationParam != locationParam) }">
								{{ routeLocation.display }}<span class="right">{{ getCountByLocation(routeLocation) }}</span>
							</a>
						</li>
					</ul>
				</li>

				<li class="categories no-padding">
					<ul>
						<li v-if="isEditing">
							<ul>
								<li class="divider"></li>

								<li class="header">CATEGORY</li>

								<li v-if="allCategoriesDisabled" class="header">All Categories<span class="right">{{ getCountByCategory(category_all) }}</span></li>

								<li v-for="category in filteredRouteDeptsByType(null)" @click="setDeptParam(category)"
									class="pointy left-align" :class="{ 'col-purple': (category.deptParam == deptParam) }">
									<a :class="{ 'white-text': (category.deptParam == deptParam), 'col-purple-text': (category.deptParam != deptParam) }">
										{{ category.id == 'all' ? 'All Categories' : 'No Category' }}<span class="right">{{ getCountByCategory(category) }}</span>
									</a>
								</li>
							</ul>
						</li>


						<li v-for="categoryType in filteredCategoryTypes" class="categories no-padding">
							<ul>
								<li class="divider"></li>
								<li class="header">{{categoryType.display}}</li>
								<li v-for="category in filteredRouteDeptsByType(categoryType.type)" @click="setDeptParam(category)"
									class="pointy left-align" :class="{ 'col-purple': (category.deptParam == deptParam) }">
									<a :class="{ 'white-text': (category.deptParam == deptParam) }">
										{{ category.display }}<span class="right">{{ getCountByCategory(category) }}</span>
									</a>
								</li>
							</ul>
						</li>
					</ul>
				</li>
			</ul>
		</header>

		<main>
			
			<div class="navbar-fixed second-nav">
				<nav>
					<div class="nav-wrapper white left-align">
						<div class="col s12">
							<div v-if="currentCategory && currentCategory.id != 'loading'" class="second-nav-title col-purple-text">
								{{ currentCategory.display }}
								<small class="grey-text"> ({{ countMetrics_shown }})</small>
								<small v-if="isEditing" class="grey-text">[{{currentRouteLocation.display}} - {{currentStatus.display}}]</small>
							</div>
							<ul class="right">
								<li v-if="isEditing && refreshedAt" class="grey-text">Updated: {{refreshedAt}}</li>
								<li v-if="underLarge && !isLoading && showCarousel">
									<a @click="scrollToCarousel('#details_carousel')" class="black-text">
										{{carouselType == 'statsCarousel' ? 'Stats' : 'Metrics'}}
										<i class="tiny material-icons left">bookmark_border</i>
									</a>
								</li>
								<li v-if="underLarge">
									<a class="btn amber black-text" :href="landingURL">
										<span>dashboard</span>
									</a>
								</li>
							</ul>
						</div>
					</div>
				</nav>
			</div>


			<div v-if="isLoading" class="spinner main">
				<div class="double-bounce1"></div>
				<div class="double-bounce2"></div>
			</div>

			<div v-if="!isLoading" class="main">
				<ul id="metric-list" class="row">
					<li v-if="extraLink">
						<div class="col s12 left-align">
							[See also: <a :href="extraLink.link" target="_blank">{{ extraLink.text }}</a>]
						</div>
					</li>
					<li v-if="countMetrics_shown == 0" class="categoryEmpty">
						No {{ isStatsFull ? 'Stats' : 'Metrics' }} found here.
					</li>
					<li v-for="metric in sortedMetrics" :key="metric[primaryKey]" class="col s12 m10 l10 xl8 offset-m1 offset-l1 offset-xl2">
						<MetricCard :metric="metric" :config="cardconfig" />
					</li>
				</ul>

				<ul v-if="showCarousel" id="details_carousel" class="row">
					<li class="divider"></li>
					<li class="detail-carousel-title">{{carouselType == 'statsCarousel' ? 'Stats' : 'Metrics'}}</li>
					<li class="col s12 l12 xl10 offset-xl1">
						<ListOfMetrics :config="carouselconfig" :currentCategory="currentCategory" />
					</li>
				</ul>
			</div>

		</main>
	</div>

</template>

<script>
import Vue from 'vue'
import Moment from 'moment'
import ListOfMetrics from '../widgets/ListOfMetrics'
import SearchMetricsBar from '../widgets/SearchMetricsBar'
import MetricCard from '../widgets/MetricCard'
export default {
	name: 'Details',
	components: { ListOfMetrics, SearchMetricsBar, MetricCard },
	props: [],
	beforeRouteUpdate (to, from, next) {
		if(this.routeDebug) console.log(to.name)
		if(this.routeDebug) console.log('beforeRouteUpate - Details')
		var newParams = to.params
		var needsUpdate = false
		//checkViewParams
		if(to.name == 'Details' || to.name == 'DetailsWithId'){
			// admin, dept, unknown redirects to edit automatically
			if(newParams.location == 'admin' || newParams.location == 'data' || newParams.location == 'unknown' || newParams.location == 'internalonly'){
				newParams = Object.assign(newParams, {status: 'deployed'})
				if(newParams.id) next({ name: 'DetailsWithIdEdit', params: newParams })
				else next({ name: 'DetailsEdit', params: newParams })
			}
			// redirect
			else if((this.isStats && (newParams.location == 'public' || newParams.location == 'internal')) || (!this.isStats && newParams.location == 'stats') ){
				var redirectURL = this.redirectURL + to.fullPath
				window.location.assign(redirectURL)
				next(false)
			}
			else{
				// clean location param
				if((this.isStats && newParams.location != 'stats') || (!this.isStats && newParams.location != 'public' && newParams.location != 'internal')){
					if(this.isStats) newParams.location = 'stats'
					else newParams.location = 'public'
					needsUpdate = true
				}
				if(needsUpdate) next({ name: to.name, params: newParams })
				else{
					if(newParams.location == 'internal'){
						if(this.$store.state.userEmail && this.$store.state.authToken){
							if(this.routeDebug) console.log('email & token in store')
							next()
						}
						else{
							if(this.securityDebug || (sessionStorage.authChecked && localStorage.colAuthToken && localStorage.colEmail)){
								if(this.securityDebug) this.$store.commit('login', { email: 'clarson@cityoflewisville.com', authToken: '13107057BB20449E84CC02866214DF3676E8E98E9B2C40248AB3EB5AB7A3B076498726B308EB4A51B24B9E555EC38EF4' })
								else{
									if(this.routeDebug) console.log('already auth')
									this.$store.commit('login', { email: localStorage.colEmail, authToken: localStorage.authToken })
								}
								next()
							}
							else{
								if(this.routeDebug) console.log('needs auth')
								var redirectOnAuth = to.fullPath;
								var redirectOnFail = redirectOnAuth
								redirectOnFail = redirectOnFail.substring(0, redirectOnFail.indexOf('/edit'))
								if(!this.isStats) redirectOnFail = redirectOnFail.replace('internal', 'public')
								next({ path: '/login/1', query: { redirect: redirectOnAuth, failredirect: redirectOnFail } })
							}
						}
					}
					else next()
				}
			}
		}
		else if(to.name == 'DetailsEdit' || to.name == 'DetailsWithIdEdit'){
			// clean location param
			if(newParams.location != 'admin' && newParams.location != 'public' && newParams.location != 'stats' && newParams.location != 'internal' && newParams.location != 'internalonly' && newParams.location != 'data' && newParams.location != 'unknown'){
				if(this.isStats) newParams.location = 'stats'
				else newParams.location = 'public'
				needsUpdate = true
			}
			// clean status param
			if(newParams.status != 'deployed' && newParams.status != 'development' && newParams.status != 'review' && newParams.status != 'missing'){
				newParams.status = 'deployed'
				needsUpdate = true
			}
			// deployed edit view should look the same as view - hide routes for all locations and all departments
			if(newParams.status == 'deployed'){
				if(newParams.location == 'admin'){
					if(this.isStats) newParams.location = 'stats'
					else newParams.location = 'public'
					needsUpdate = true
				}
				if(newParams.dept == 'all' && newParams.location != 'unknown' && newParams.location != 'internalonly'){
					newParams.dept = 'citywide'
					needsUpdate = true
				}
			}
			if(needsUpdate) next({ name: to.name, params: newParams })
			else{
				if(this.$store.state.userEmail && this.$store.state.authToken){
					if(this.routeDebug) console.log('email & token in store')
					next()
				}
				else{
					if(this.securityDebug || (sessionStorage.authChecked && localStorage.colAuthToken && localStorage.colEmail)){				
						if(this.securityDebug) this.$store.commit('login', { email: 'clarson@cityoflewisville.com', authToken: '13107057BB20449E84CC02866214DF3676E8E98E9B2C40248AB3EB5AB7A3B076498726B308EB4A51B24B9E555EC38EF4' })
						else{
							if(this.routeDebug) console.log('already auth')		
							this.$store.commit('login', { email: localStorage.colEmail, authToken: localStorage.authToken })
						}
						next()
					}
					else{
						if(this.routeDebug) console.log('needs auth')
						var redirectOnAuth = to.fullPath;
						var redirectOnFail = redirectOnAuth
						var i = redirectOnFail.indexOf('/edit')
						if(i > -1) redirectOnFail = redirectOnFail.substring(0, i)

						var failLocation = 'public'
						if(this.isStats) failLocation = 'stats'
						if(to.params.location == 'internal') redirectOnFail = redirectOnFail.replace('internal', 'public')
						if(to.params.location == 'internalonly') redirectOnFail = redirectOnFail.replace('internalonly', 'public')
						else if(to.params.location == 'admin') redirectOnFail = redirectOnFail.replace('admin', failLocation)
						else if(to.params.location == 'data') redirectOnFail = redirectOnFail.replace('data', failLocation)
						else if(to.params.location == 'unknown') redirectOnFail = redirectOnFail.replace('unknown', failLocation)

						next({ path: '/login/1', query: { redirect: redirectOnAuth, failredirect: redirectOnFail } })
					}
				}
			}
		}
		else next()
	},
	data () {
		return {
			debug: true,
			needsInit: true,
			needsInit_materialize: true,
			needsInit_scrolled: true,
			timestamp: null,
			// params computed

			showStatusParam: 'deployed',
			scrolled: false,
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
		}
	},

	computed: {
			// route
			routeName() { return this.$route.name },
			routeParams() { return this.$route.params },
			locationParam() { return this.routeParams.location },
			deptParam() { return this.routeParams.dept },
			idParam() { return this.routeParams.id },
			statusParam() { return this.routeParams.status },	//return this.debug ? 'deployed' : this.routeParams.status

			// store.state
			storeDebug() { return this.$store.state.debug },
			routeDebug() { return this.$store.state.routeDebug },
			securityDebug() { return this.$store.state.securityDebug },
			storeIsLoading() { return this.$store.state.isLoading },
			storeIsRefreshing() { return this.$store.state.softReloading },
			refreshedAt() { return this.$store.state.fromNow },
			underLarge() { return this.$store.state.underLarge },
			landingURL() { return this.$store.state.landingURL },
			
			// store.getters
			isStats() { return this.$store.getters.isStats },
			routeLocations() { return this.$store.getters.routeLocations },
			routeStatuses() { return this.$store.getters.routeStatuses },
			routeDepts() { return this.$store.getters.routeDepts },
			redirectURL() { return this.$store.getters.redirectURL },
			primaryKey() { return this.$store.getters.psofiaVars.primaryKey },
			categoriesLoading() { return this.$store.getters.isLoading_categories },
			categoryTypes() { return this.$store.getters.categoryTypes },
			carouselIsLoading() { return this.$store.getters.isLoading_detailCarousel },
			carouselIsRefreshing() { return this.$store.state.detailCarouselSoftReloading },
			
			// store.getters with params
			currentRouteLocation() { return this.$store.getters.routeLocationByLocationParam(this.locationParam) },
			currentCategory() { return this.$store.getters.fullCategoryByDeptParam(this.deptParam) },
			currentStatus() { return this.$store.getters.fullStatusByStatusParam(this.statusParam) },
		
		isLoading() { return this.needsInit || this.storeIsLoading },
		isEditing() { return (this.routeName == 'DetailsEdit' || this.routeName == 'DetailsWithIdEdit') },		// || this.debug

		isStatsFull(){
			if(!this.isEditing){
				if(!this.isStats && (this.locationParam == 'public' || this.locationParam == 'internal')) return false
				else if(this.isStats && this.locationParam == 'stats') return true
			}
			else{
				if(this.locationParam == 'public' || this.locationParam == 'internal') return false
				else if(this.locationParam == 'stats') return true
			}
		},

		params() {
			var sitename = '', status = 'deployed', type = '', master = '', auth = false
			if (this.isEditing){
				auth = true
				master = 'all'
				status = (this.statusParam == 'missing') ? '' : this.statusParam
			}

			if(this.locationParam == 'admin'){
				auth = true
				sitename = 'all'
			}
			else if(this.locationParam == 'stats') sitename = 'stat'
			else if(this.locationParam == 'internal'){
				auth = true
				sitename = 'metricInternal'
			}
			else sitename = 'metricPublic'
			return {
				sitename: sitename,
				status: status,
				type: type,
				master: master,
				auth: auth,
			}
		},

		metrics_shown() {
			if(!this.currentCategory || this.currentCategory.id == 'loading') return []
			if(!this.isEditing) return this.$store.getters.metricsByPayload({ category: this.currentCategory, checkAll: true })
			else return this.$store.getters.metricsByPayload({ statusParam: this.statusParam, category: this.currentCategory, routeLocation: this.currentRouteLocation, checkAll: true })
		},
		countMetrics_shown(){ return this.metrics_shown.length },
		sortedMetrics(){
			// sort by query -> static, then alphabetical by name
			return this.metrics_shown.sort((a,b) => {
				if (a.metrictype == b.metrictype) {
					return (a.realtimeshortname < b.realtimeshortname) ? -1 : (a.realtimeshortname > b.realtimeshortname) ? 1 : 0
				}
				else {
					return (a.metrictype < b.metrictype) ? -1 : 1
				}
			})
		},

		carouselType() {
			// stats carousel shown: public or internal view on metrics.col, public or internal deployed edit view on either domain
			// metrics carousel shown: stats view on stats.col, stats deployed edit view on either domain
			var type = null
			if(!this.isEditing){
				if(!this.isStatsFull) type = 'statsCarousel'
				else type = 'metricsCarousel'
			}
			else{
				// only show on deployed public or stats details page
				if(this.statusParam == 'deployed'){
					if(!this.isStatsFull) type = 'statsCarousel'
					else type = 'metricsCarousel'
				}
			}
			return type
		},
		includeCarousel() { return ( this.carouselType != null ) },
		showCarousel() { return this.includeCarousel && this.countDetailCarousel > 0 },
		countDetailCarousel() {
			if(!this.currentCategory || this.currentCategory.id == 'loading' || this.isLoading || this.carouselIsLoading) return 0
			return this.$store.getters.countDetailCarouselByPayload({ category: this.currentCategory, checkAll: true })
		},

		location_all() { return this.routeLocations.find(routeLocation => routeLocation.locationParam == 'admin') },
		location_data() { return this.routeLocations.find(routeLocation => routeLocation.locationParam == 'data') },
		location_unknown() { return this.routeLocations.find(routeLocation => routeLocation.locationParam == 'unknown') },
		category_all() { return this.routeDepts.find(routeDept => routeDept.deptParam == 'all') },
		category_none() { return this.routeDepts.find(routeDept => routeDept.deptParam == 'missing') },
		allLocationsDisabled() {
			if(this.isEditing) return (this.statusParam == 'deployed')
			else return true
		},
		allCategoriesDisabled() {
			if(this.isEditing) return (this.statusParam == 'deployed' && this.locationParam != 'unknown' && this.locationParam != 'internalonly')
			else return true
		},
		includeLocation_data() { if(this.isEditing) return this.$store.getters.checkInclude({ routeLocation: this.location_data }) },
		includeLocation_unknown() { if(this.isEditing) return this.$store.getters.checkInclude({ routeLocation: this.location_unknown }) },
		includeCategoriesMissing() { if(this.isEditing) return this.$store.getters.checkInclude({ category: this.category_none }) },
		includeStatusMissing() { if(this.isEditing) return this.$store.getters.checkInclude({ statusParam: 'missing' }) },
		filteredRouteLocations() {
			if(!this.isEditing) return []
			return this.routeLocations.filter(routeLocation => {
				if(routeLocation.locationParam == 'admin') return !(this.allLocationsDisabled)
				else if(routeLocation.locationParam == 'data') return (this.locationParam == 'data' || this.includeLocation_data)
				else if(routeLocation.locationParam == 'unknown') return (this.locationParam == 'unknown' || this.includeLocation_unknown)
				else return true
			}).sort((a, b) => a.order - b.order)
		},
		filteredRouteStatuses() { 
			if(!this.isEditing) return []
			return this.routeStatuses.filter(routeStatus => {
				if(routeStatus.statusParam == 'missing') return this.statusParam == 'data' || this.includeLocation_data
				else return true
			}).sort((a, b) => a.order - b.order)
		},
		filteredRouteDepts() {
			return this.routeDepts.filter(routeDept => {
				if(routeDept.deptParam == 'all') return !(this.allCategoriesDisabled)
				else if(routeDept.deptParam == 'missing') return (this.isEditing && (this.deptParam == 'missing' || this.includeLocation_data))
				else return true
			})
		},
		filteredCategoryTypes() {
			return this.categoryTypes.filter(categoryType => {
				return this.filteredRouteDepts.some(routeDept => categoryType.type == routeDept.type)
			}).sort((a, b) => a.order - b.order)
		},

		searchconfig() {
			return {
				compid: 'small-search',
				//timestamp: this.timestamp ? this.timestamp.valueOf() : null,
				nav: false,
				editing: this.isEditing,
			}
		},
		cardconfig() {
			return{
				timestamp: this.timestamp ? this.timestamp.valueOf() : null,
				editing: this.isEditing,
			}
		},
		carouselconfig() {
			return {
				compid: 'g1-list',
				type: this.carouselType,
				timestamp: this.timestamp ? this.timestamp.valueOf() : null,
				editable: false,
				editing: this.isEditing,
			}
		},
		extraLink() {
			if(!this.currentCategory) return null
			for (var link of this.extraLinks) {
				if (link.for == this.currentCategory.display) return link
			}
			return null
		},
	},

	watch: {
		params:{
			immediate: false,
			handler(newVal, oldVal){
       			this.updateFetchParams()
     		},
     		deep: true
		},
		'$route' (to, from) {
			if(to.name == 'Details' || to.name == 'DetailsWithId' || to.name == 'DetailsEdit' || to.name == 'DetailsWithIdEdit'){
				if(from.name != 'Details' && from.name != 'DetailsWithId' && from.name != 'DetailsEdit' && from.name != 'DetailsWithIdEdit'){
					if(this.routeDebug) console.log('Route Changed - Enter: ' + from.name)
					this.needsInit = true
					this.needsInit_materialize = true
					this.init()
				}
				else{
					if((to.name == 'Details' || to.name == 'DetailsWithId') && (from.name == 'DetailsEdit' || from.name == 'DetailsWithIdEdit')){
						if(this.routeDebug) console.log('Route Changed - Update - Change to View')
						this.needsInit = true
						this.init()
					}
					else if((to.name == 'DetailsEdit' || to.name == 'DetailsWithIdEdit') && (from.name == 'Details' || from.name == 'DetailsWithId')){
						if(this.routeDebug) console.log('Route Changed - Update - Change to Edit')
						this.needsInit = true
						this.init()
					}
					else{
						if(this.routeDebug) console.log('Route Changed - Update')
						this.resetScroll()
						this.timestamp = Moment()
						if(to.params.status && this.showStatusParam != to.params.status) this.showStatusParam = this.statusParam
						if(this.needsInit_scroll) Vue.nextTick(this.checkMetricsForRouteId)
					}
				}
			}
		},
		// change route when status select is changed
		showStatusParam(newVal, oldVal) {
			if(this.isEditing && this.statusParam != newVal){
				var newParams = this.routeParams
				var newRouteName = this.routeName
				newParams.status = newVal
				// on view review or development, goto all locations, all categories
				if(newVal == 'review' || newVal == 'development'){
					newParams.location = 'admin'
					newParams.dept = 'all'
				}
				if(newVal == 'deployed'){	// on edit view deployed, can't goto all locations or all categories
					if(newParams.location == 'admin') newParams.location = this.isStats ? 'stats' : 'public'
					if(newParams.dept == 'all' && newParams.location != 'unknown' && this.locationParam != 'internalonly') newParams.dept = 'citywide'
				}
				// remove id
					if(newRouteName.indexOf('WithId')) newRouteName = newRouteName.replace('WithId', '')
					if(newParams.id) delete newParams.id
				this.$router.push({ name: newRouteName, params: newParams })
			}
		},
		isLoading:{
			immediate: true,
			handler(newVal, oldVal) {
				if(this.storeDebug) console.log('isLoading: ' + oldVal  + ' -> ' + newVal)
				if(!newVal && oldVal){
					if(this.needsInit_scroll) Vue.nextTick(this.checkMetricsForRouteId)
				}
			},
		},
		storeIsLoading:{	// debug only
			immediate: true,
			handler(newVal, oldVal) { if(this.storeDebug) console.log('storeIsLoading: ' + oldVal  + ' -> ' + newVal) },
		},
		storeIsRefreshing:{	// debug only
			immediate: true,
			handler(newVal, oldVal) { if(this.storeDebug) console.log('storeIsRefreshing: ' + oldVal  + ' -> ' + newVal) },
		},
		categoriesLoading:{	// debug only
			immediate: true,
			handler(newVal, oldVal) { if(this.storeDebug) console.log('categoriesLoading: ' + oldVal  + ' -> ' + newVal) },
		},
	},

	mounted() {
		if(this.debug) console.log('Mounted')
		this.init()
	},
	beforeDestroy() {
		if(this.debug) console.log('Destroy')
		$("#details-side-nav.button-collapse").sideNav('destroy')
		$('.tooltipped').tooltip('remove');
	},

	methods: {
		init(){
			if(this.needsInit_materialize) this.initMaterialize()
			this.resetScroll()
			this.timestamp = Moment()
			if(!this.isEditing) this.showStatusParam = 'deployed'
			else this.showStatusParam = this.statusParam
			this.updateFetchParams()
			this.needsInit = false
		},
		initMaterialize(){
			// sidenav
			$("#details-side-nav.button-collapse").sideNav()
			// tooltip
			$('.tooltipped').tooltip({delay: 0, position: 'left'});

			this.needsInit_materialize = false
		},
		resetScroll() {
			$('html, body').scrollTop(0)
			if(this.idParam) this.needsInit_scroll = true
			else this.needsInit_scroll = false
			if(this.debug) console.log('needsInit_scroll: ' + this.needsInit_scroll)
		},
		updateFetchParams() {
			var payload = {
				params: this.params,
				detailCarouselType: this.carouselType,
			}
			if(this.debug) console.log('Update fetch params')
			this.$store.dispatch('updateFetchParams', payload)
		},
		fetchMetrics() {
			if(this.debug) console.log('Fetch metrics')
			this.$store.commit('clearMetrics')
			this.resetScroll()
			this.$store.dispatch('fetchPerfMeasures')
			this.fetchDetailCarousel()
		},
		fetchDetailCarousel(){
			if(this.debug) console.log('Fetch carousel')
			if(this.includeCarousel){
				if(this.debug) console.log('Fetch carousel2')
				this.$store.commit('clearDetailCarousel')
				this.$store.dispatch('fetchDetailCarousel')
			}
		},

		checkMetricsForRouteId() {
			if (!this.idParam) {
				return
			}
			if(this.debug) console.log('has ID param, needs scroll')
			var selectedMetric = this.metrics_shown.find(metric => metric[this.primaryKey] == this.idParam)
			if(selectedMetric) this.scrollToMetric('#metriccard-' + this.idParam)
			else{
				this.needsInit_scroll = false
				console.warn('no metric found for id')
			}
		},
		scrollToMetric(id) {
			Vue.nextTick(() => {
				$(window).scrollTop($(id).offset().top-150)
				this.needsInit_scroll = false
			})
		},
		scrollToCarousel() {
			$(window).scrollTop($('#details_carousel').offset().top - 114)
		},

		filteredRouteDeptsByType(type) {
			return this.filteredRouteDepts.filter(routeDept => type == routeDept.type).sort((a,b) => {
				var orderDiff = a.order - b.order
				if(orderDiff != 0) return orderDiff
				if (a.display.toLowerCase() < b.display.toLowerCase()) return -1
				if (a.display.toLowerCase() > b.display.toLowerCase()) return 1
				return 0
			})
		},

		setDeptParam(category) {
			if(category.deptParam != this.deptParam){
				// hide all departments deployed page
				if(category.deptParam == 'all' && this.allCategoriesDisabled) return
				else{
					var newParams = this.routeParams
					var newRouteName = this.routeName
					newParams.dept =  category.deptParam
					// remove id
						if(newRouteName.indexOf('WithId')) newRouteName = newRouteName.replace('WithId', '')
						if(newParams.id) delete newParams.id
					this.$router.push({ name: newRouteName, params: newParams })
				}
			}
		},
		setLocationParam(routeLocation){
			if(this.isEditing && routeLocation.locationParam != this.locationParam){
				// hide all locations deployed page
				if(routeLocation.locationParam == 'admin' && this.allLocationsDisabled) return
				else{
					var newParams = this.routeParams
					var newRouteName = this.routeName
					newParams.location = routeLocation.locationParam
					// on view review/development/missing, goto all categories on location change
						if(newParams.status != 'deployed' || newParams.location == 'unknown' || newParams.location == 'internalonly') newParams.dept = 'all'
					// remove id
						if(newRouteName.indexOf('WithId')) newRouteName = newRouteName.replace('WithId', '')
						if(newParams.id) delete newParams.id
					this.$router.push({ name: newRouteName, params: newParams })
				}
			} else return
		},
		setStatusParam(statusParam) {
			if(this.isEditing && this.statusParam != statusParam){
				var newParams = this.routeParams
				var newRouteName = this.routeName
				newParams.status =  statusParam
				if(newVal == 'review' || newVal == 'development'){
					newParams.location = 'admin'
					newParams.dept = 'all'
				}
				if(statusParam == 'deployed'){
					if(newParams.location == 'admin') newParams.location = this.isStats ? 'stats' : 'public'
					if(newParams.dept == 'all' && newParams.location != 'unknown' && newParams.location != 'internalonly') newParams.dept = 'citywide'
				}
				// remove id
					if(newRouteName.indexOf('WithId')) newRouteName = newRouteName.replace('WithId', '')
					if(newParams.id) delete newParams.id
				this.$router.push({ name: newRouteName, params: newParams })
			}
		},
		getCountByCategory(category) {
			if(!this.isEditing) return this.$store.getters.countMetricsByPayload({category: category, checkAll: true })
			else{
				return this.$store.getters.countMetricsByPayload({statusParam: this.statusParam, routeLocation: this.currentRouteLocation, category: category, checkAll: true })
			}
		},
		getCountByLocation(routeLocation){
			// only shown on editing
			return this.$store.getters.countMetricsByPayload({ statusParam: this.statusParam, routeLocation: routeLocation })
		},

		goBack() {
      		window.history.length > 1 ? this.$router.go(-1) : this.$router.push('/')
    	}
	}
}
</script>

<style scoped>
/* COLORS */
.col-purple {
    background-color: #5A348D !important;
}
.col-purple-text {
    color: #5A348D !important;
}

.pointy {
	cursor: pointer;
}

.nav-wrapper {
	padding-left: .75rem;
	padding-right: .75rem;	
}
nav i.material-icons.left {
	margin-right: 0;
}

/* top navbar */
.logo {
    position: absolute;
    display: inline-block;
	width: 36px;
    height: 100%;
    vertical-align: middle;
    background-image: url(../../../static/pmartin.svg);
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    opacity: 1;
}
.city-brand {
	position: absolute;
	display: inline-block;
    font-size: 1.5rem;
    margin-left: calc(36px + .75rem);
}
#top-nav select {
	color: black;
	display: inline-block;
}

/* side nav */
/* to keep full width navbar above fixed side-nav*/
#slide-out {
	margin-top: 64px;
	height: calc(100vh - 64px);
	padding-bottom: 0;
}
li.search {
	padding: 1px 8px;
}
li.search .searchbar {
	border: 3px solid grey !important;
	z-index: 2;
	/*position: relative;*/
}
li.header {
	font-weight: bold;
	text-align: left;
	margin-left: 16px;
	margin-right: 32px;
}

/* pad for fixed side-nav */
main {
	padding-left: 300px;
	width: 100%;
}


.navbar-fixed.second-nav {
	height: 50px;
}
.second-nav nav {
	height: 50px;
	line-height: 50px;
	width: calc(100% - 300px);
}
.second-nav-title {
	position: absolute;
	display: inline-block;
	font-size: 1.5rem;
}
.second-nav nav .nav-wrapper i{
	height: 50px;
    line-height: 50px;
}

/* actual main, margin to push below both navbars */
.main #metric-list {
	min-height: 300px;
}

.detail-carousel-title {
	height: 50px;
	line-height: 50px;
	font-size: 1.5rem;
}


@media only screen and (max-width : 992px) {
	nav .city-brand{
		margin-left: 0;
	}
	#slide-out {
		margin-top: 0;
		height: 100vh;
	}
	main {
		padding-left: 0;
	}
	.second-nav nav {
		width: 100%;
	}
}


/* LOADERS */

.spinner {
	width: 60px;
	height: 60px;
	position: relative;
	margin: 100px auto;
}


/* ANIMATIONS */

nav i.material-icons.active {
	animation: spin 2s linear infinite;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
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


/* TRANSITIONS */

.fade-enter-active, .fade-leave-active {
	transition: all 0.5s;
}
.fade-enter, .fade-leave-to{
	opacity: 0;
	transform: translate3d(0, 100px,0);
}

</style>
