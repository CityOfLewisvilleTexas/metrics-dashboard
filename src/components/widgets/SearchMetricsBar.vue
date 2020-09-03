<template>
	<div :id="compid" class="input-field card" :class="{ nav : config.nav }">
		<i class="material-icons prefix">search</i>
		<input class="autocomplete" :disabled="storeIsLoading"
			type="text" placeholder="Search metrics..." v-model="searchTerm" />
	</div>
</template>

<script>
import Vue from 'vue'
export default {
	name: 'SearchBar',					// USED IN Details.vue, Stats.vue, Admin.vue, Default.vue, Donna.vue
	components: {},
	props: {
		config: {
			type: Object,
			required: false,
			default: {
				nav: false,
				editing: false,
				admin: false,
			},
		},
	},
	data () {
		return {
			debug: false,
			needsInit: true,
			searchTerm: '',
		}
	},

	computed: {
		routeName(){ return this.$route.name },
		locationParam() { return this.$route.params.location },
		storeIsLoading() { return this.$store.state.isLoading },
		storeIsRefreshing() { return this.$store.state.softReloading },

		routeLocations() { return this.$store.getters.routeLocations },
		routeStatuses() { return this.$store.getters.routeStatuses },
		routeDepts() { return this.$store.getters.routeDepts },

		compid(){
			if(this.config && this.config.hasOwnProperty('compid')) return this.config.compid
			else if(this.config.nav) return 'nav-search'
			else return 'small-search'
		},
		// set either in config or by route
		isAdmin(){
			if(this.config.hasOwnProperty('admin')) return this.config.admin
			else return (this.routeName == 'Admin' || this.locationParam == 'admin')
		},
		// set either in config or by route
		isEditing(){
			if(this.config.hasOwnProperty('editing')) return this.config.editing
			else return (this.routeName == 'DetailsEdit' || this.routeName == 'DetailsWithIdEdit')
		},

		// metrics length will be 0 on initial load, and during each refresh (after commit clearMetrics)
		metrics() {
			if(!this.storeIsLoading){
				// make a copy and sort by name (short)
				var copy = JSON.parse(JSON.stringify(this.$store.state.metrics))
				return copy.sort((a,b) => {
					if (a.realtimeshortname < b.realtimeshortname) return -1
					if (a.realtimeshortname > b.realtimeshortname) return 1
					return 0
				})
			}
			else return []
		},

		metricsObj() {
			// convert list of metrics into an object (for Materialize autocomplete)
			var objectified = {}
			this.metrics.forEach(metric => {
				objectified[metric.realtimeshortname] = null
			})
			return objectified
		},
	},

	watch: {
		// autocomplete needs to update on metrics change
		metrics:{
			immediate: true,
			handler(newVal, oldVal) {
				if(this.debug){
					console.log(newVal)
					if(!oldVal) console.log('oldVal: initial load')
					else{
						console.log('copied metrics: equal: ' + (oldVal == newVal) + ', length: ' + oldVal.length  + ' -> ' + newVal.length)
						console.log(oldVal)
					}
				}
				if( newVal.length > 0 ){
					// on initial load initialize the autocomplete
					if(this.needsInit) Vue.nextTick(this.initAutocomplete)
					// on future changes, update the autocomplete
					else Vue.nextTick(this.updateAutocomplete)
				}
			},
			deep: true
		},
	},
	mounted() {
		if(this.debug) console.log('Mounted')
	},
	beforeDestroy() {
		if(this.debug) console.log('Destroy')
		$('#' + this.compid + ' input.autocomplete').autocomplete('destroy')
	},
	methods: {
		initAutocomplete() {
			if(this.debug) console.log('initAutocomplete')
			$('#' + this.compid + ' input.autocomplete').autocomplete({
			    data: this.metricsObj,
			    limit: 20,
			    onAutocomplete: val => {
			    	this.gotoMetric(val)
			    },
			    minLength: 1
			});
			// styling
			$('.autocomplete-content').css('margin-top', '0px').css('position', 'absolute').css('margin-left', '1rem')
			this.needsInit = false;
		},
		// update autocomplete data
		updateAutocomplete(){
			if(this.debug) console.log('updateAutocomplete')
			$('#' + this.compid + ' input.autocomplete').autocomplete('updateData', this.metricsObj)
		},
		// go to either public/internal/static deployed view, or edit view
		gotoMetric(shortname) {
			if (!shortname) return
			// get the actual metric from the selected realtimeshortname
			var rawMetric
			for (var i in this.metrics) {
				if (this.metrics[i].realtimeshortname == shortname) {
					rawMetric = this.metrics[i]
					break
				}
			}

			// if editing, go to edit view
			if(this.isEditing) this.gotoEditMetric(rawMetric)
			else{
				var metricLinks = this.$store.getters.metricLinks(rawMetric)
				if(this.debug) console.log(metricLinks)
				// if metric is edit only (sitename = data, status = anything except deployed)
				if(metricLinks.editOnly){
					if(!this.isAdmin){
						console.error('EDIT ONLY ROUTE')
						return
					}
					// if admin, go to edit view
					else this.gotoEditMetric(rawMetric)
				}
				else{
					var params = metricLinks.viewParams
					// requires change in domain name (ex. metrics page -> goto stat, stats page -> goto metric)
					if(metricLinks.viewRedirect){
						var fullViewURL = metricLinks.viewURL + '/dashboard/' + params.location + '/details/' + params.dept + '/' + params.id
						window.open(fullViewURL, '_blank');
					}
					else this.$router.push({ name: 'DetailsWithId', params: params })
				}
			}
		},
		gotoEditMetric(metric) {
			var metricLinks = this.$store.getters.metricLinks(metric)
			this.$router.push({ name: 'DetailsWithIdEdit', params: metricLinks.editParams })
		},
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.nav i {
	color: black !important;
	line-height: 1;
}
.input-field.nav {
	display: inline-block;
	line-height: 1 !important;
	color: grey;
	width: 350px;
}
.input-field.card {
	padding: 0px 24px 0px 8px;
	border-radius: 100px;
    border: none;
    -webkit-box-shadow: none;
    box-shadow: none;
    border-bottom: none;
}
.input-field input[type=text]:not(.browser-default) {
	border: none;
	margin: 0 0 0 3rem;
}
.input-field input[type=text]:focus {
	background-color: transparent;
	border: none;
	-webkit-box-shadow: none;
	box-shadow: none;
}
.material-icons.prefix {
	top: calc(50% - 1rem);
}
.material-icons.prefix.active {
	color: black;
}
</style>
