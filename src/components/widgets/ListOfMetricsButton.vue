<template>
	<div :id="compid + '-container'" class="outer">
		<a :id="compid" :data-activates="compid + '-content'" :disabled="storeIsLoading"
			class="dropdown-button btn-flat grey-text waves-effect waves-light">
			<i class="material-icons right">mode_edit</i>
		</a>

		<ul :id="compid + '-content'" class="dropdown-content">
			<li v-for="metric in sortedMetrics">
				<a @click="callback(metric)">{{ metric.realtimeshortname }}</a>
				<div class="divider"></div>
			</li>
		</ul>
	</div>
</template>

<script>
import Vue from 'vue'
export default {
	name: 'ListOfMetricsButton',			// USED IN KPI.vue (if editable) -> Donna.vue
	props: {
		// compid
		config: {
			type: Object,
			required: false,
			default: null,
		},
		// return selected department to callback
		callback:{
			type: Function,
			required: true,
		}
	},
	data () {
		return {
			debug: true,
			needsInit: true,

			isOpen: false,		// not possible in Materialize v0.100.2
		}
	},

	computed: {
			// store.state
			storeIsLoading() { return this.$store.state.isLoading },
			storeIsRefreshing() { return this.$store.state.softReloading },

		compid(){
			if(this.config && this.config.hasOwnProperty('compid') && this.config.compid) return this.config.compid
			else return 'listmetdropdown'
		},

		queryMetrics() { return this.$store.getters.metricsByPayload({ type: 'query', status: 'deployed' }) },
		sortedMetrics() {
			return this.queryMetrics.sort((a,b) => {
				if (a.realtimeshortname < b.realtimeshortname) return -1
				if (a.realtimeshortname > b.realtimeshortname) return 1
				return 0
			})
		},
		countMetrics(){ return this.queryMetrics.length },
	},

	watch: {
		// dropdown only needs to init/update on department length change
		countMetrics:{
			immediate: true,
			handler(newVal, oldVal) {
				if( newVal > 0){
					// on initial load initialize the dropdown
					if(this.needsInit) Vue.nextTick(this.initDropdown)
					// on future length changes, resize the dropdown (if open? - can't check bc don't have access to instance? var instance = M.Dropdown.getInstance(elem);)
					else if(newVal != oldVal) Vue.nextTick(this.updateDropdown)
				}
			},
		},
	},

	mounted() {
		if(this.debug) console.log('Mounted')
	},
	beforeDestroy() {
		if(this.debug) console.log('Destroy')
// DNE?
		$('#' + this.compid).dropdown('destroy')
	},

	methods: {
		initDropdown(){
			if(this.debug) console.log('initDropdown')
// OPTIONS DNE?
			$('#' + this.compid).dropdown({ constrainWidth: false, closeOnClick: true, onOpenStart: this.setOpen, onCloseStart: this.setClose })
			this.needsInit = false;
		},
		updateDropdown(){
			if(this.debug) console.log('updateDropdown')
// DNE?
			$('#' + this.compid).dropdown('recalculateDimensions')
		},

		setOpen() {
			if(this.debug) console.log('setOpen')
			this.isOpen = true
		},
		setClose() {
			this.isOpen = false
			if(this.debug) console.log('setOpen')
		},

		// activate dropdown menu
		/*openDropdown() {
			$('#'+this.compid + '-dropdown-button').dropdown({ constrainWidth: false })
			Vue.nextTick(() => {
				$('#' + this.compid + '-dropdown-button').dropdown('open')
			})
		},*/
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.dropdown-button {
	position: absolute;
	top: 0;
	right: 8px;
	padding: 0;
}
.dropdown-content {
	overflow-y: scroll !important;
	overflow-x: auto !important;
	width: auto !important;
}
</style>
