<template>
	<div :id="compid">
		<a
			:id="compid + '-dropdown-button'"
			class="dropdown-button btn-flat grey-text waves-effect waves-dark"
			:data-activates="compid + '-metrics-dropdown'"
			@click="openDropdown()">
			<i class="material-icons right">mode_edit</i>
		</a>

		<ul :id="compid + '-metrics-dropdown'" class="dropdown-content">
			<li v-for="metric in metrics">
				<a @click="callback(metric)">{{ metric.realtimeshortname }}</a>
				<div class="divider"></div>
			</li>
		</ul>
	</div>
</template>

<script>
import Vue from 'vue'
export default {
	name: 'ListOfMetricsButton',
	props: ['compid', 'callback'],
	data () {
		return {
			debug: true,
		}
	},

	computed: {
		metrics() {
			return this.$store.state.metrics.filter(metric => {
				return metric.metrictype == 'Query'
			}).sort((a,b) => {
				if (a.realtimeshortname < b.realtimeshortname) return -1
				if (a.realtimeshortname > b.realtimeshortname) return 1
				return 0
			})
		}
	},

	watch: {
		metrics() {
			$('#'+this.compid + '-dropdown-button').dropdown({ constrainWidth: false })
		}
	},

	mounted() {
		if(this.debug) console.log('MOUNTED')
	},


	methods: {
		// activate dropdown menu
		openDropdown() {
			$('#'+this.compid + '-dropdown-button').dropdown({ constrainWidth: false })
			Vue.nextTick(() => {
				$('#'+this.compid + '-dropdown-button').dropdown('open')
			})
		}
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
