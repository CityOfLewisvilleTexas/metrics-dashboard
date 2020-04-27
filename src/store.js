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
		lastRefreshed: '',
		fromNow: '',
		interval: null,
		refreshedInterval: null,
		isLoading: true,
		softReloading: true,
		site: '',
		underLarge: true
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
			state.lastRefreshed = new Date()

			// update the relative time
			state.fromNow = Moment(state.lastRefreshed).fromNow()
			if (state.refreshedInterval != null) clearInterval(state.refreshedInterval)
			state.refreshedInterval = setInterval(() => {
				state.fromNow = Moment(state.lastRefreshed).fromNow()
			}, 10000)
		},
		storeStats(state, payload) {
			state.stats = payload.metrics
		},
		clearMetrics(state) {
			state.metrics = []
			clearInterval(state.interval)
			state.interval = null
			state.isLoading = true
			state.softReloading = true
		},
		setSite(state, payload) {
			state.site = payload
		},
		setSize(state, payload) {
			state.underLarge = ($(window).width() < 1200) ? true : false
			$(window).resize(function() {
				state.underLarge = ($(window).width() < 1200) ? true : false
			})
		}
	},
	// asynchronous actions (ajax calls)
	// usage: this.$store.dispatch('actionName')
	actions: {
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

			get(context, params)
			if (context.state.interval != null) clearInterval(context.state.interval) // only keep one timer
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
	// similar to 'computed' values
	getters: {}
})