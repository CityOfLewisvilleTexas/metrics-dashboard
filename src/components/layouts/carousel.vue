<template>
	<div>
		<div class="spinner" v-if="isLoading || isRefreshing">
			<div class="double-bounce1"></div>
			<div class="double-bounce2"></div>
		</div>
		<transition appear name="fade">
			<main v-if="!isLoading && !isRefreshing">
				<div class="row">
					<div class="col s12">
						<ListOfMetrics :config="config7"/>
					</div>
				</div>
			</main>
		</transition>
	</div>
</template>

<script>
import ListOfMetrics from '../widgets/ListOfMetrics'

export default {
	name: 'Carousel',
	components: {
		ListOfMetrics
	},
	props: [],
	data () {
		return {
			config7: {
				compid: 'g7-list',
				editable: false
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
		refreshedAt() {
			return this.$store.state.fromNow
		},
		underLarge() {
			return this.$store.state.underLarge
		}
	},
	watch: {
	},
	// START HERE
	mounted() {
		//this.$store.commit('setSite', 'metrics')
		if(this.$store.state.metrics.length == 0) this.fetchMetrics()
	},
	// called as component is removed
	beforeDestroy() {
	},
	methods: {
		// for refreshing
		fetchMetrics() {
			console.log('carousel fetch')
			// specifies which metrics to fetch
			var _params = {
				sitename: 'landingPage',
				status: 'deployed',
				type: '',
				master: ''
			}
			// call fetch on Store
			this.$store.dispatch('fetchMetrics', _params)
		},
		reset() {
			localStorage.removeItem('l3')
			location.reload()
		}
	}
}
</script>

<!-- anything here only applies to this component (because of "scoped") -->
<style scoped>

.row {
	margin-bottom: 0 !important;
}
.row .col {
	padding: 0 0 0 0 !important;
}
.card {
	margin: 0 0 0 0 !important;
}
#g7-list table td, #g7-list table th {
	padding: 5px 5px !important;
}

.refresh-text {
	margin-top: 16px !important;
}
.grid {
	padding: 12px;
}
.nomarg {
	margin: 0;
	padding: 0 8px;
}
.nopad {
	padding: 0;
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