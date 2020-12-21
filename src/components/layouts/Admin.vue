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
						<div class="col s12 xl2 grid left-align" id="g0">
							<GoalsPie2 :config="config0" />
						</div>
						<div class="col s12 xl10 grid left-align" id="g1">
							<MetricsByDeptBarChart :config="config1" />
						</div>
					</div>

					<div class="row lowmarg">
						<div class="col s12 grid" id="g2">
							<ListOfMetrics :config="config2" />
						</div>
					</div>

				</div>
			</transition>

		</main>
	</div>
</template>

<script>
import Moment from 'moment'
import GoalsPie2 from '../widgets/GoalsPie2'
import MetricsByDeptBarChart from '../widgets/MetricsByDeptBarChart'
import ListOfMetrics from '../widgets/ListOfMetrics'
import SearchMetricsBar from '../widgets/SearchMetricsBar'
export default {
	name: 'Admin',
	components: {
		GoalsPie2, MetricsByDeptBarChart, ListOfMetrics, SearchMetricsBar
	},
	props: [],
	data () {
		return {
			debug: true,
			needsInit: true,
			needsInit_materialize: true,
			params: {
				sitename: 'all',
				status: 'deployed',
				type: '',
				master: 'all',
				auth: true,
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
		// store.state
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
		// used for backing up the layout
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
		},
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

.fade-enter-active, .fade-leave-active {
  transition: all 0.5s;
}
.fade-enter, .fade-leave-to{
  opacity: 0;
  transform: translate3d(0, 100px,0);
}


/* WIDGETS */

#g0 {
	height: 410px;
}
#g1 {
	height: 410px;
}
</style>
