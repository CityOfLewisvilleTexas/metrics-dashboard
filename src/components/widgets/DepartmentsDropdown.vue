<template>
	<div>
		<a class="dropdown-button btn" data-activates="departments-dropdown">
			<i class="material-icons right">keyboard_arrow_down</i>Departments
		</a>
		<ul id="departments-dropdown" class="dropdown-content">
			<li v-for="dept in departments"><a :href="linkToDept(dept)">{{ dept.bmpdisplayname }}</a></li>
		</ul>
	</div>
</template>

<script>
export default {
	name: 'DepartmentsDropdown',
	components: {
	},
	props: ['config'],
	data () {
		return {
		}
	},

	computed: {
		departments() {
			return this.$store.state.departments.sort((a,b) => {
				if (a.bmpdisplayname < b.bmpdisplayname) return -1
				if (a.bmpdisplayname > b.bmpdisplayname) return 1
				return 0
			})
		}
	},

	watch: {
	},

	// START HERE
	mounted() {
		$('.dropdown-button').dropdown()
	},

	// called as component is removed
	beforeDestroy() {
	},

	methods: {
		linkToDept(dept) {
			var site = this.$store.state.site == 'stats' ? 'stats' : 'public'
			return './#/dashboard/' + site + '/details/' + dept.bmpdisplayname.replace(/ /g, '').toLowerCase()
		}
	}
}
</script>

<!-- anything here only applies to this component (because of "scoped") -->
<style scoped>
</style>
