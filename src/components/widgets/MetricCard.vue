<template>
	<div class="card metric-card" :id="'metric-card-'+metricID" :class="{ active: metricID == $route.params.id }">
		<div class="left-align card-title valign-wrapper white-text darken-1"
			:class="{ 'grey': metric.metrictype == 'Static' || isStats, [metric.CurrentColor]: true }">
			{{ metric.metricname }}
			<i class="material-icons right pointy" v-if="editing" @click="edit(metric)">edit</i>
		</div>
		<div class="card-content row">
			<div class="col s12 m5 center-align">
				<div class="col s6 left-align live-indicator valign-wrapper">
					<i class="material-icons left nomargin" :class="metric.metrictype == 'Query' ? 'green-text' : 'red-text'">
						{{ metric.metrictype == 'Query' ? 'check' : 'remove' }}
					</i>
					{{ metric.metrictype == 'Query' ? 'LIVE' : 'STATIC' }}
				</div>
				<div class="col s6 right-align">
					<div class="center-align vs-yesterday" v-if="metric.vsYesterday !== null && metric.vsYesterday !== undefined">
						<div :class="vsClass(metric)">{{ vsYesterday(metric.vsYesterday) }}</div>
						<div>vs yesterday</div>
					</div>
					<div v-else> <!-- not sure why this is needing, but breaks spacing if not here -->
						&nbsp;
					</div>
				</div>
				<MetricCardValue :metric="metric" />
				<HistoryButton :metric="metric" v-if="metric.metrictype == 'Query'"/>
				<a 	class="btn btn-flat details-btn white grey-text text-darken-2 waves-effect waves-dark"
					v-if="metric.metrictype == 'Query'"
					@click="openDetailsModal">
					details
				</a><br>
				<a 	class="btn btn-flat in-depth-btn white grey-text text-darken-2 waves-effect waves-dark"
					v-if="metric.url"
					:href="metric.url"
					target="_blank">
					{{ metric.urllabel || 'in-depth' }}
				</a>
			</div>
			<div class="col s12 m7">
				<div class="row">
					<div v-if="">
						<div class="col s12 left-align card-header grey-text">Department:</div>
						<div class="col s12 left-align card-text grey-text text-darken-2">{{ metric.Department }}</div>
					</div>

					<div v-if="metric.metricdescription">
						<div class="col s12 left-align card-header grey-text">Description:</div>
						<div class="col s12 left-align card-text grey-text text-darken-2">{{ metric.metricdescription }}</div>
					</div>

					<div v-if="metric.metricgoal && !isStats">
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
						<div class="col s12 left-align card-text grey-text text-darken-2" v-if="metric.metrictype == 'Static'">
							<div>{{ relativeTime(metricEditDate, metric) }}</div>
							<div>{{ metricEditDate }}</div>
						</div>
						<div v-else class="col s12 left-align card-text grey-text text-darken-2">
							<div>{{ relativeTime(metric.lastrefreshed, metric) }}</div>
							<div>{{ prettyTime(metric.lastrefreshed) }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div :id="'details-modal-'+metricID" class="modal white details-modal">
			<div class="modal-content">
				<p class="flow-text">{{ metric.metricname }}</p>
				<div class="details-table-holder">
					<DetailsTable :metric="metric" />
				</div>
			</div>
			<div class="modal-footer">
				<a class="modal-action modal-close waves-effect waves-dark btn-flat">Done</a>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'
import HistoryButton from '../widgets/HistoryButton'
import DetailsTable from '../widgets/DetailsTable'
import MetricCardValue from '../widgets/MetricCardValue'
import Moment from 'moment'
export default {
	name: 'MetricCard',
	components: {
		HistoryButton, DetailsTable, MetricCardValue
	},
	props:{
		metric:{
			type: Object,
			required: true,
		},
		editing:{
			type: Boolean,
			required: false,
			default: false,
		}
	},
	data () {
		return {
			forceUpdater: null,
			/*config: {
				compid: 'history-graph-' + this.metricID,
				title: '',
				uspName: this.metric.uspname,
				noBorder: true,
				isVisible: false,
				callback: this.setLastRefreshed
			}*/
		}
	},
	computed: {
		isStats() {
			return this.$store.getters.isStats
		},
		primaryKey() {
			return this.$store.getters.primaryKey
		},
		editDateKey() {
			return this.$store.getters.editDateKey
		},
		entryURL(){
			this.$store.getters.entryURL
		},
		metricID(){
			return this.metric[this.primaryKey];
		},
		metricEditDate(){
			this.metric[this.editDateKey];
		},
		formURL() {
			this.entryURL + this.metricID;
		},
	},
	watch: {
	},
	mounted() {
		$('#details-modal-'+this.metricID).modal()
		this.forceUpdater = setInterval(this.$forceUpdate, 10000)
	},
	updated() {
	},
	beforeDestroy() {
		clearInterval(this.forceUpdater)
		this.forceUpdater = null
	},

	methods: {
		openDetailsModal() {
			$('#details-modal-'+this.metricID).modal('open')
		},

		relativeTime(datetime, metric) {
			return Moment(datetime.replace('Z','')).fromNow()
		},

		prettyTime(time) {
			return Moment(time.replace('Z','')).format('YYYY-MM-DD HH:MM:SS')
		},

		vsYesterday(val) {
			if (val === undefined || val === null) return '--'
			return (val >= 0 ? '+' : '') + Number(val.toFixed(3))
		},

		vsClass(metric) {
			var upGood = metric.realtimetrendarrowcolorup == 'green' ? true : false

			return metric.vsYesterday > 0 ? upGood ? 'green-text' : 'red-text' : metric.vsYesterday < 0 ? upGood ? 'red-text' : 'green-text' : 'black-text'
		},

		edit(metric) {
			window.open(this.formURL)
		}


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

		// lastrefreshed and vsyesterday set in sql procedure
		/*setLastRefreshed(history) {
			// Vue.set(this.metric, 'lastrefreshed', history[0].lastimported)
			this.setVsYesterday(history)
		},
		setVsYesterday(history) {
			if (!history[1]) {
				this.vsValue = ''
				return
			}
			this.vsValue = (history[0].value - history[1].value).toFixed(2)
			this.vsValue = (this.vsValue >= 0) ? '+' + String(this.vsValue).replace('-', '') : this.vsValue
			if (this.metric.realtimetrendarrowcolordown == 'green') {
				this.vsClass = (this.vsValue <= 0) ? 'green-text' : 'red-text'
			}
			else {
				this.vsClass = (this.vsValue < 0) ? 'red-text' : 'green-text'
			}
		},*/

		// never called - in MetricCardValue component?
		/*correctValue(value, metric) {

			if (metric.gaugedataformat == 'PERCENT')
				return Number((value*100).toFixed(2))+'%'
			else if (metric.prevaluetext == '$') return (value).toFixed(2)
			else return Number(value.toFixed(2))
		},*/

		// never called - in HistoryButton component?
		/*openHistoryModal() {
			this.config.isVisible = true
			this.config.uspName = this.metric.uspname
			$('#history-modal-'+this.metricID).modal('open')
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
.details-btn, .history-btn, .in-depth-btn {
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
.details-btn i, .history-btn i, .in-depth-btn i {
	margin: 0 8px 0 -4px;
}
.modal {
	/*z-index: 999 !important*/
}
.details-modal {
	/*width: auto;
	min-width: auto;
	max-width: 80%;*/
}
</style>
