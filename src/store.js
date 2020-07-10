// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import Moment from 'moment'

Vue.use(Vuex)

// Vuex store, used for handling the addresses retrieved (faster successive loading for searches)
export const store = new Vuex.Store({
	// data
	// usage: this.$store.state.stateName
	state: {
		metrics: [],
		stats: [],
		departments: [],
		bigmoves: [],
		citypriorities: [],
		refreshedInterval: null,
		isLoading: true,
		softReloading: true,
		statsCarouselIsLoading: true,
		lastRefreshed: '',
		fromNow: '',
		interval: null,
		domainName: '',
		siteFilters: {		// set in Dashboard.vue, every component loads with Dashboard.vue
			sitename: '',
			status: '',
			type: '',
			master: '',
		},
		psofiaVersion: 'v1',
		site: '',
		underLarge: true
	},
	getters: {
		isStats(state){
			return state.domainName != 'stats' && state.siteFilters.sitename != 'stats'
		},
		primaryKey(state){
			if(state.psofiaVersion == 'v1') return 'psofia_recordid';
			else return 'RecordNumber';
		},
		submitDateKey(state){
			if(state.psofiaVersion == 'v1') return 'psofia_createddate';
			else return 'OriginalSubmitDate';
		},
		editDateKey(state){
			if(state.psofiaVersion == 'v1') return 'psofia_editeddate';
			else return 'LastEditDate';
		},
		entryURL(state){
			if(state.psofiaVersion == 'v1') return 'https://eservices.cityoflewisville.com/psofia/node/index.html?form=42&recordnumber=';
			else return 'http://apps.cityoflewisville.com/psofia_v2/FormEntry/index.html?formID=42&recordNumber='
		},
	},
	// make changes to state with mutations
	// usage: this.$store.commit('mutationName')
	mutations: {
		// pass in metrics and save them
		storeMetrics(state, payload) {
			state.metrics = payload.metrics
			state.departments = payload.categories.filter(cat => cat.bmptype == 'department')
			state.citypriorities = payload.categories.filter(cat => cat.bmptype == 'priority')
			state.bigmoves = payload.categories.filter(cat => cat.bmptype == 'bigmove')
			state.isLoading = false
			state.softReloading = false
			state.lastRefreshed = Moment() //new Date()

			// update the relative time
			state.fromNow = state.lastRefreshed.fromNow()
			if (state.refreshedInterval != null) clearInterval(state.refreshedInterval)
			state.refreshedInterval = setInterval(() => {
				state.fromNow = state.lastRefreshed.fromNow()
			}, 5000)
		},
		storeStats(state, payload) {
			state.stats = payload.metrics
			state.statsCarouselIsLoading = false
		},
		clearMetrics(state) {
			state.metrics = []
			if(state.interval) clearInterval(state.interval)
			state.interval = null
			state.isLoading = true
			state.softReloading = true
		},
		setDomainName(state, payload){
			state.domainName = domainName
		},
		setSiteFilters(state, payload) {		// set in Dashboard.vue, every component loads with Dashboard.vue
			state.siteFilters = Object.assign(state.siteFilters, payload)
			/*state.siteFilters.sitename = payload.sitename
			state.siteFilters.status = payload.status
			state.siteFilters.type = payload.type
			state.siteFilters.master = payload.master*/
		},
		setSite(state, payload) {
			state.site = payload
		},
		setSize(state, payload) {
			state.underLarge = ($(window).width() < 1200) ? true : false
		}
	},
	// asynchronous actions (ajax calls)
	// usage: this.$store.dispatch('actionName')
	actions: {
		fetchPerfMeasures(context) {

			function get(context) {
				context.state.softReloading = true
				axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Metrics Master', {
					sitename: context.state.siteFilters.sitename,
					status: context.state.siteFilters.status,
					type: context.state.siteFilters.type,
					master: context.state.siteFilters.master
				})
				.then(results => {
					context.commit('storeMetrics', results.data)
					// console.log('> metrics retrieved', results.data.metrics)
				})
				.catch(error => {
					console.log(error)
				})
			}

			if (context.state.interval != null) clearInterval(context.state.interval) // only keep one timer
			get(context)
			context.state.interval = setInterval(() => {
				get(context)
			}, 300000)// 60000*5)
		},
		fetchCarouselMetrics(context, params) {

			function get(context, params) {
				axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Metrics Master', {
					sitename: 'landingPage',
					status: 'deployed',
					type: '',
					master: 'landing_page',
				})
				.then(results => {
					context.commit('storeMetrics', results.data)
				})
				.catch(error => {
					console.log(error)
				})
			}

			get(_context, params)
		},
		fetchCarouselStats(context, params) {

			function get(context, params) {
				axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Metrics Master', {
					sitename: 'stats',
					status: 'deployed',
					type: '',
					master: '',
				})
				.then(results => {
					context.commit('storeStats', results.data)
				})
				.catch(error => {
					console.log(error)
				})
			}

			get(_context, params)
		}
		fetchMetrics(context, params) {

			function get(context, params) {
				context.state.softReloading = true
				axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Metrics Master', {
					public: params.public,
					internal: params.internal,
					stat: params.stat,
					sitename: params.sitename,
					status: params.status,
					type: params.type,
					master: params.master
				})
				.then(results => {
					context.commit('storeMetrics', results.data)
					// console.log('> metrics retrieved', results.data.metrics)
				})
				.catch(error => {
					console.log(error)
				})
			}

			if (context.state.interval != null) clearInterval(context.state.interval) // only keep one timer
			get(context, params)
			context.state.interval = setInterval(() => {
				get(context, params)
			}, 300000)// 60000*5)
		},
		fetchStats(_context, params) {

			function get(context, params) {
				axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Metrics Master', {
					public: params.public,
					internal: params.internal,
					stat: params.stat,
					status: params.status,
					type: params.type,
					master: params.master
				})
				.then(_results => {
					_context.commit('storeStats', _results.data)
					return new Promise((resolve) => {
						resolve();
					})
				})
				.catch(error => {
					console.log(error)
				})
			}

			get(_context, params)
		}
	},
})