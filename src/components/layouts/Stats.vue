<template>
	<div id="container">
		<div class="navbar-fixed">
            <nav>
				<div id="top-nav" class="nav-wrapper col-purple left-align">
				    <div class="logo"></div>
				    <div class="brand-logo white-text text-darken-3">City of Lewisville</div>
				    <ul class="right">
				    	<li v-if="!underLarge">
				    		<SearchMetricsBar :nav="true" :compid="'nav-search'" />
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
						<SearchMetricsBar :compid="'small-search'" v-if="underLarge" />
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
				<div class="row">
					<div class="col s12 left-align">
						<DepartmentsDropdown />
					</div>
				</div>
				<div class="row">
					<div class="col s12 nopad">
						<div class="col s12 m6 xl2 grid" id="g1">
							<KPI :config="config1" :saveSettings="saveSettings" />
						</div>
						<div class="col s12 m6 xl2 grid" id="g2">
							<KPI :config="config2" :saveSettings="saveSettings" />
						</div>
						<div class="col s12 m6 xl2 grid" id="g3">
							<KPI :config="config3" :saveSettings="saveSettings" />
						</div>
						<div class="col s12 m6 xl2 grid" id="g4">
							<KPI :config="config4" :saveSettings="saveSettings" />
						</div>
						<div class="col s12 m6 xl2 grid" id="g5">
							<KPI :config="config5" :saveSettings="saveSettings" />
						</div>
						<div class="col s12 m6 xl2 grid" id="g7">
							<KPI :config="config7" :saveSettings="saveSettings" />
						</div>
					</div>
				</div>
				<div class="row" shortcut>
					<!-- <div class="col s12 l6 xl4 nopad">
					</div> -->
					<div class="col s12 l12 xl10 offset-xl1 grid" id="g6">
						<ListOfMetrics :config="config6" :saveSettings="saveSettings" />
					</div>
				</div>
			</main>
		</transition>
	</div>
</template>

<script>
import Moment from 'moment'
import GoalsPie from '../widgets/GoalsPie'
import GoalsPie2 from '../widgets/GoalsPie2'
import MetricsByDeptBarChart from '../widgets/MetricsByDeptBarChart'
import FixedNavBar from '../widgets/FixedNavBar'
import HistoryGraph from '../widgets/HistoryGraph'
import HistoryGraph2 from '../widgets/HistoryGraph2'
import DualHistoryGraph from '../widgets/DualHistoryGraph'
import DualHistoryGraph2 from '../widgets/DualHistoryGraph2'
import ListOfMetrics from '../widgets/ListOfMetrics'
import KPI from '../widgets/KPI'
import SearchMetricsBar from '../widgets/SearchMetricsBar'
import MetricCard from '../widgets/MetricCard'
import ESRIMap from '../widgets/ESRIMap'
import GoogleMap from '../widgets/GoogleMap'
import TextBox from '../widgets/TextBox'
import DepartmentsDropdown from '../widgets/DepartmentsDropdown'
export default {
	name: 'Stats',
	components: {
		GoalsPie, GoalsPie2, MetricsByDeptBarChart, FixedNavBar, HistoryGraph, HistoryGraph2, DualHistoryGraph, DualHistoryGraph2, ListOfMetrics, KPI, SearchMetricsBar, MetricCard, ESRIMap, GoogleMap, TextBox, DepartmentsDropdown
	},
	props: [],
	data () {
		return {
			id: 'l3',
			searchTerm: '',
			underLarge: false,
			saveSettings: {
				callback: this.saveLayout,
				localStorageKey: 'l3'
			},
			config1: {
				compid: 'g1-kpi',
				recordnumber: '9CDBACA381ED4822A98E701675506CB2',
				editable: false
			},
			config2: {
				compid: 'g2-kpi',
				recordnumber: '842BE094717D4CFCBFD4CB9A78116695',
				editable: false
			},
			config3: {
				compid: 'g3-kpi',
				recordnumber: 'DAFE8B2676B74C90945094102E7D6DB0',
				editable: false
			},
			config4: {
				compid: 'g4-kpi',
				recordnumber: '25AB16AB1D1147E8A3C3BC04B8397F88',
				editable: false
			},
			config5: {
				compid: 'g5-kpi',
				recordnumber: 'D0A1C73515814064BA672E3669FB6791',
				editable: false
			},
			config7: {
				compid: 'g7-kpi',
				recordnumber: '4EE145D723ED4CACA81EA37518BEA519',
				editable: false
			},
			config6: {
				compid: 'g6-list',
				editable: false
			}
		}
	},

	computed: {
		isLoading() {
			return this.$store.state.isLoading
		},
		isRefreshing() {
			return this.$store.state.softReloading
		},
		refreshedAt() {
			return this.$store.state.fromNow
		}
	},

	watch: {
	},

	mounted() {
		this.$store.commit('setSite', 'stats')
		this.setSize()
		$(window).resize(this.setSize)
	},

	beforeDestroy() {
		$(window).off('resize')
	},

	methods: {

		setSize() {
			this.underLarge = ($(window).width() < 1200) ? true : false
		},

		// uses store to fetch metrics
		fetchMetrics() {

			// specifies which metrics to fetch
			var _params = {
				public: 0,
				internal: 0,
				stat: 1,
				status: 'deployed',
				type: '',
				master: ''
			}

			// call fetch on Store
			this.$store.dispatch('fetchMetrics', _params)
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
	margin-top: 16px;
}
.grid {
	padding: 12px;
}
.row:not(:first-child) {
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
#updating-loader {
	position: absolute;
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
</style>
