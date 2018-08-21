<template>
	<div id="container">
		<div class="navbar-fixed">
            <nav>
				<div id="top-nav" class="nav-wrapper deep-purple darken-2 left-align">
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
				    			<i class="material-icons" :class="{ active : $store.state.isLoading }">refresh</i>
				    		</a>
				    	</li>
				    </ul>
				</div>
			</nav>
		</div>
		<div class="row">
			<div class="col s12 l8 xl4">
				<SearchMetricsBar />
				<div class="col s12 left-align" v-if="softReloading">
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
import FixedNavBar from '../widgets/FixedNavBar'
import HistoryGraph from '../widgets/HistoryGraph'
import ListOfMetrics from '../widgets/ListOfMetrics'
import KPI from '../widgets/KPI'
import SearchMetricsBar from '../widgets/SearchMetricsBar'
import MetricCard from '../widgets/MetricCard'
export default {
	name: 'Admin',
	components: {
		GoalsPie, MetricsByDeptBarChart, FixedNavBar, HistoryGraph, ListOfMetrics, KPI, SearchMetricsBar, MetricCard
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
			refreshedAt: ''
		}
	},

	computed: {
		isLoading() {
			return this.$store.state.metrics.length == 0
		},
		softReloading() {
			return this.$store.state.softReloading
		}
	},

	watch: {
		'$store.state.metrics'() {
			this.updateRefreshedAt()
		}
	},

	mounted() {
		if(this.$store.state.metrics.length == 0) this.fetchMetrics()
		setInterval(() => {
			this.updateRefreshedAt()
		}, 5000)
	},

	methods: {

		// fetch all working metrics
		fetchMetrics() {
			this.$store.commit('clearMetrics')
			// specifies which metrics to fetch
			var _params = {
				public: 0,
				internal: 0,
				stat: 0,
				status: '',
				type: '',
				master: 'all'
			}

			// call fetch on Store
			this.$store.dispatch('fetchMetrics', _params)
		},

		updateRefreshedAt() {
			if (this.$store.state.lastRefreshed) this.refreshedAt = Moment(this.$store.state.lastRefreshed).fromNow()
			else this.refreshedAt = ''
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
		test() {
			console.log(this.$store.state)
		}
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
