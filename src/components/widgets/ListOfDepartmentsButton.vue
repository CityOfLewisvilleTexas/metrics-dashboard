<template>
	<div :id="compid + '-container'" class="outer">
		<a :id="compid" :data-activates="compid + '-content'" :disabled="departmentsLoading"
			class="dropdown-button btn-flat grey-text waves-effect waves-light">
			<i class="material-icons right">mode_edit</i>
		</a>

		<ul :id="compid + '-content'" class="dropdown-content">
			<li>
				<a @click="callback(category_all)">All Departments</a>
			</li>
			<li class="divider"></li>
			<li v-for="department in departments">
				<a @click="callback(department)">{{ department.display }}</a>
				<div class="divider"></div>
			</li>
		</ul>
	</div>
</template>

<script>
import Vue from 'vue'
export default {
	name: 'ListOfDepartmentsButton',
	components: {},
	props: {
		config: {
			type: Object,
			required: false,
		},
		// used by ListOfMetrics
		filteredDepartments:{
			type: Array,
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
			isOpen: false,
		}
	},

	computed: {
		category_all(){ this.$store.state.categoryAll },
		storeIsLoading() { return this.$store.state.isLoading },
		storeIsRefreshing() { return this.$store.state.softReloading },
		departmentsLoading(){ return this.$store.getters.isLoading_categories },
		allDepartments() { return this.$store.getters.categoriesByType('department') },

		compid(){
			if(this.config && this.config.hasOwnProperty('compid')) return this.config.compid
			else return 'listdeptdropdown'
		},

		// props may include filtered departments to use instead of all departments (ex ListOfMetrics only shows departments with query metrics)
		departments(){
			if(this.filteredDepartments) return this.filteredDepartments
			else return this.allDepartments
		},
		// departments length will be 0 on initial load
		countDepartments(){ return this.departments.length },
	},

	watch: {
		// dropdown only needs to init/update on department length change
		countDepartments:{
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
		$('#' + this.compid).dropdown('destroy')
	},


	methods: {
		initDropdown(){
			if(this.debug) console.log('initDropdown')
			$('#' + this.compid).dropdown({ constrainWidth: false, closeOnClick: true, onOpenStart: this.setOpen, onCloseStart: this.setClose })
			this.needsInit = false;
		},
		updateDropdown(){
			if(this.debug) console.log('updateDropdown')
			$('#' + this.compid).dropdown('recalculateDimensions')
		},
		setOpen() { this.isOpen = true },
		setClose() { this.isOpen = false },
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
