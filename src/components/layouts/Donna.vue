<template>
	<div id="container">
		<div class="navbar-fixed">
            <nav>
				<div id="top-nav" class="nav-wrapper col-purple left-align">
				    <div class="logo"></div>
				    <div class="brand-logo white-text text-darken-3">City of Lewisville</div>
				    <ul class="right">
				    	<li v-if="!underLarge">
				    		<SearchMetricsBar :config="navsearchconfig" />
				    	</li>
				    	<li>
				    		<a @click="fetchMetrics" data-position="left" data-delay="0" data-tooltip="Refresh" class="tooltipped">
				    			<i class="material-icons" :class="{ active : $store.state.softReloading }">refresh</i>
				    		</a>
				    	</li>
				    </ul>
				</div>
			</nav>
		</div>
		<div class="spinner" v-if="isLoading">
			<div class="double-bounce1"></div>
			<div class="double-bounce2"></div>
		</div>
		<transition appear name="fade">
			<main v-if="!isLoading">
				<div class="row" shortcut>
					<div class="col s12 l8 xl4 refresh-text left-align valign-wrapper">
						<SearchMetricsBar :config="searchconfig" v-if="underLarge" />
						<div id="updating-loader" class="small spinner" v-if="isRefreshing">
							<div class="double-bounce1"></div>
							<div class="double-bounce2"></div>
						</div>
						<div class="updating" :class="{ 'nudge-right': underLarge }" v-if="isRefreshing || isLoading">
							Updating...
						</div>
						<div :class="{ 'nudge-right': underLarge }" v-else>
							Updated {{ refreshedAt }}.
						</div>
					</div>
				</div>
				<div class="row" shortcut>
					<div class="col s12 m6 l2 grid" id="g3">
						<KPI :config="config3" :saveSettings="saveSettings" />
					</div>
					<div class="col s12 m6 l2 grid" id="g4">
						<KPI :config="config4" :saveSettings="saveSettings" />
					</div>
					<div class="col s12 m6 l2 grid" id="g5">
						<KPI :config="config5" :saveSettings="saveSettings" />
					</div>
					<div class="col s12 m6 l2 grid" id="g6">
						<KPI :config="config6" :saveSettings="saveSettings" />
					</div>
					<div class="col s12 m6 l2 grid" id="g12">
						<KPI :config="config12" :saveSettings="saveSettings" />
					</div>
					<div class="col s12 m6 l2 grid" id="g13">
						<KPI :config="config13" :saveSettings="saveSettings" />
					</div>
				</div>
				<div class="row" shortcut>
					<div class="col s12 l6 xl4">
						<div class="col s12 grid" id="g0">
							<GoalsPie2 :config="config0" />
						</div>
						<!-- <div class="col s12 grid" id="">
							<iframe style="margin: 8px 0" width="100%" height="700" src="http://lewisville.maps.arcgis.com/apps/opsdashboard/index.html#/89bea89f39ef44eba2cb6fb3c641783b" />
						</div> -->
					</div>
					<div class="col s12 l6 xl8 grid" id="g7">
						<ListOfMetrics :config="config7" :saveSettings="saveSettings" />
					</div>
				</div>
			</main>
		</transition>
	</div>
</template>

<script>
import Moment from 'moment'
import GoalsPie2 from '../widgets/GoalsPie2'
import ListOfMetrics from '../widgets/ListOfMetrics'
import KPI from '../widgets/KPI'
import SearchMetricsBar from '../widgets/SearchMetricsBar'
export default {
	name: 'Donna',
	components: {
		GoalsPie2, ListOfMetrics, KPI, SearchMetricsBar
	},
	props: [],
	data () {
		return {
			debug: true,
			params: {
				sitename: 'metricPublic',
				status: 'deployed',
				type: '',
				master: ''
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
				recordid1: '87DFF30F66B5419C96B4D760DD0E2952',
				recordid2: '30C81A8705FF48CDAA0AE5FB558041D1',
				min: 0,
				anim: 1000
				// why: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
			},
			config2: {
				compid: 'g2-graph',
				title: null,
				recordid: '31B30EEF5DF9476CBD0D01394E884A08',
				goal: 14,
				editable: false,
				min: 5,
				max: 20,
				anim: 1000
			},
			config3: {
				compid: 'g3-kpi',
				recordnumber: '9B640C1A39444E71B067B716F47E2F84',		// code - unsightly material
				//recordnumber: '653A370A915C4EDA8FC2AA46E8957DCE',		// clarson 8/20 code - grass & weeds, metric is not deployed or public
				editable: true
			},
			config4: {
				compid: 'g4-kpi',
				recordnumber: 'ACE5BF5D40234EEDB70E02435802D231',
				editable: true
			},
			config5: {
				compid: 'g5-kpi',
				recordnumber: '87DFF30F66B5419C96B4D760DD0E2952',
				editable: true
			},
			config6: {
				compid: 'g6-kpi',
				recordnumber: '30C81A8705FF48CDAA0AE5FB558041D1',
				editable: true
			},
			config12: {
				compid: 'g12-kpi',
				recordnumber: '1FFCBA0879E54C33ADD83FC736E68A73',
				editable: true
			},
			config13: {
				compid: 'g13-kpi',
				recordnumber: '1FFCBA0879E54C33ADD83FC736E68A73',
				editable: true
			},
			config7: {
				compid: 'g7-list',
				editable: false,
				pageSize: 8,
				sorter: {
					by: 'CurrentColor',
					order: 'desc'
				}
			},
			config8: {
				compid: 'g8-bar',
				anim: true
			},
			config9: {
				compid: 'potholes',
				height: '100%',
				title: 'Pothole Work Orders',
				url: '//lewisville.maps.arcgis.com/apps/Embed/index.html?webmap=de43ec2915354832b2b36e719b84e164&amp;extent=-97.2252,32.9672,-96.7181,33.1355&zoom=true&previewImage=false&scale=false&disable_scroll=true&theme=light'
			},
			config10: {
				compid: 'traffic',
				title: 'Travel Conditions'
			},
			config11: {
				id: 'g11-textbox',
				arrowPos: 'left',
				body: `The City has 6 Inspectors who perform building inspections daily Monday through Friday.  The City's goal is to conduct an average of 14 inspections per inspector per day.  If the number of inspections on any single day varies greatly from that goal, it could be due to more complicated inspections being performed that day, an Inspector off of work that day, etc.  However, a trend downward in the number of inspections being performed would indicate an area of review.`
			}
		}
	},

	computed: {
		isLoading() { return this.$store.state.isLoading },
		isRefreshing() { return this.$store.state.softReloading },
		refreshedAt() { return this.$store.state.fromNow },
		underLarge() { return this.$store.state.underLarge },
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
		this.updateFetchParams()
	},
	beforeDestroy() {
		if(this.debug) console.log('Destroy')
	},

	methods: {
		updateFetchParams() {
			var payload = { params: this.params }
			if(this.debug) console.log('Update fetch params')
			this.$store.dispatch('updateFetchParams', payload)
		},
		// uses store to fetch metrics
		fetchMetrics() {
			if(this.debug) console.log('Fetch metrics')
			this.$store.commit('clearMetrics')
			this.$store.dispatch('fetchPerfMeasures')
		},

		// used for backing up the layout -- ugly / hard to follow
		saveLayout(key, value) {
			try {
				var _config = {}
				if (localStorage.getItem('l3')) _config = JSON.parse(localStorage.getItem('l3'))
				_config[key] = value
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
.refresh-text {
	margin-top: 8px;
}
.grid {
	padding: 6px;
}
.row {
	margin: 0;
	padding: 0 8px;
}
.nopad {
	padding: 0;
}
.col-purple {
    background-color: #5A348D !important;
}
.logo {
	width: 36px;
    display: inline-block;
    height: 34px;
    vertical-align: middle;
    background-image: url(../../../static/pmartin.svg);
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    opacity: 1;
    margin: 0 16px;
}
nav i.material-icons.active {
	animation: spin 2s linear infinite;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.updating {
	display: block;
	margin-left: 38px;
}

.nudge-right {
	margin-left: 8px;
}

.small.spinner {
	width: 30px;
	height: 30px;
	margin: 0;
	display: inline-block;
	margin-right: 8px;
}

#updating-loader {
	position: absolute;
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
small {
	position: absolute;
	z-index: 40;
	bottom: 0;
	margin-bottom: -15px;
}
.maps {
	height: 370px
}
#g0 {
	height: 300px;
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
