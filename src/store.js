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
		debug: true,
		routeDebug: true,
		securityDebug: true,
		isLoading: true,
		softReloading: true,
		detailCarouselSoftReloading: true,
		landingPageCarouselSoftReloading: true,

		metrics: [],		// used for both metrics.col return and stats.col return
		categories: [],
		//departments: [],
		//bigmoves: [],
		//citypriorities: [],
		detailCarousel: [],			// only used for stats carousel on metrics.col details page
		detailCarouselType: null,
		landingPageCarousel: [],	// used on landing page

		interval: null,
		carouselInterval: null,
		refreshedInterval: null,
		lastRefreshed: '',
		fromNow: '',

		fetchParams: {	//siteFilters: set in Dashboard.vue, every component loads with Dashboard.vue
			sitename: '',
			status: '',
			type: '',
			master: '',
		},

		domainName: '',
		userLoading: false,
		userEmail: '',
		//site: '',

		googleChartsLoaded: false,
		
		underLarge: true,
		width: 0,
		height: 0,

		psofiaVersion: 'v1',
		landingURL: 'https://metrics.cityoflewisville.com/',
		statsURL: 'http://stats.cityoflewisville.com/d/#',
		metricsURL: 'https://metrics.cityoflewisville.com/d/#',
	},


	// similar to 'computed' values
	getters: {
		isLoading_categories: (state, getters) => { return getters.fullCategories.length == 0 },
		isLoading_landingPageCarousel: (state) => { return state.landingPageCarousel.length == 0 },
		isLoading_detailCarousel: (state) => { return state.detailCarousel.length == 0 },
		isStats: (state) => { return state.domainName == 'stats' },
		currentURL: (state, getters) => { return (getters.isStats) ? state.statsURL : state.metricsURL },
		redirectURL: (state, getters) => { return (getters.isStats) ? state.metricsURL : state.statsURL },

		// CHANGE HERE if bmptype/categories/big moves/city priorities change
		categoryTypes: (state, getters) => {
			var categoryTypes = [
				{display: 'Departments', type: 'department', fieldName: getters.psofiaVars.categoryFieldNames[0], order: 1},
				{display: 'Big Moves', type: 'bigmove', fieldName: getters.psofiaVars.categoryFieldNames[1], order: 3},
				{display: 'City Priorities', type: 'priority', fieldName: getters.psofiaVars.categoryFieldNames[2], order: 2}
			]
			return categoryTypes
		},
		fullCategory: (state, getters) => (category) => {
			var deptParam = category.bmpdisplayname.toLowerCase().replace(/ /g, '')
			var categoryType = getters.categoryTypes.find(catType => catType.type == category.bmptype)
			var metricProp = null, order = 10
			if(categoryType){
				metricProp = categoryType.fieldName
				order = categoryType.order + 2
			}
			return { deptParam: deptParam, display: category.bmpdisplayname, id: category.bmpid, type: category.bmptype, metricProp: metricProp, order: order }
		},
		fullCategories: (state, getters) => { return state.categories.map((category) => { return getters.fullCategory(category) }) },
		categoriesByType: (state, getters) => (type) => {
			return getters.fullCategories.filter(cat => cat.type == type).sort((a,b) => {
				if (a.display.toLowerCase() < b.display.toLowerCase()) return -1
				if (a.display.toLowerCase() > b.display.toLowerCase()) return 1
				return 0
			})
		},
		countCategoriesByType: (state, getters) => (type) => { return getters.categoriesByType(type).length },
		hasCategoriesByType: (state, getters) => (type) => { return getters.fullCategories.some(cat => cat.type == type) },
		//bigmoves: (state, getters) => { return getters.fullCategories.filter(cat => cat.type == 'bigmove') },				//bigmoves: (state) => { return state.categories.filter(cat => cat.bmptype == 'bigmove') },
		//citypriorities: (state, getters) => { return getters.fullCategories.filter(cat => cat.type == 'priority') },		//citypriorities: (state) => { return state.categories.filter(cat => cat.bmptype == 'priority') },
		findCategoryByDisplay: (state, getters) => (payload) => {
			if(payload.display == 'All' || payload.display == 'All Departments') return state.categoryAll
			return getters.categoriesByType(payload.type).find(cat => { return cat.deptParam == payload.display.toLowerCase().replace(/ /g, '') })
		},

// handling psofia variables
		psofiaVars: (state) => {
			var psofiaVars = {
				primaryKey: 'RecordNumber',
				submitDateKey: 'OriginalSubmitDate',
				editDateKey: 'LastEditDate',
				categoryFieldNames: ['category1', 'category2', 'category3'],
				formURL: 'http://apps.cityoflewisville.com/psofia_v2/FormEntry/index.html?formID=42&recordNumber=',
			}
			if(state.psofiaVersion == 'v1'){
				psofiaVars.primaryKey = 'psofia_recordid'
				psofiaVars.submitDateKey = 'psofia_createddate'
				psofiaVars.editDateKey = 'psofia_editeddate'
				psofiaVars.categoryFieldNames[2] = 'cateogry3'	// misspelled in psofiav1
				psofiaVars.formURL = 'http://eservices.cityoflewisville.com/psofia/node/index.html?form=42&recordnumber='
			}
			return psofiaVars
		},
// metric props
		metricPropForCategoryByType: (state, getters) => (type) => {
			var categoryType = getters.categoryTypes.find(catType => catType.type == type)
			if(categoryType) return categoryType.fieldName
			return null
		},
		metricSitename: (state) => (metric) => {
			if(metric.sitename && (metric.sitename.toLowerCase() == 'stat' || metric.sitename.toLowerCase() == 'metricpublic' || metric.sitename.toLowerCase() == 'data' || metric.sitename.toLowerCase() == 'metricinternal')) return metric.sitename;
			if(metric.metricispublic && !(metric.metricisinternal) && !(metric.metricisstat)) return 'metricPublic'
			if(metric.metricisinternal && !(metric.metricispublic) && !(metric.metricisstat)) return 'metricInternal'
			if(metric.metricisstat && !(metric.metricispublic) && !(metric.metricisinternal)) return 'stat'
			return null
		},
		metricStatus: (state) => (metric) => {
			if(metric.metricStatus && (metric.metricStatus.toLowerCase() == 'deployed' || metric.metricStatus.toLowerCase() == 'development' || metric.metricStatus.toLowerCase() == 'review')) return metric.metricStatus
			return null
		},
		metricType: (state) => (metric) => {
			if(metric.metrictype && (metric.metrictype.toLowerCase() == 'query' || metric.metrictype.toLowerCase() == 'static')) return metric.metrictype
			return null
		},
		metricCategory: (state, getters) => (payload) => {
			var category, metricProp, metric
			if(payload.hasOwnProperty('metric')) metric = payload.metric
			if(payload.hasOwnProperty('category') && (!payload.category || payload.category.hasOwnProperty('id'))) category = payload.category
			else if(payload.hasOwnProperty('category') && !payload.category.hasOwnProperty('id')) category = getters.fullCategory(payload.category)
			else if(payload.hasOwnProperty('deptParam')) category = getters.fullCategoryByDeptParam(payload.deptParam)
			if(category && category.id.toLowerCase() != 'loading' && category.id.toLowerCase() != 'all') metricProp = category.metricProp
			else if(payload.hasOwnProperty('type')) metricProp = getters.metricPropForCategoryByType(payload.type)
			else if(payload.hasOwnProperty('metricProp')) metricProp = payload.metricProp

			if(!metricProp) console.error('ERROR: metricCategory - no metricprop in params')
			if(!metric) console.error('ERROR: metricCategory - no metric in params')
			if(metricProp && metric.hasOwnProperty(metricProp) && metric[metricProp]) return metric[metricProp]
			return null
		},
		// determine metric route location
		metricRouteLocation: (state, getters) => (metric) => {
			var sitename = getters.metricSitename(metric)
			return getters.routeLocationBySitename(sitename)
		},
		checkIfStat: (state, getters) => (metric) => {
			return getters.metricSitename(metric) == 'stat' ? true : false
		},
		findMetricByID: (state, getters) => (payload) => {
			var primaryKey = getters.psofiaVars.primaryKey
			return state.metrics.find(metric => { return metric[primaryKey] == payload.id })
		},
// route parameters
		routeLocations: (state, getters) => {
			var locations = []
			locations.push({ locationParam: 'admin', display: 'All Sites', sitename: 'all', order: 1 })
			locations.push({ locationParam: 'public', display: 'Metrics', sitename: 'metricPublic', typeOf: 'Metric', order: (getters.isStats ? 3 : 2) })
			locations.push({ locationParam: 'internal', display: 'Internal Metrics', sitename: 'metricInternal', typeOf: 'Metric', order: (getters.isStats ? 4 : 3) })
			locations.push({ locationParam: 'internalonly', display: 'Internal Only', sitename: 'metricInternal', typeOf: 'Metric', order: (getters.isStats ? 5 : 4) })
			locations.push({ locationParam: 'stats', display: 'Stats', sitename: 'stat', typeOf:'Stat', order: (getters.isStats ? 2 : 5) })
			locations.push({ locationParam: 'data', display: 'Data', sitename: 'data', typeOf: 'Data', order: 6 })
			locations.push({ locationParam: 'unknown', display: 'Unknown', sitename: null, typeOf: '?', order: 7 })
			return locations
		},
		routeDepts: (state, getters) => {
			var depts = []
			var categoryAll = { deptParam: 'all', display: 'All', id: 'all', type: null, order: 1 };
			var categoryNone = { deptParam: 'missing', display: 'Missing', id: 'none', type: null, order: 2 };
			depts.push( categoryAll )
			depts.push( categoryNone )
			if(!getters.isLoading_categories) depts = depts.concat(getters.fullCategories);
			return depts
		},
		routeStatuses: (state, getters) => {
			var statuses = []
			statuses.push({ statusParam: 'deployed', display: 'Public', status: 'deployed', order: 1 })
			statuses.push({ statusParam: 'review', display: 'Review', status: 'review', order: 2 })
			statuses.push({ statusParam: 'development', display: 'Development', status: 'development', order: 3 })
			statuses.push({ statusParam: 'missing', display: 'Missing', status: null, order: 4 })
			return statuses
		},
		routeLocationByLocationParam: (state, getters) => (locationParam) => { return getters.routeLocations.find(routeLocation => routeLocation.locationParam == locationParam) },
		routeLocationBySitename: (state, getters) => (sitename) => { return getters.routeLocations.find(routeLocation => routeLocation.sitename == sitename) },
		fullCategoryByDeptParam: (state, getters) => (deptParam) => {
			if(getters.isLoading_categories) return { id: 'loading', display: 'Loading', deptParam: deptParam }
			return getters.routeDepts.find(category => category.deptParam == deptParam)
		},
		fullStatusByStatusParam: (state, getters) => (statusParam) => { return getters.routeStatuses.find(status => status.statusParam == statusParam) },
// filtered list of metrics
		checkAllMetricCategories: (state, getters) => (payload) => {	// payload: metric, category
			if(payload.category.id.toLowerCase() == 'none'){
				return getters.psofiaVars.categoryFieldNames.every(metricProp => {
					var metricCategory = getters.metricCategory({ metric: payload.metric, metricProp: metricProp })
					return (!metricCategory)
				})
			}
			return getters.psofiaVars.categoryFieldNames.some(metricProp => {
				var metricCategory = getters.metricCategory({ metric: payload.metric, metricProp: metricProp })
				return (metricCategory && metricCategory.toLowerCase() == payload.category.id.toLowerCase())
			})
		},
		metricsByPayload: (state, getters) => (payload) => {
			var type, status, routeLocation, category, categoryType
			if(payload.hasOwnProperty('type')) type = payload.type
			if(payload.hasOwnProperty('statusParam')) status = ((payload.statusParam == 'missing') ? null : payload.statusParam)
			else if(payload.hasOwnProperty('status')) status = payload.status
			if(payload.hasOwnProperty('routeLocation')) routeLocation = payload.routeLocation
			else if(payload.hasOwnProperty('locationParam')) routeLocation = getters.routeLocationByLocationParam(payload.locationParam)
			else if(payload.hasOwnProperty('sitename')) routeLocation = getters.routeLocationBySitename(payload.sitename)
			if(payload.hasOwnProperty('category') && (!payload.category || payload.category.hasOwnProperty('id'))) category = payload.category
			else if(payload.hasOwnProperty('category') && !payload.category.hasOwnProperty('id')) category = getters.fullCategory(payload.category)
			else if(payload.hasOwnProperty('deptParam')) category = getters.fullCategoryByDeptParam(payload.deptParam)
			if(payload.hasOwnProperty('categoryType')) categoryType = payload.categoryType

			// return empty array if no category or loading category
			if((payload.hasOwnProperty('category') || payload.hasOwnProperty('deptParam')) && (!category || category.id.toLowerCase() == 'loading')) return []
			return state.metrics.filter(metric => {
				if(payload.hasOwnProperty('type')){
					var metricType = getters.metricType(metric)
					if(!metricType || metricType.toLowerCase() != type.toLowerCase()) return false
				}
				if(payload.hasOwnProperty('statusParam') || payload.hasOwnProperty('status')){
					var metricStatus = getters.metricStatus(metric)
					if( status && (!metricStatus || metricStatus.toLowerCase() != status.toLowerCase()) ) return false
					else if(!status && metricStatus) return false
				}
				if(payload.hasOwnProperty('routeLocation') || payload.hasOwnProperty('locationParam') || payload.hasOwnProperty('sitename')){
					if(routeLocation.sitename != 'all'){
						var metricSitename = getters.metricSitename(metric)
						if(routeLocation.sitename && !metricSitename) return false
						if(!routeLocation.sitename && metricSitename) return false
						// internal returns both public & internal (unless internal only)
						if(routeLocation.sitename && routeLocation.sitename.toLowerCase() == 'metricinternal' && routeLocation.locationParam.toLowerCase() != 'internalonly'){
							// if edit view (not deployed), show only exact match
							if((payload.hasOwnProperty('statusParam') || payload.hasOwnProperty('status')) && status.toLowerCase() != 'deployed'){
								if(metricSitename.toLowerCase() != routeLocation.sitename.toLowerCase()) return false
							}
							else if (metricSitename.toLowerCase() != 'metricpublic' && metricSitename.toLowerCase() != 'metricinternal') return false
						}
						else if(routeLocation.sitename && metricSitename.toLowerCase() != routeLocation.sitename.toLowerCase()) return false
					}
				}
				if(payload.hasOwnProperty('category') || payload.hasOwnProperty('deptParam')){
					if(category.id.toLowerCase() != 'all'){
						if( (category.id.toLowerCase() == 'none' && !categoryType) || (payload.hasOwnProperty('checkAll') && payload.checkAll) ){
							var hasCategory = getters.checkAllMetricCategories({ metric: metric, category: category })
							if(!hasCategory) return false
						}
						else{
							if(category.id.toLowerCase() == 'none' && categoryType){
								var metricCategory = getters.metricCategory({ metric: metric, type: categoryType })
								if(metricCategory) return false
							}
							else if(category.id.toLowerCase() != 'none'){
								var metricCategory = getters.metricCategory({ metric: metric, type: category.type })
								if(!metricCategory || metricCategory.toLowerCase() != category.id.toLowerCase()) return false
							}
						}
					}
				}
				return true
			})
		},
		countMetricsByPayload: (state, getters) => (payload) => { return getters.metricsByPayload(payload).length },
		// category only, but same as metricsByPayload
		detailCarouselByPayload: (state, getters) => (payload) => {
			var category
			if(payload.hasOwnProperty('category') && (!payload.category || payload.category.hasOwnProperty('id'))) category = payload.category
			else if(payload.hasOwnProperty('category') && !payload.category.hasOwnProperty('id')) category = getters.fullCategory(payload.category)
			else if(payload.hasOwnProperty('deptParam')) category = getters.fullCategoryByDeptParam(payload.deptParam)
			if(payload.hasOwnProperty('categoryType')) categoryType = payload.categoryType

			if(!category || category.id.toLowerCase() == 'loading') return []
			if(category.id.toLowerCase() == 'all') return state.detailCarousel
			return state.detailCarousel.filter(metric => {
				if( (category.id.toLowerCase() == 'none' && !categoryType) || (payload.hasOwnProperty('checkAll') && payload.checkAll) ){
					var hasCategory = getters.checkAllMetricCategories({ metric: metric, category: category })
					if(!hasCategory) return false
				}
				else{
					if(category.id.toLowerCase() == 'none' && categoryType){
						var metricCategory = getters.metricCategory({ metric: metric, type: categoryType })
						if(metricCategory) return false
					}
					else if(category.id.toLowerCase() != 'none'){
						var metricCategory = getters.metricCategory({ metric: metric, type: category.type })
						if(!metricCategory || metricCategory.toLowerCase() != category.id.toLowerCase()) return false
					}
				}
				return true
			})
		},
		countDetailCarouselByPayload: (state, getters) => (payload) => { return getters.detailCarouselByPayload(payload).length },
		// some instead of filter, no status, only null for category/status, data/unknown otherwise same as metricsByPayload
		checkInclude: (state, getters) => (payload) => {
			var status, routeLocation, category
			if(payload.hasOwnProperty('statusParam')) status = ((payload.statusParam == 'missing') ? null : payload.statusParam)
			if(payload.hasOwnProperty('routeLocation')) routeLocation = payload.routeLocation
			if(payload.hasOwnProperty('category')) category = payload.category
			if(payload.hasOwnProperty('categoryType')) categoryType = payload.categoryType

			return state.metrics.some(metric => {
				if(payload.hasOwnProperty('statusParam')){
					var metricStatus = getters.metricStatus(metric)
					if(!status && !metricStatus) return true
				}
				if(payload.hasOwnProperty('routeLocation')){
					var metricSitename = getters.metricSitename(metric)
					if(!routeLocation.sitename && !metricSitename) return true
					else if(routeLocation.sitename && metricSitename && metricSitename.toLowerCase() == routeLocation.sitename.toLowerCase()) return true
				}
				if(payload.hasOwnProperty('category')){
					if( category.id.toLowerCase() == 'none' && !categoryType ){
						var hasCategory = getters.checkAllMetricCategories({ metric: metric, category: category })
						if(hasCategory) return true
					}
					else{
						if(categoryType){
							var metricCategory = getters.metricCategory({ metric: metric, type: categoryType })
							if(!metricCategory) return true
						}
					}
				}
				return false
			})
		},
// metric props - long
		// payload: metric, val ('current'/'weekly'/'monthy')
		metricValue: (state, getters) => (payload) => {
			var type = getters.metricType(payload.metric)
			var actualVal = null, numVal = null	// numVal only used in components if needing to calculate
			var fixedVal = null, percentVal = null, str = '', commaStr = ''
			var showGauge = false, addPercent = false, hasError = false
			if (type.toLowerCase() == 'static') {
				if (payload.metric.staticsymbol.toLowerCase() == 'text'){
					actualVal = payload.metric.statictext
					if(actualVal !== null && actualVal !== ''){
						str = payload.metric.statictext
					} else hasError = true
				}
				else if (payload.metric.staticsymbol.toLowerCase() == 'gauge'){
					actualVal = payload.metric.staticgauge
					showGauge = true
					if(actualVal !== null && actualVal !== ''){
						if(typeof(actualVal) === 'number') numVal = actualVal
						else numVal = Number(actualVal)
						fixedVal = numVal
						percentVal = Number((numVal*100).toFixed(2))
						str = fixedVal.toString()
					} else hasError = true
				} else hasError = true
			}
			else if (type.toLowerCase() == 'query') {
				var valProp = 'CurrentValue'
				if(payload.hasOwnProperty('val')){
					if(payload.val.toLowerCase() == 'weekly') valProp = 'WeeklyValue'
					else if(payload.val.toLowerCase() == 'monthly') valProp = 'MonthlyValue'
				}
				actualVal = payload.metric[valProp]

				if(actualVal !== null && actualVal !== ''){
					if(typeof(actualVal) === 'number') numVal = actualVal
					else numVal = Number(actualVal)
					
					var decPlaces = (payload.metric.decimalplaces == null) ? 2 : payload.metric.decimalplaces
					if(payload.hasOwnProperty('short') && payload.short) decPlaces = 2
					
					if(payload.metric.gaugedataformat.toLowerCase() == 'percent'){
						showGauge = true
						addPercent = true
						fixedVal = Number(numVal.toFixed(decPlaces))
						percentVal = Number((numVal).toFixed(2))
					}
					else if(payload.metric.prevaluetext == '$') fixedVal = Number(numVal.toFixed(2))
					else fixedVal = Number(numVal.toFixed(decPlaces))
					
					str = fixedVal.toString()
				} else hasError = true
			} else hasError = true

			var separated = str.split('.')
			var integralStr  = separated[0]
			var fractionalStr = (separated.length > 1) ? ('.' + separated[1]) : ''
			var rgx = /(\d+)(\d{3})/;
			while (rgx.test(integralStr)) { integralStr = integralStr.replace(rgx, '$1' + ',' + '$2'); }
			commaStr = integralStr
			commaStr += fractionalStr

			// always add percent sign
			if(addPercent){
				str = str + '%'
				commaStr = commaStr + '%'
			}
			// only add prevalue and postvalue if not short (ListOfMetrics)
			if(!payload.hasOwnProperty('short') || !payload.short){
				if(payload.metric.prevaluetext !== null){
					str = payload.metric.prevaluetext + str
					commaStr = payload.metric.prevaluetext + commaStr
				}
				if(payload.metric.postvaluetext !== null){
					str = str + payload.metric.postvaluetext
					commaStr = commaStr + payload.metric.postvaluetext
				}
			}
			return { actualVal: actualVal, numVal: numVal, fixedVal: fixedVal, percentVal: percentVal, str: str, commaStr: commaStr, showGauge: showGauge, error: hasError, }
		},
		// navigation to specific metric
		metricLinks: (state, getters) => (metric) => {
			var editOnly = false, viewRedirect = false, formURL, viewParams, editParams
			var viewURL = getters.currentURL

			var dept = metric.Department.toLowerCase().replace(/ /g, '')
			var primaryKey = getters.psofiaVars.primaryKey
			var id = metric[primaryKey]
			var formURL = getters.psofiaVars.formURL + id
			var routeLocation = getters.metricRouteLocation(metric)
			var status = getters.metricStatus(metric)
			if(!status) status = 'missing'
			viewParams = {
				location: routeLocation.locationParam,
				dept: dept,
				id: id,
			}
			editParams = Object.assign({}, viewParams, {status: status})
			// unknown & data are edit only, stays in current domain
			if(!routeLocation.sitename || routeLocation.sitename == 'data' || !status || status != 'deployed'){
				editOnly = true
			}
			else{
				if((!getters.isStats && routeLocation.sitename == 'stat') || (getters.isStats && routeLocation.sitename != 'stat')){
					viewURL = getters.redirectURL
					viewRedirect = true
				}
			}
			return {
				viewURL: viewURL,
				viewRedirect: viewRedirect,
				viewParams: viewParams,
				editOnly: editOnly,
				editParams: editParams,
				formURL: formURL,
			}
		},
	},

	// make changes to state with mutations
	// usage: this.$store.commit('mutationName')
	mutations: {
		// pass in metrics and save them
		storeMetrics(state, payload) {
			if(state.debug) console.warn('storeMetrics')
			state.categories = payload.categories
			state.metrics = payload.metrics
			//state.departments = payload.categories.filter(cat => cat.bmptype == 'department')
			//state.citypriorities = payload.categories.filter(cat => cat.bmptype == 'priority')
			//state.bigmoves = payload.categories.filter(cat => cat.bmptype == 'bigmove')
			state.isLoading = false
			state.softReloading = false
			state.lastRefreshed = Moment() //new Date()

			// update the relative time
			state.fromNow = state.lastRefreshed.fromNow()
			if (state.refreshedInterval) state.refreshedInterval = clearInterval(state.refreshedInterval)
			state.refreshedInterval = setInterval(() => {
				state.fromNow = state.lastRefreshed.fromNow()
			}, 5000)
		},
		storeDetailCarousel(state, payload) {
			if(state.debug) console.warn('storeDetailCarousel')
			state.detailCarousel = payload.metrics
			state.detailCarouselSoftReloading = false
		},
		storeLandingPageCarousel(state, payload) {
			if(state.debug) console.warn('storeLandingPageCarousel')
			state.landingPageCarousel = payload.metrics
			state.landingPageCarouselSoftReloading = false
		},
		clearMetrics(state) {
			if(state.debug) console.warn('clearMetrics')
			if(state.interval) state.interval = clearInterval(state.interval)
			state.isLoading = true
			state.softReloading = true
			state.metrics = []
		},
		clearDetailCarousel(state) {
			if(state.debug) console.warn('clearDetailCarousel')
			if(state.carouselInterval) state.carouselInterval = clearInterval(state.carouselInterval)
			state.detailCarouselSoftReloading = true
			state.detailCarousel = []
		},
		clearLandingPageCarousel(state) {
			if(state.debug) console.warn('clearLandingPageCarousel')
			state.landingPageCarouselSoftReloading = true
			state.landingPageCarousel = []
		},
		setDomainName(state, payload){
			if(state.debug) console.warn('set domain name ' + payload.domainName)
			state.domainName = payload.domainName
		},
		setFetchParams(state, payload) {		// set in Dashboard.vue, every component loads with Dashboard.vue
			state.fetchParams = Object.assign(state.fetchParams, payload)
		},
		setDetailCarouselType(state, payload) {		// set in Dashboard.vue, every component loads with Dashboard.vue
			if(state.debug) console.warn('setDetailCarouselType: ' + payload)
			state.detailCarouselType = payload
		},
		setGoogleChartsLoaded(state, payload) {
			if(state.debug) console.warn('google charts loaded')
			state.googleChartsLoaded = true
		},
		setSize(state, payload) {
			if(state.debug) console.warn('setSize: ' + payload.width + ' w ' + payload.height + ' h')
			state.underLarge = (payload.width < 1200) ? true : false
			state.width = payload.width
			state.height = payload.height
		},
		login(state, payload){
			if(state.routeDebug) console.error('login ' + payload.email)
			state.userEmail = payload.email;
		},
		logout(state){
			if(state.routeDebug) console.error('logout')
			state.userEmail = '';
		},

	},

	// asynchronous actions (ajax calls)
	// usage: this.$store.dispatch('actionName')
	actions: {
		updateFetchParams(context, payload){
			var diff = 0, hasChange = false, hasChangeC = false
			if(context.state.lastRefreshed) diff = Moment().diff(context.state.lastRefreshed) 
			//if(context.state.debug) console.log(diff)
			//if(context.state.debug) console.log(payload)

			// if params have changed (or initial), set store params; clear metrics if not master
			if( payload.hasOwnProperty('params') && (context.state.fetchParams.sitename != payload.params.sitename || context.state.fetchParams.status != payload.params.status || context.state.fetchParams.type != payload.params.type || context.state.fetchParams.master != payload.params.master) ){			
				// master 'all' unchanged only updates fetch params, return from ws is the same so no need to clear & call again immediately
				if(context.state.fetchParams.master == 'all' && payload.params.master == 'all'){
					context.commit('setFetchParams', payload.params)
				}
				else{
					context.commit('setFetchParams', payload.params)
					if(context.state.metrics.length != 0) context.commit('clearMetrics')
					hasChange = true
				}
			}
			// fetch data if params changed or >5 min since last fetch
			if(payload.hasOwnProperty('params') && (hasChange || diff >= 300000)){
				context.dispatch('fetchPerfMeasures')
			}

			// only for details page, if carousel type has changed (or initial); clear carousel stats/metrics
			if(payload.hasOwnProperty('detailCarouselType') && context.state.detailCarouselType != payload.detailCarouselType){
				context.commit('setDetailCarouselType', payload.detailCarouselType)
				context.commit('clearDetailCarousel')
				hasChangeC = true
			}
			// fetch data if carousel type changed or >5 min since last fetch
			if(payload.hasOwnProperty('detailCarouselType') && (hasChangeC || diff >= 300000)){
				context.dispatch('fetchDetailCarousel')
			}
		},
		fetchPerfMeasures(context) {

			function get(context) {
				if(context.state.debug) console.log('fetchPerfMeasures')
				context.state.softReloading = true
				// webservice should be reordered so master = 'all' check comes before sitename check
				axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Metrics Master', {
					sitename: context.state.fetchParams.master == 'all' ? '' : context.state.fetchParams.sitename,
					status: context.state.fetchParams.status,
					type: context.state.fetchParams.type,
					master: context.state.fetchParams.master
				})
				.then(results => {
					context.commit('storeMetrics', results.data)
					//if(context.state.debug) console.log('> metrics retrieved', results.data.metrics)
				})
				.catch(error => {
					console.error(error)
				})
			}

			if (context.state.interval) context.state.interval = clearInterval(context.state.interval) // only keep one timer
			get(context)
			// no longer any need to refresh details page
			/*context.state.interval = setInterval(() => {
				get(context)
			}, 300000)// 60000*5)*/
		},
		fetchDetailCarousel(context) {
			// determine which carousel to fetch
			if(context.state.detailCarouselType == 'statsCarousel') context.dispatch('fetchStatsCarousel') 
			else if(context.state.detailCarouselType == 'metricsCarousel') context.dispatch('fetchMetricsCarousel')
		},
		fetchStatsCarousel(context) {

			function get(context) {
				if(context.state.debug) console.log('fetchStatsCarousel')
				context.state.detailCarouselSoftReloading = true
				axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Metrics Master', {
					sitename: 'stat',
					status: 'deployed',
					type: 'Query',
					master: 'detailCarousel'
				})
				.then(results => {
					context.commit('storeDetailCarousel', results.data)
				})
				.catch(error => {
					console.error(error)
				})
			}

			if (context.state.carouselInterval) context.state.carouselInterval = clearInterval(context.state.carouselInterval) // only keep one timer
			get(context)
			// no longer any need to refresh details page
			/*context.state.carouselInterval = setInterval(() => {
				get(context)
			}, 300000)// 60000*5)*/
		},
		fetchMetricsCarousel(context) {

			function get(context) {
				if(context.state.debug) console.log('fetchMetricsCarousel')
				context.state.detailCarouselSoftReloading = true
				axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Metrics Master', {
					sitename: 'metricPublic',
					status: 'deployed',
					type: 'Query',
					master: 'detailCarousel'
				})
				.then(results => {
					context.commit('storeDetailCarousel', results.data)
				})
				.catch(error => {
					console.error(error)
				})
			}

			if (context.state.carouselInterval) context.state.carouselInterval = clearInterval(context.state.carouselInterval) // only keep one timer
			get(context)
			// no longer any need to refresh details page
			/*context.state.carouselInterval = setInterval(() => {
				get(context)
			}, 300000)// 60000*5)*/
		},
		fetchLandingPageCarousel(context) {

			function get(context) {
				if(context.state.debug) console.log('fetchLandingPageCarousel')
				context.state.landingPageCarouselSoftReloading = true
				axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Metrics Master', {
					sitename: '',
					status: 'deployed',
					type: 'Query',
					master: 'landingCarousel'
				})
				.then(results => {
					context.commit('storeLandingPageCarousel', results.data)
					//if(context.state.debug) console.log('> metrics retrieved', results.data.metrics)
				})
				.catch(error => {
					console.error(error)
				})
			}

			if (context.state.interval) context.state.interval = clearInterval(context.state.interval)
			if (context.state.carouselInterval) context.state.carouselInterval = clearInterval(context.state.carouselInterval)
			get(context)
		},
	},
})


// getters - list of metrics with filters - alt
// !!! NOT SETUP FOR NULL
		/*metricsByType: (state, getters) => (type) => {			// query or static
			return state.metrics.filter(metric => {
				var metricType = getters.metricType(metric)
				return (metricType && metricType.toLowerCase() == type.toLowerCase())
			})
		},
		metricsByStatusParam: (state, getters) => (statusParam) => {
			var status = ((statusParam == 'missing') ? null : statusParam)
			return state.metrics.filter(metric => {
				var metricStatus = getters.metricStatus(metric)
				return (metricStatus && metricStatus.toLowerCase() == status.toLowerCase())
			})
		},
		countMetricsByStatusParam: (state, getters) => (statusParam) => { return getters.metricsByStatusParam(statusParam).length },
		metricsByRouteLocation: (state, getters) => (routeLocation) => {
			if (routeLocation.sitename == 'all') return state.metrics
			return state.metrics.filter(metric => {
				var metricSitename = getters.metricSitename(metric)
				if(!metricSitename) return false
				// internal returns both public & internal
				if(routeLocation.sitename.toLowerCase() == 'metricinternal'){
					return ((metricSitename.toLowerCase() == 'metricpublic' || metricSitename.toLowerCase() == 'metricinternal'))
				}
				else return (metricSitename.toLowerCase() == routeLocation.sitename.toLowerCase())
			})
		},
		countMetricsByRouteLocation: (state, getters) => (routeLocation) => { return getters.metricsByRouteLocation(routeLocation).length },
		metricsByCategory: (state, getters) => (category) => {		// full category param, if want to check all 3 metric properties for match use metricsbypayload
			if(!category || category.id == 'loading') return []
			if(category.id == 'all') return state.metrics
			return state.metrics.filter(metric => {
				var metricCategory = getters.metricCategory({ metric: metric, type: category.type })
				return (metricCategory && metricCategory.toLowerCase() == category.id.toLowerCase())
			})
		},
		countMetricsByCategory: (state, getters) => (category) => { return getters.metricsByCategory(category).length },	// full category param, if want to check all 3 metric properties for match use metricsbypayload
		//metricsByDeptParam: (state, getters) => (deptParam) => { return getters.metricsByCategory(getters.fullCategoryByDeptParam(deptParam)) },
		//countMetricsByDeptParam: (state, getters) => (deptParam) => { return getters.metricsByDeptParam(deptParam).length },
		//metricsByLocationParam: (state, getters) => (locationParam) => { return getters.metricsByRouteLocation(getters.routeLocationByLocationParam(locationParam)) },
		//countMetricsByLocationParam: (state, getters) => (locationParam) => { return getters.metricsByLocationParam(locationParam).length },*/