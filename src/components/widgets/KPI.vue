<template>
	<div :id="compid" class="card" :class="{ 'donna': isDonna }">
		<div v-if="title"
			class="title grey lighten-2 grey-text text-darken-1 left-align" :class="{ smaller: (isStats || isDonna) }">
			{{ title }}
			<i v-if="hasError && isEditable" class="material-icons red darken-1">error</i>
			<i v-if="config.why" :data-tooltip="config.why" data-delay="0"
				class="material-icons right tooltipped">
				help</i>
		</div>

		<div class="background card" :class="{'grey': hasError, 'lighten-4': hasError, 'white': !hasError, 'pointy': !hasError }">
			<div class="loader" v-if="isLoading"></div>

			<ListOfMetricsButton v-if="isEditable && !isLoading"
				:config="{compid: compid + '-listmetdropdown'}" :callback="setMetric" class="edit-button" />
			
			<div v-if="!isLoading && metric" @click="gotoMetric()">
				<p class="kpi-value center-align text-darken-3" :class="metric.CurrentColor + '-text'">
					{{ currentValueText }}
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
	name: 'KPI',					// USED IN Stats.vue, Default.vue, Donna.vue
	components: { ListOfMetricsButton },
	props: {
		// compid, metricID, editable
		config: {
			type: Object,
			required: true,
		},
		saveSettings: {
			type: Object,
			required: false,
			default: null,
		},
	},
	data () {
		return {
			debug: true,

			isLoadingSaved: true,
			savedMetricID: null,
		}
	},

	computed: {
		// route
		routeName() { return this.$route.name },

		// state
		storeIsLoading() { return this.$store.state.isLoading },
		storeIsRefreshing() { return this.$store.state.softReloading },
		// getters
		isStats() { return this.$store.getters.isStats },
		primaryKey() { return this.$store.getters.psofiaVars.primaryKey },
		currentValue() { if(this.metric) return this.$store.getters.metricValue({metric: this.metric}) },

		// loading icon if store hasnt loaded yet (no current metric loaded)
		isLoading() { return (this.isLoadingSaved || this.storeIsLoading) },
		isEditable() { return (this.config.hasOwnProperty('editable') && this.config.editable) },
		
		isAdmin(){ return (this.routeName == 'Admin') },
		isDonna(){ return (this.routeName == 'Donna') },

		compid() {
			if(this.config.hasOwnProperty('compid') && this.config.compid) return this.config.compid
			else if(this.metricID) return 'kpi-' + this.metricID
			else if(this.config.hasOwnProperty('metricID') && this.config.metricID) return 'kpi-' + this.config.metricID
			else return 'kpi'
		},

		// found from metricID in local storage
		savedMetric() {
			if(this.savedMetricID) return this.$store.getters.findMetricByID({ id: this.savedMetricID } )
			else return null
		},
		// found from metricID in config
		configMetric() {
			if(this.config.hasOwnProperty('metricID') && this.config.metricID) return this.$store.getters.findMetricByID({ id: this.config.metricID } )
			else return null
		},

		metric() {
			if(!this.isLoading){
				// use metric from local storage if editing and available
				if(this.isEditable && this.savedMetricID && this.savedMetric) return this.savedMetric
				// use metric from config (will be null if id not set or unavailable)
				else return this.configMetric
			}
		},
		metricID() {
			if(this.metric) return metric[this.primaryKey]
			else return null
		},

		title() {
			var title = ''
			if(!this.isLoading){
				if(this.metric) title = this.metric.realtimeshortname
				else if(this.hasError && this.errorCode > 1) title = 'Metric Unavailable'
				else if(this.isEditable) title = 'Metric not set'
			}
			return title
		},
		currentValueText() {
			if(this.currentValue){
				if(this.currentValue.error) return '[[error 1000]]'
				else return this.currentValue.commaStr
			}
		},
		metricLinks(){
			if(this.metric) return this.$store.getters.metricLinks(this.metric)
			else return null
		},

		// show warning if saved metric is unavailable so config metric is used instead
		hasSavedWarning() {
			return (this.isEditable && !this.isLoading && this.metric && this.savedMetricID && !this.savedMetric)
		},
		hasError() {
			return (this.errorCode > 0)
		},

		errorCode() {
			var err = 0
			// both config and local storage are either not set or unavailable
			if(!this.isLoading && !this.metric){
				// config metric id not required (blank kpi for user to set), metric id can be saved in local storage
				if(this.isEditable){
					//  if config has metric id
					if(this.config.hasOwnProperty('metricID') && this.config.metricID){
						// local storage also has metric id => metric from both local storage and config are unavailable
						if(this.savedMetricID) err = 4
						else error = 2		// only metric from config is unavailable
					}
					// if config does not have metric id
					else {
						if(this.savedMetricID) err = 3		// metric from local storage is unavailable
						// else blank kpi for user to set, no error
					}
				}
				else{
					if(this.config.hasOwnProperty('metricID') && this.config.metricID) error = 2		// metric from config is unavailable
					else error = 1			// config missing id
				}
			}
			return err
		},
		error() {
			var err = ''
			if(this.hasError){
				if(this.errorCode == 1) err = 'Config: metric ID not provided'
				else if(this.errorCode == 2) err = 'Config metric not found - ID: ' + this.config.metricID
				else if(this.errorCode == 3) err = 'Saved metric not found - ID: ' + this.savedMetricID
				else if(this.errorCode == 4) err = 'Both config & saved metric not found - Config ID: ' + this.config.metricID + '    Saved ID: ' + this.savedMetricID
			}
			return err;
		},
	},

	watch: {
		// handle component reused
		routeName:{
			immediate: false,
			handler(newVal, oldVal) {
				if(this.debug) console.log('watch: routeName')
				this.init()
			},
		},

		error:{
			immediate: true,
			handler(newVal, oldVal) {
				if(newVal) console.error(this.error)
			},
		},
		hasSavedWarning:{
			immediate: true,
			handler(newVal, oldVal){
				if(newVal) console.warn('Saved metric not found, showing default instead - Saved ID: ' + this.savedMetricID)
			},
		},
	},

	// START
	mounted() {
		if(this.debug) console.log('Mounted')
		this.init()
	},
	beforeDestroy() {
		if(this.debug) console.log('Destroy')
	},

	methods: {
		init(){
			if(this.debug) console.log('init')
			this.isLoadingSaved = true
			this.savedMetricID = null

			if(this.isEditable && this.saveSettings) this.checkLocalStorage()
			else{
				this.savedMetricID = null
				this.isLoadingSaved = false
			}
		},

		gotoMetric() {
			if(this.debug) console.log('gotoMetric')
			if(this.metricLinks.editOnly){
				if(this.isAdmin || this.isDonna) this.gotoMetricEdit()
				else console.warn('EDIT ONLY ROUTE')
			}
			else{
				var params = this.metricLinks.viewParams
				if(this.metricLinks.viewRedirect){
					var fullViewURL = this.metricLinks.viewURL + '/dashboard/' + params.location + '/details/' + params.dept + '/' + params.id
					window.open(fullViewURL, '_blank');
				}
				else this.$router.push({ name: 'DetailsWithId', params: params })
			}
		},
		gotoMetricEdit() { this.$router.push({ name: 'DetailsWithIdEdit', params: this.metricLinks.editParams }) },

		// metric chosen from ListOfMetricsButton
		setMetric(metric) {
			if(this.debug) console.log('setMetric')
			this.savedMetricID = metric[this.primaryKey]
			// use saveSettings callback to set localstorage
			this.saveSettings.callback(this.compid, metric[this.primaryKey])
		},

		// check local storage if necessary -- ugly
		checkLocalStorage() {
			try {
				if(localStorage.getItem(this.saveSettings.localStorageKey)) {
					// if settings for this layout are found in localstorage, set the metric
					var _root = JSON.parse(localStorage.getItem(this.saveSettings.localStorageKey))
					if(_root.hasOwnProperty(this.compid)){
						this.savedMetricID = _root[this.compid]
						this.isLoadingSaved = false
					}
					else{
						this.savedMetricID = null
						this.isLoadingSaved = false
					}
				}
				else{
					this.savedMetricID = null
					this.isLoadingSaved = false
				}
			} catch(e) {
				console.log(e)
				this.savedMetricID = null
				this.isLoadingSaved = false
			}
		},
		clearSavedMetric() {
			this.savedMetricID = null
			// use saveSettings callback to set localstorage
			this.saveSettings.callback(this.compid, null)
		},
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

.edit-button {
	position: absolute;
	top: 0;
	right: 8px;
	padding: 0;
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
