<template>
	<div :id="config.compid" class="card" :class="{ donna: $route.name == 'Donna' }">
		<div class="title grey lighten-2 grey-text text-darken-1 left-align" :class="{ smaller: isStats || $route.name == 'Donna' }" v-if="!isLoading">
			{{ metric.realtimeshortname }}
			<i class="material-icons right tooltipped" :data-tooltip="config.why" data-delay="0" v-if="config.why">help</i>
		</div>
		<div class="background white card pointy">
			<div class="loader" v-if="isLoading"></div>
			<ListOfMetricsButton :compid="config.compid + '-metrics-button'" :callback="setMetric" v-else-if="!isLoading && config.editable" />
			<div v-if="!isLoading" @click="gotoMetric()">
				<p class="kpi-value center-align text-darken-3" :class="(!isStats) ? (metric.CurrentColor+'-text' || 'grey-text') : 'grey-text'">
					{{ metric.prevaluetext }}{{ currentValue }}{{ metric.postvaluetext }}
				</p>
			</div>
		</div>
	</div>
</template>

<script>
import ListOfMetricsButton from '../widgets/ListOfMetricsButton'
import Vue from 'vue'
import axios from 'axios'
export default {
	name: 'KPI',
	components: {
		ListOfMetricsButton
	},
	props: ['config','saveSettings'],
	data () {
		return {
			modalTitle: ''
		}
	},

	computed: {
		// copy of store metrics, filtered to Query only
		metrics() {
			return this.$store.state.metrics.filter(metric => {
				return metric.metrictype == 'Query'
			}).sort((a,b) => {
				if (a.realtimeshortname < b.realtimeshortname) return -1
				if (a.realtimeshortname > b.realtimeshortname) return 1
				return 0
			})
		},

		// current metric based on config's psofia record number
		metric() {
			if (!this.metrics) return {metricname: ''}

			var _metric = {}
			for (var i=0; i<this.metrics.length; i++) {
				if (this.config.recordnumber == this.metrics[i].psofia_recordid) {
					return this.metrics[i]
				}
			}
			return _metric
		},

		// grab the value from the metric, formatted correctly as percent or money if necessary
		currentValue() {

			var decPlaces = this.metric.decimalplaces == null ? 2 : this.metric.decimalplaces

			if (this.metric.gaugedataformat == 'PERCENT') return Number((this.metric.CurrentValue).toFixed(decPlaces))+'%'
			else if (this.metric.prevaluetext == '$') return (this.metric.CurrentValue).toFixed(2)
			else return Number(this.metric.CurrentValue.toFixed(decPlaces))
		},

		// loading icon if store hasnt loaded yet (no current metric loaded)
		isLoading() {
			if (!this.metric) return true
			return this.metric.hasOwnProperty('psofia_recordid') ? false : true
		},

		isStats() {
			return this.$store.state.site == 'stats'
		}
	},

	// START
	mounted() {
		this.checkLocalStorage()
	},

	methods: {
		// check local storage if necessary -- ugly
		checkLocalStorage() {
			if (this.saveSettings) {
				try {
					if (localStorage.getItem(this.saveSettings.localStorageKey)) {
						// if settings for this layout are found in localstorage, set the metric
						var _root = JSON.parse(localStorage.getItem(this.saveSettings.localStorageKey))
						if (_root.hasOwnProperty(this.config.compid)) this.config.recordnumber = _root[this.config.compid]
					}
				} catch(e) {
					console.log(e)
				}
			}
		},
		// metric chosen from dropdown
		setMetric(metric) {
			this.config.recordnumber = metric.psofia_recordid

			// use saveSettings callback to set localstorage
			this.saveSettings.callback(this.config.compid, metric.psofia_recordid)
		},

		// clicked metric, go to details page
		gotoMetric(metric) {
			var dept = this.metric.Department.toLowerCase().replace(/ /g, '')
			this.$router.push({ path: '/dashboard/' + ((this.isStats) ? 'stats' : 'public') + '/details/'+dept+'/'+this.metric.psofia_recordid })//, query: { id: id }})
		}
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.pointy {
	cursor: pointer;
}
.donna .background {
	padding: 0 24px;
}
.background {
	height: 100%;
	padding: 16px 24px;
	position: relative;
	margin: 0;
}
.card {
	margin-bottom: 0;
}
.dark .background {
	background-color: rgba(0,0,0,0.1)
}
.dropdown-button {
	position: absolute;
	top: 0;
	right: 8px;
	padding: 0;
}
.dropdown-content {
	overflow-y: scroll !important;
	overflow-x: auto !important;
}
.kpi-title {
	font-size: 20px;
	margin: 0;
	line-height: 24px;
}
.donna .title {
	font-size: 1.2rem;
}
.smaller.title {
	font-size: 1.1rem;
	font-family: 'Product Sans';
	padding: 4px 16px;
	height: 60px;
}
.title {
	font-size: 1.4rem;
	font-family: 'Product Sans';
	padding: 4px 16px;
}
.donna .kpi-value {
	font-size: 3rem;
	line-height: 3.5rem;
}
.kpi-value {
	font-size: 4rem;
	line-height: 5rem;
	margin: 0;
	font-family: 'Product Sans', 'Roboto';
}
.details-btn {
	border: 3px solid rgba(0,0,0,0.6);
	padding: 0 16px;
	border-radius: 100px;
	line-height: 2rem;
}
.loader {
	display: inline-block;
    border: 6px solid #D1C4E9;
    border-top: 6px solid #673AB7;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 2s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
