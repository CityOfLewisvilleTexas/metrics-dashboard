<template>
	<div :id="compid + '-container'" class="outer">
		<a :id="compid" :data-activates="compid + '-content'" :disabled="departmentsLoading"
			class="dropdown-button btn">
			<i class="material-icons right">keyboard_arrow_down</i>Departments
		</a>
		<ul :id="compid + '-content'" class="dropdown-content">
			<li v-for="dept in departments"><a @click="gotoDept(dept)">{{ dept.display }}</a></li>
		</ul>
	</div>
</template>

<script>
import Vue from 'vue'
export default {
	name: 'DepartmentsDropdown',
	components: {},
	props: {
		config: {
			type: Object,
			required: false,
		},
	},
	data () {
		return {
			debug: true,
			needsInit: true,
			isOpen: false,
		}
	},

	computed: {
		locationParam() { return this.$route.params.location },

		storeIsLoading() { return this.$store.state.isLoading },
		storeIsRefreshing() { return this.$store.state.softReloading },
		departmentsLoading(){ return this.$store.getters.isLoading_categories },

		compid(){
			if(this.config && this.config.hasOwnProperty('compid')) return this.config.compid
			else return 'deptdropdown'
		},

		departments() { return this.$store.getters.categoriesByType('department') },
		// departments length will be 0 on initial load
		countDepartments(){ return this.departments.length },
	},

	watch: {
		// dropdown only needs to init/update on department length change
		countDepartments:{
			immediate: true,
			handler(newVal, oldVal) {
				if(newVal > 0){
					// on initial load initialize the dropdown
					if(this.needsInit) Vue.nextTick(this.initDropdown)
					// on future length changes, resize the dropdown if open
					else if(this.isOpen) Vue.nextTick(this.updateDropdown)
				}
			},
		},
	},

	mounted() {
		if(this.debug) console.log('Mounted')
	},
	beforeDestroy() {
		if(this.debug) console.log('Destroy')
		$('#' + this.compid).dropdown('destroy')
	},

	methods: {
		initDropdown(){
			if(this.debug) console.log('initDropdown')
			$('#' + this.compid).dropdown({ onOpenStart: this.setOpen, onCloseStart: this.setClose })
			this.needsInit = false;
		},
		// update dropdown dimensions
		updateDropdown(){
			if(this.debug) console.log('updateDropdown')
			$('#' + this.compid).dropdown('recalculateDimensions')
		},
		// go to same location deployed view (admin redirects to edit deployed view)
		gotoDept(department) {
			var params = {location: this.locationParam, dept: department.deptParam}
			this.$router.push({ name: 'Details', params: params })
		},
		setOpen() { this.isOpen = true },
		setClose() { this.isOpen = false },
	}
}
</script>

<!-- anything here only applies to this component (because of "scoped") -->
<style scoped>
</style>
