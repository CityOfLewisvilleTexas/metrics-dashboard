<template>
	<div id="container">
		<div class="navbar-fixed">
            <nav>
				<div id="top-nav" class="nav-wrapper col-purple left-align">
				    <div class="logo"></div>
				    <div class="brand-logo white-text text-darken-3">City of Lewisville - <small>"Admin"</small></div>
				    <ul class="right">
				    	<li v-if="!underLarge">
				    		<SearchMetricsBar :config="navsearchconfig" />
				    	</li>
				    	<li>
				    		<a @click="reset" data-position="left" data-delay="100" data-tooltip="Reset page to defaults" class="tooltipped">
				    			<i class="material-icons">clear_all</i>
				    		</a>
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
		<div class="spinner" v-if="isLoading">
			<div class="double-bounce1"></div>
			<div class="double-bounce2"></div>
		</div>
		<transition appear name="fade">
			<main v-if="!isLoading">
				<div class="row">
					<div class="col s12">
						<SearchMetricsBar :config="searchconfig" v-if="underLarge" />
					</div>
					<div class="col s12 l8 xl4 refresh-text left-align valign-wrapper">
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
					<div class="s12">
					</div>
				</div>
				<div class="row">
					<div class="col s12 xl2 grid left-align" id="g0">
						<GoalsPie :config="config0" />
					</div>
					<div class="col s12 xl10 grid left-align" id="g1">
						<MetricsByDeptBarChart :config="config1" />
					</div>
				</div>
				<div class="row">
					<div class="col s12 grid" id="g2">
						<ListOfMetrics :config="config2" />
					</div>
				</div>
			</main>
		</transition>
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
			debug: true,
			params: {
				status: '',
				type: '',
				master: 'all'
			},

			id: 'l3',
			saveSettings: {
				callback: this.saveLayout,
				localStorageKey: 'l3'
			},
			searchconfig:{ compid: 'small-search', nav: false, editing: false, admin: true },
			navsearchconfig:{ compid: 'nav-search', nav: true, editing: false, admin: true },
			config0: {
				compid: 'g0-pie',
				noBackground: false,
				// dept: 'Public Services'
			},
			config1:{
				compid: 'g1-bar',
			},
			config2: {
				compid: 'g2-list',
				admin: true,
				editable: true
			}
		}
	},

	computed: {
		isLoading() { return this.$store.state.isLoading },
		isRefreshing() { return this.$store.state.softReloading },
		refreshedAt() { return this.$store.state.fromNow },
		underLarge() { return this.$store.state.underLarge },
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


.fade-enter-active, .fade-leave-active {
  transition: all 0.5s;
}
.fade-enter, .fade-leave-to{
  opacity: 0;
  transform: translate3d(0, 100px,0);
}


nav i.material-icons.active {
	animation: spin 2s linear infinite;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
