<template>
	<div :id="getCompID('metriccard')"
		class="card metric-card"
		:class="{ active: isSelected }">
		<div class="left-align card-title valign-wrapper white-text darken-1"
			:class="{ 'grey': isStatic || metricIsStat, [metric.CurrentColor]: true }">
			{{ metric.metricname }}
			<i v-if="isEditing" @click="gotoMetricForm"
				class="material-icons right pointy">
				edit
			</i>
		</div>
		<div class="card-content row">
			<div class="col s12 m5 center-align">
				<div class="col s6 left-align live-indicator valign-wrapper">
					<i class="material-icons left nomargin"
						:class="typeIndicator.class">
						{{ typeIndicator.icon }}
					</i>
					{{ typeIndicator.text }}
				</div>
				<div class="col s6 right-align">
					<div v-if="showVsYesterday"
						class="center-align vs-yesterday">
						<div :class="vsClass">{{ vsYesterday }}</div>
						<div>vs yesterday</div>
					</div>
					<div v-else> <!-- not sure why this is needed, but breaks spacing if not here -->
						&nbsp;
					</div>
				</div>
				<MetricCardValue
					:metric="metric" :config="childConfig" />
				<HistoryButton v-if="isQuery"
					:metric="metric" :config="childConfig" />
				<DetailsButton v-if="isQuery"
					:metric="metric" :config="childConfig" />
				<br>
				<a v-if="metric.url"
					:href="metric.url" target="_blank"
					class="btn btn-flat in-depth-btn white grey-text text-darken-2 waves-effect waves-dark">
					{{ metric.urllabel || 'in-depth' }}
				</a>
			</div>
			<div class="col s12 m7">
				<div class="row">
					<div v-if="metric.Department">
						<div class="col s12 left-align card-header grey-text">Department:</div>
						<div class="col s12 left-align card-text grey-text text-darken-2">{{ metric.Department }}</div>
					</div>

					<div v-if="metric.metricdescription">
						<div class="col s12 left-align card-header grey-text">Description:</div>
						<div class="col s12 left-align card-text grey-text text-darken-2">{{ metric.metricdescription }}</div>
					</div>

					<div v-if="metric.metricgoal && !metricIsStat">		<!--locationParam != 'stats'-->
						<div class="col s12 left-align card-header grey-text">Goal:</div>
						<div class="col s12 left-align card-text grey-text text-darken-2">{{ metric.metricgoal }}</div>
					</div>

					<div v-if="metric.timeperiod">
						<div class="col s12 left-align card-header grey-text">Period Measured:</div>
						<div class="col s12 left-align card-text grey-text text-darken-2">{{ metric.timeperiod }}</div>
					</div>

					<div v-if="metric.realtimedsdescription">
						<div class="col s12 left-align card-header grey-text">Data Source:</div>
						<div class="col s12 left-align card-text grey-text text-darken-2">{{ metric.realtimedsdescription }}</div>
					</div>

					<div>
						<div class="col s12 left-align card-header grey-text">Last Updated:</div>
						<div v-if="isStatic"
							class="col s12 left-align card-text grey-text text-darken-2">
							<div>{{ relativeTime(metricEditDate) }}</div>
							<div>{{ metricEditDate }}</div>
						</div>
						<div v-if="isQuery"
							class="col s12 left-align card-text grey-text text-darken-2">
							<div>{{ relativeTime(metric.lastrefreshed) }}</div>
							<div>{{ prettyTime(metric.lastrefreshed) }}</div>
						</div>
						<div v-if="!isStatic && !isQuery"
							class="col s12 left-align card-text grey-text text-darken-2">
							<div>{{ relativeTime(metricEditDate) }}</div>
							<div>{{ metricEditDate }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'
import Moment from 'moment'
import MetricCardValue from '../widgets/MetricCardValue'
import HistoryButton from '../widgets/HistoryButton'
import DetailsButton from '../widgets/DetailsButton'
export default {
	name: 'MetricCard',
	components: { MetricCardValue, HistoryButton, DetailsButton },
	// ONLY USED IN DETAILS COMPONENT - if used in other components, may need to update this component (like metric is stat calc)
	props: {
		config: {	// timestamp, editing
			type: Object,
			required: true,
		},
		metric: {
			type: Object,
			required: true,
		},
	},
	data () {
		return {
			debug: true,

			needsInit: true,
			timestamp: null,
			//forceUpdater: null,
		}
	},
	computed: {
		// route
		routeParams() { return this.$route.params },
		locationParam() { return this.routeParams.location },
		statusParam() { return this.routeParams.status },
		idParam() { return this.routeParams.id },

		// state
		storeIsLoading() { return this.$store.state.isLoading },
		storeIsRefreshing() { return this.$store.state.softReloading },
		// getters
		isStats() { return this.$store.getters.isStats },
		primaryKey() { return this.$store.getters.psofiaVars.primaryKey },
		editDateKey() { return this.$store.getters.psofiaVars.editDateKey },
		// getters with payload
		metricType() { return this.$store.getters.metricType(this.metric) },
		metricStatus() { return this.$store.getters.metricStatus(this.metric) },

		modalID() { return 'metriccard-detailsmodal-' + this.metricID },

		onlyMetrics() { return this.locationParam == 'public' || this.locationParam == 'internal' },
		onlyStats() { return this.locationParam == 'stats' },

		showLocation() { return this.isEditing && this.locationParam == 'admin' },

		// config
		isEditing() {	// set either in config or by route
			if(this.config.hasOwnProperty('editing')) return this.config.editing
			else return (this.routeName == 'DetailsEdit' || this.routeName == 'DetailsWithIdEdit')
		},
		configTimestamp() {
			if(this.config.hasOwnProperty('timestamp')) return this.config.timestamp
			else return null
		},
		childConfig() {
			return { timestamp: this.timestamp ? this.timestamp.valueOf() : null, }
		},

		// metric props
		metricID() { return this.metric[this.primaryKey] },
		metricEditDate() { return this.metric[this.editDateKey] },
		metricIsStat() {
			if(this.onlyStats) return true
			else if(this.onlyMetrics) return false
			else return this.$store.getters.checkIfStat(this.metric)
		},
		isQuery() {
			if(this.metricType) return (this.metricType.toLowerCase() == 'query')
			else return false
		},
		isStatic() {
			if(this.metricType) return (this.metricType.toLowerCase() == 'static')
			else return false
		},
		typeIndicator() {
			if(this.isQuery) return { class: 'green-text', icon: 'check', text: 'LIVE' }
			if(this.isStatic) return { class: 'red-text', icon: 'remove', text: 'STATIC' }
			return { class: 'orange-text', icon: 'warning', text: this.metricType ? this.metricType.toUpperCase() : 'UNKNOWN' }
		},
		showVsYesterday(){ return (this.metric.vsYesterday !== null && this.metric.vsYesterday !== undefined) },
		vsYesterday() {
			if (this.metric.vsYesterday === undefined || this.metric.vsYesterday === null) return '--'
			return (this.metric.vsYesterday >= 0 ? '+' : '') + Number(this.metric.vsYesterday.toFixed(3))
		},
		vsClass() {
			var upGood = this.metric.realtimetrendarrowcolorup == 'green' ? true : false
			return this.metric.vsYesterday > 0 ? upGood ? 'green-text' : 'red-text' : this.metric.vsYesterday < 0 ? upGood ? 'red-text' : 'green-text' : 'black-text'
		},
		/*statusText() {
			if(!this.metricStatus) return '?'
			if(this.metricStatus.toLowerCase() == 'deployed') return 'Public'
			if(this.metricStatus.toLowerCase() == 'review') return 'Review'
			if(this.metricStatus.toLowerCase() == 'development') return 'Development'
			return '? - ' + this.metricStatus
		},*/
		isSelected() {
			return (this.idParam && this.metricID === this.idParam)
		},
	},
	watch: {
		configTimestamp:{
			immediate: true,
			handler(newVal, oldVal) {
				if(this.debug) console.log('configTimestamp changed')
				if(newVal) this.timestamp = Moment(newVal, "x")
				else this.timestamp = Moment()
			},
		},

		//debug
		timestamp:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('timestamp changed - ' + newVal)
			},
		},
	},
	mounted() {
		if(this.debug) console.log('mounted')
		this.init()
	},
	beforeDestroy() {
		if(this.debug) console.log('destroy')
		clearInterval(this.forceUpdater)
		//this.forceUpdater = null
		$('#' + this.modalID).modal('destroy')
	},

	methods: {
		init() {
			$('#' + this.modalID).modal()
			//this.forceUpdater = setInterval(this.$forceUpdate, 10000)
			this.needsInit = false
		},
		getCompID(comp){
			return comp + '-' + this.metricID;
		},

		gotoMetricForm() {
			var metricLinks = this.$store.getters.metricLinks(this.metric)
			window.open(metricLinks.formURL, '_blank');
		},

		relativeTime(datetime) {
			return Moment.utc(datetime).fromNow()
		},
		prettyTime(datetime) {
			return Moment.utc(datetime).format('YYYY-MM-DD HH:MM:SS')
		},

		// never called - ? (Cards aren't same height - maybe didn't work)
		/*normalizeCards() {
			return
			var maxHeight = 0
			$('#metric-list .card').each(function() {
				if ($(this).height() > maxHeight) {
					maxHeight = $(this).height()
				}
			}).height(maxHeight)
		},*/
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.pointy {
	cursor: pointer;
}
.live-indicator {
	font-size: 0.85rem;
}
.live-indicator i {
	margin: 0 4px 0 0;
	font-weight: bold;
	font-size: 1.25rem
}
.vs-yesterday {
	display: inline-block;
}
.vs-yesterday > div:first-child {
	font-size: 1.25rem;
	line-height: 1;
}
.vs-yesterday > div:nth-child(2) {
	color: grey;
}
.card-title {
	font-size: 16px;
	padding: 8px 16px;
	display: block;
}
.card-content .col {
	padding: 0
}
.card-content > .col:first-child {
	padding: 0 40px 0 16px;
}
.card-header {
	font-weight: 600;
	border-bottom: 1px solid rgba(0,0,0,0.2);
}
.card-text {
	margin-bottom: 8px;
}
.metric-card.active {
	box-shadow: 0 0 0px 10px black;
}
.in-depth-btn {
	border: 3px solid rgba(0,0,0,0.6);
	padding: 8px 8px;
	border-radius: 1rem;
	line-height: 2rem;
	margin-bottom: 8px;
	overflow: hidden;
	line-height: 1.2rem;
	height: auto;
	display: inline-block;
}
.in-depth-btn i {
	margin: 0 8px 0 -4px;
}
</style>
