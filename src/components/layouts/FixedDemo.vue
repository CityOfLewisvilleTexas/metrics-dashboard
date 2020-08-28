<template>
	<div id="container">
		<div class="navbar-fixed">
            <nav>
				<div id="top-nav" class="nav-wrapper col-purple left-align">
				    <div class="logo"></div>
				    <div class="brand-logo white-text text-darken-3">City of Lewisville</div>
				    <ul class="right">
				    	<li>
				    		<a @click="fetchMetrics" data-position="left" data-delay="0" data-tooltip="Refresh" class="tooltipped">
				    			<i class="material-icons" :class="{ active : isRefreshing }">refresh</i>
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
				<!-- <div class="row">
					<div class="col s12 l8 xl4 refresh-text left-align valign-wrapper">
						<div class="small spinner" v-if="isRefreshing">
							<div class="double-bounce1"></div>
							<div class="double-bounce2"></div>
						</div>
						<div class="updating" v-if="isRefreshing">
							Updating...
						</div>
						<div v-else>
							Updated {{ refreshedAt }}.
						</div>
					</div>
				</div> -->
				<div class="row top-half">
					<div class="col s3 grid left-align" id="g0">
						<GoalsPie2 :config="config0" />
					</div>
					<div class="col s9 grid left-align" id="g1">
						<DualHistoryGraph2 :config="config1" :saveSettings="saveSettings" />
					</div>
				</div>
				<div class="row bottom-half">
					<div class="col s6 grid" id="g2">
						<ESRIMap :config="config10" v-if="!$route.params.nomap"  />
					</div>
					<div class="col s6 grid left-align" id="g3">
						<HistoryGraph2 :config="config2" :saveSettings="saveSettings" />
					</div>
				</div>
			</main>
		</transition>
	</div>
</template>

<script>
import Moment from 'moment'
import GoalsPie2 from '../widgets/GoalsPie2'
import HistoryGraph2 from '../widgets/HistoryGraph2'
import DualHistoryGraph2 from '../widgets/DualHistoryGraph2'
import ESRIMap from '../widgets/ESRIMap'
export default {
	name: 'FixedDemo',
	components: {
		GoalsPie2, HistoryGraph2, DualHistoryGraph2, ESRIMap
	},
	props: [],
	data () {
		return {
			debug: true,
			params: {
				sitename: 'metricPublic',
				status: 'deployed',
				type: '',
				master: '',
			},

			id: 'l3',
			saveSettings: {
				callback: this.saveLayout,
				localStorageKey: 'l3'
			},
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
				min: 99999999,
				anim: 1000,
				why: ''//'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
			},
			config2: {
				compid: 'g2-graph',
				title: null,
				recordid: '9B8AC26729994AA6836092D5A3492DA9',
				editable: false,
				min: 99999,
				anim: 1000
			},
			config3: {
				compid: 'g3-kpi',
				recordnumber: 'E50DE06691B64C91807922E5CA81A1C2'
			},
			config4: {
				compid: 'g4-kpi',
				recordnumber: '67132D86712A4C44BC646FCA805CDABD'
			},
			config5: {
				compid: 'g5-kpi',
				recordnumber: 'C39AFD87551E4254B24D7CA82DA828F3'
			},
			config6: {
				compid: 'g6-kpi',
				recordnumber: 'A80DBD7EFA254B008707A533B78681D1'
			},
			config7: {
				compid: 'g7-list'
			},
			config8: {
				compid: 'g8-bar',
				anim: true
			},
			config9: {
				height: 323,
				title: 'Pothole Work Orders',
				url: '//lewisville.maps.arcgis.com/apps/Embed/index.html?webmap=de43ec2915354832b2b36e719b84e164&amp;extent=-97.2252,32.9672,-96.7181,33.1355&zoom=true&previewImage=false&scale=false&disable_scroll=true&theme=light'
			},
			config10: {
				height: 323,
				title: 'Travel Conditions',
				url: '//lewisville.maps.arcgis.com/apps/Embed/index.html?webmap=c5c4c8df620744d5b284632612c0aa86&amp;extent=-97.2252,32.9672,-96.7181,33.1355&zoom=true&previewImage=false&scale=false&disable_scroll=true&theme=light'
			},
		}
	},

	computed: {
		isLoading() { return this.$store.state.isLoading },
		isRefreshing() { return this.$store.state.softReloading },
		refreshedAt() { return this.$store.state.fromNow },
		underLarge() { return this.$store.state.underLarge },
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

		// used for backing up the layout
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
/*.refresh-text {
	margin-top: 16px;
}
.grid {
	padding: 12px;
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

.updating {
	display: inline-block;
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
}*/
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
.top-half, .bottom-half {
	height: calc(50vh - 32px);
	margin: 0;
}
#g0 {
	height: calc(100% - 24px)
}
#g1 {
	height: calc(100% - 24px)
}
#g2 {
	height: calc(100% - 24px)
}
#g3 {
	height: calc(100% - 24px)
}
</style>
