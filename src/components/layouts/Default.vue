<template>
	<div>
		<header>
			<div class="navbar-fixed">
				<nav>
					<div id="top-nav" class="nav-wrapper col-purple left-align">
						<div class="logo"></div>
						<div class="city-brand white-text text-darken-3">City of Lewisville</div>
						<ul class="right">
							<li v-if="!underLarge">
								<SearchMetricsBar :config="navsearchconfig" />
							</li>
							<li>
								<a @click="fetchMetrics" data-position="left" data-delay="0" data-tooltip="Refresh" class="tooltipped">
									<i class="material-icons" :class="{ active : isRefreshing }">refresh</i>
								</a>
							</li>
						</ul>
					</div>
				</nav>
			</div>
		</header>

		<main>

			<div v-if="isLoading" class="spinner">
				<div class="double-bounce1"></div>
				<div class="double-bounce2"></div>
			</div>

			<transition appear name="fade">
				<div v-if="!isLoading" class="main">

					<div class="row lowmarg">
						<div class="col s12">
							<SearchMetricsBar v-if="underLarge" :config="searchconfig" />
						</div>
						<div class="col s12 refresh-text left-align valign-wrapper">
							<div v-if="isRefreshing" id="updating-loader" class="small spinner">
								<div class="double-bounce1"></div>
								<div class="double-bounce2"></div>
							</div>
							<div v-if="isRefreshing" class="updating nudge-right">
								Updating...
							</div>
							<div v-if="!isRefreshing" class="nudge-right">
								Updated {{ refreshedAt }}.
							</div>
						</div>
					</div>

					<div class="row lowmarg">
						<div class="col s12 m8 l4 left-align">
							<DepartmentsDropdown />
						</div>
					</div>

					<div class="row lowmarg">
						<div class="col s12 xl2 grid left-align" id="g0">
							<GoalsPie2 :config="config0" />
						</div>
						<div class="col s12 xl6 grid left-align" id="g1">
							<DualHistoryGraph2 :config="config1" :saveSettings="saveSettings" />
						</div>
						<div class="col s12 xl4 grid" id="g8">
							<ESRIMap :config="config9" />
						</div>
					</div>

					<div class="row lowmarg" shortcut>
						<div class="col s12 xl3 grid" id="g9">
							<GoogleMap :config="config10" />
						</div>
						<div class="col s12 l8 xl6 grid left-align" id="g2">
							<HistoryGraph2 :config="config2" :saveSettings="saveSettings" />
						</div>
						<div class="col s12 l4 xl3 grid left-align" id="g10">
							<TextBox :config="config11" />
						</div>
					</div>

					<div class="row lowmarg" shortcut>
						<div class="col s12 l6 xl4 nopad">
							<div class="col s12 m6 l12 grid" id="g3">
								<KPI :config="config3" :saveSettings="saveSettings" />
							</div>
							<div class="col s12 m6 l12 grid" id="g4">
								<KPI :config="config4" :saveSettings="saveSettings" />
							</div>
							<div class="col s12 m6 l12 grid" id="g5">
								<KPI :config="config5" :saveSettings="saveSettings" />
							</div>
							<div class="col s12 m6 l12 grid" id="g6">
								<KPI :config="config6" :saveSettings="saveSettings" />
							</div>
							<div class="col s12 m6 l12 grid" id="g12">
								<KPI :config="config12" :saveSettings="saveSettings" />
							</div>
						</div>
						<div class="col s12 l6 xl8 grid" id="g7">
							<ListOfMetrics :config="config7" :saveSettings="saveSettings" />
						</div>
					</div>

				</div>
			</transition>

		</main>
	</div>
</template>

<script>
import GoalsPie2 from '../widgets/GoalsPie2'
import HistoryGraph2 from '../widgets/HistoryGraph2'
import DualHistoryGraph2 from '../widgets/DualHistoryGraph2'
import ListOfMetrics from '../widgets/ListOfMetrics'
import KPI from '../widgets/KPI'
import SearchMetricsBar from '../widgets/SearchMetricsBar'
import ESRIMap from '../widgets/ESRIMap'
import GoogleMap from '../widgets/GoogleMap'
import TextBox from '../widgets/TextBox'
import DepartmentsDropdown from '../widgets/DepartmentsDropdown'
export default {
	name: 'Default',
	components: { GoalsPie2, HistoryGraph2, DualHistoryGraph2, ListOfMetrics, KPI, SearchMetricsBar, ESRIMap, GoogleMap, TextBox, DepartmentsDropdown },
	props: [],
	beforeRouteUpdate (to, from, next) {
		if(this.debug) console.log('Default - beforeRouteUpdate')
        if(this.isStats) next({ name: 'Stats' })
        else next()
	},
	data () {
		return {
			debug: true,
			needsInit: true,
			needsInit_materialize: true,
			params: {
				sitename: 'metricPublic',
				status: 'deployed',
				type: '',
				master: '',
				auth: false,
			},

			id: 'l3',
			saveSettings: {
				callback: this.saveLayout,
				localStorageKey: 'l3'
			},
			searchconfig:{ compid: 'small-search', nav: false, editing: false, },
			navsearchconfig:{ compid: 'nav-search', nav: true, editing: false, },
			config0: {
				compid: 'g0-pie',
				noBackground: false,
				// dept: 'Public Services'
			},
			config1: {
				compid: 'g1-graph',
				title: 'PD/FD Response Time to Priority 1 Calls',
				metricID_1: '87DFF30F66B5419C96B4D760DD0E2952',
				metricID_2: '30C81A8705FF48CDAA0AE5FB558041D1',
				label1: 'PD Response Time (min)',
				label2: 'FD Response Time (min)',
				min: 0,
				anim: 1000
			},
			config2: {
				compid: 'g2-graph',
				title: null,
				metricID: '31B30EEF5DF9476CBD0D01394E884A08',
				//metricID: '07A3596CDC8746F48DE5B3CB54514C76',
				goal: 14,
				editable: false,
				min: 5,
				max: 20,
				anim: 1000
			},
			config3: {
				compid: 'g3-kpi',
				metricID: '9B640C1A39444E71B067B716F47E2F84', 
				editable: false
			},
			config4: {
				compid: 'g4-kpi',
				metricID: 'ACE5BF5D40234EEDB70E02435802D231',
				editable: false
			},
			config5: {
				compid: 'g5-kpi',
				metricID: '87DFF30F66B5419C96B4D760DD0E2952',
				editable: false
			},
			config6: {
				compid: 'g6-kpi',
				metricID: '30C81A8705FF48CDAA0AE5FB558041D1',
				editable: false
			},
			config12: {
				compid: 'g12-kpi',
				metricID: '1FFCBA0879E54C33ADD83FC736E68A73',
				editable: false
			},
			config7: {
				compid: 'g7-list',
				editable: false
			},
			config8: {
				compid: 'g8-bar',
				anim: true
			},
			config9: {
				compid: 'potholes',
				height: '100%',
				title: 'Pothole Work Orders',
				url: '//lewisville.maps.arcgis.com/apps/Embed/index.html?webmap=de43ec2915354832b2b36e719b84e164&amp;extent=-97.2252,32.9672,-96.7181,33.1355&zoom=true&previewImage=false&scale=false&disable_scroll=true&theme=light',
				external_url: {
					display: true, 
					text: 'Report Pothole', 
					url: 'https://request-lewisvilletx.mycusthelp.com/webapp/_rs/(S(aks2iyjzg5k4wua5qfgjv0vd))/RequestSelect.aspx?sSessionID=198491487OJUBGRIZYBUQNWOFGX[SZTRODDSBLKQ'
				}	
			},
			config10: {
				compid: 'traffic',
				title: 'Travel Conditions'
			},
			config11: {
				id: 'g11-textbox',
				arrowPos: 'left',
				body: `The City has 6 Inspectors who perform building inspections daily Monday through Friday.  The City's goal is to conduct an average of 10 inspections per inspector per day.  If the number of inspections on any single day varies greatly from that goal, it could be due to more complicated inspections being performed that day, an Inspector off of work that day, etc.  However, a trend downward in the number of inspections being performed would indicate an area of review.`
			}
		}
	},

	computed: {
		// store.state
		isLoading() { return this.$store.state.isLoading },
		isRefreshing() { return this.$store.state.softReloading },
		refreshedAt() { return this.$store.state.fromNow },
		underLarge() { return this.$store.state.underLarge },
		// store.getters
		isStats() { return this.$store.getters.isStats },

		// debug only
		categoriesLoading(){ return this.$store.getters.isLoading_categories },
	},

	watch: {
		isLoading:{	// debug only
			immediate: true,
			handler(newVal, oldVal) {
				if(this.debug) console.log('isLoading: ' + oldVal  + ' -> ' + newVal)
			},
		},
		isRefreshing:{	// debug only
			immediate: true,
			handler(newVal, oldVal) {
				if(this.debug) console.log('isRefreshing: ' + oldVal  + ' -> ' + newVal)
			},
		},
		categoriesLoading:{	// debug only
			immediate: true,
			handler(newVal, oldVal) {
				if(this.debug) console.log('categoriesLoading: ' + oldVal  + ' -> ' + newVal)
			},
		},
	},

	mounted() {
		if(this.debug) console.log('Mounted')
		this.init()
	},
	beforeDestroy() {
		if(this.debug) console.log('Destroy')
		$('.tooltipped').tooltip('remove');
	},

	methods: {
		init(){
			if(this.needsInit_materialize) this.initMaterialize()
			this.updateFetchParams()
			this.needsInit = false
		},
		initMaterialize(){
			$('.tooltipped').tooltip({delay: 0, position: 'left'});
			this.needsInit_materialize = false
		},
		updateFetchParams() {
			var payload = { params: this.params }
			if(this.debug) console.log('Update fetch params')
			this.$store.dispatch('updateFetchParams', payload)
		},
		fetchMetrics() {
			if(this.debug) console.log('Fetch metrics')
			this.$store.commit('clearMetrics')
			this.$store.dispatch('fetchPerfMeasures')
		},

		// used for backing up the layout -- ugly / hard to follow
			// added null handling to clear object property (for when metric id no longer exists)
		saveLayout(key, value) {
			try {
				var _config = {}
				if (localStorage.getItem('l3')) _config = JSON.parse(localStorage.getItem('l3'))
				if(value){
					_config[key] = value
				}
				else{
					if(_config.hasOwnProperty(key)) delete _config[key]
				}
				localStorage.setItem('l3', JSON.stringify(_config))
				Materialize.toast('Saved!', 2000)
			} catch(e) {
				console.log(e)
			}
		},
		reset() {
			localStorage.removeItem('l3')
			location.reload()
		}
	}
}
</script>

<style scoped>

/* colors */
.col-purple {
    background-color: #5A348D !important;
}
.col-purple-text {
    color: #5A348D !important;
}

/* navbar */
.nav-wrapper {
	padding-left: .75rem;
	padding-right: .75rem;	
}
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

.grid {
	padding: 8px;
}
.lowmarg {
	margin: 0 0 0.5rem 0;
	padding: 0 8px;
}
.nopad {
	padding: 0;
}

.refresh-text {
	margin-top: 0.5rem;
}
.nudge-right {
	padding-left: 8px;
}

@media only screen and (max-width : 992px) {
	.refresh-text {
		margin-top: 0;
	}
}

/* LOADERS */

.updating {
	display: block;
	margin-left: 38px;
}
#updating-loader {
	position: absolute;
}
.small.spinner {
	width: 30px;
	height: 30px;
	margin: 0;
	display: inline-block;
	margin-right: 8px;
}
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

.slideup-transition {
	transition: transform 5s ease-in-out;
}
.slideup-enter, .slideup-leave {
	transform: translate3d(0, -100px, 0);
}
.fade-enter-active, .fade-leave-active {
  transition: all 0.5s;
}
.fade-enter, .fade-leave-to{
  opacity: 0;
  transform: translate3d(0, 100px,0);
}


/* WIDGETS */

.embed-container {
	position: relative;
	padding-bottom: 80%;
	height: 0;
	max-width: 100%;
}
.embed-container iframe, .embed-container object, .embed-container iframe {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 370px;
}
.maps {
	height: 370px
}
#g0 {
	height: 410px;
}
#g1 {
	height: 410px;
}
#g2 {
	height: 410px;
}
#g8 {
	height: 410px;
}
#g9 {
	height: 410px;
}
#g10 {
	height: 410px;
}

</style>
