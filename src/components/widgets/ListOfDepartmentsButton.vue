<template>
	<div :id="compid">
		<a
			:id="compid + '-dropdown-button'"
			class="dropdown-button btn-flat grey-text waves-effect waves-light"
			:data-activates="compid + '-departments-dropdown'"
			@click="openDropdown()">
			<i class="material-icons right">mode_edit</i>
		</a>

		<ul :id="compid + '-departments-dropdown'" class="dropdown-content">
			<li v-for="department in departments">
				<a @click="callback(department)">{{ department }}</a>
				<div class="divider"></div>
			</li>
		</ul>
	</div>
</template>

<script>
import Vue from 'vue'
export default {
	name: 'ListOfDepartmentsButton',
	props: ['compid', 'callback'],
	data () {
		return {}
	},

	computed: {
		departments() {
			var depts = ['All Departments'].concat(this.$store.state.departments.map(dept => dept.bmpdisplayname).sort())
			return depts
			// this.$store.state.metrics.forEach(metric => {
			// 	var exists = false
			// 	depts.forEach(cat => {
			// 		if (cat == metric.Department) exists = true
			// 	})
			// 	if (!exists) depts.push(metric.Department)
			// })
			// return depts.sort((a,b) => {
			// 	if (a < b) return -1
			// 	if (a > b) return 1
			// 	return 0
			// })
		}
	},

	watch: {
		departments() {
			$('#'+this.compid + '-dropdown-button').dropdown({ constrainWidth: false })
		}
	},

	mounted() {},


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
