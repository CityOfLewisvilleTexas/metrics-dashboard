<template>
	<div id="container">
		<div class="navbar-fixed">
            <nav>
				<div id="top-nav" class="nav-wrapper col-purple left-align">
				    <div class="logo"></div>
				    <div class="brand-logo white-text text-darken-3">City of Lewisville - <small>"Admin"</small></div>
				    <ul class="right">
				    	<li>
				    		<a @click="reset" data-position="left" data-delay="100" data-tooltip="Reset page to defaults" class="tooltipped">
				    			<i class="material-icons">clear_all</i>
				    		</a>
				    	</li>
				    	<li>
				    		<a @click="fetchMetrics">
				    			<i class="material-icons" :class="{ active : isRefreshing }">refresh</i>
				    		</a>
				    	</li>
				    </ul>
				</div>
			</nav>
		</div>
		<div class="row">
			<div class="col s12 l8 xl4">
				<SearchMetricsBar />
				<div class="col s12 left-align" v-if="isRefreshing">
					Updating...
				</div>
				<div class="col s12 left-align" v-else>
					Updated {{ refreshedAt }}.
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col s12 xl2 grid left-align" id="g0">
				<GoalsPie :config="config0" />
			</div>
			<div class="col s12 xl10 grid left-align" id="g1">
				<MetricsByDeptBarChart />
			</div>
		</div>
		<div class="row">
			<div class="col s12 grid" id="g7">
				<ListOfMetrics :compid="config7.compid" :admin="true" />
			</div>
		</div>
	</div>
</template>

<script>
import Moment from 'moment'
import GoalsPie from '../widgets/GoalsPie'
import MetricsByDeptBarChart from '../widgets/MetricsByDeptBarChart'
import ListOfMetrics from '../widgets/ListOfMetrics'
import SearchMetricsBar from '../widgets/SearchMetricsBar'
export default {
	name: 'Admin',
	components: {
		GoalsPie, MetricsByDeptBarChart, ListOfMetrics, SearchMetricsBar
	},
	props: [],
	data () {
		return {
			id: 'l3',
			searchTerm: '',
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
				title: 'Avg Response Time to Priority 1 Police Calls',
				uspName: 'PD_ResponseTime_Priority1',
				editable: true
			},
			config2: {
				compid: 'g2-graph',
				title: 'Avg Response Time to Priority 1 Fire Calls',
				uspName: 'FD_Priority1CFS_ReceivedToOnScene',
				editable: true
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
				recordnumber: '06379955A0DB45A58396317593944133'
			},
			config7: {
				compid: 'g7-list'
			},
		}
	},

	computed: {
		isLoading() {
			return this.$store.state.isLoading
		},
		isRefreshing() {
			return this.$store.state.softReloading
		},
		lastRefreshed() {
			return this.$store.state.lastRefreshed
		},
		refreshedAt() {
			return this.$store.state.fromNow
		},
	},

	watch: {
	},

	mounted() {
	},

	methods: {

		// fetch all working metrics
		fetchMetrics() {
			console.log('Admin - fetch metrics')
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
		},
	}
}
</script>

<style scoped>
.grid {
	padding: 8px;
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
</style>
