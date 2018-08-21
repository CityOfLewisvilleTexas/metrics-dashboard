<template>
	<div>
		{{ message }}
	</div>
</template>

<script>
export default {
	name: 'Template',
	components: {
	},
	props: ['config'],
	data () {
		return {
			message: 'Hello, world!'
		}
	},

	computed: {
	},

	watch: {
	},

	// START HERE
	mounted() {
	},

	// called as component is removed
	beforeDestroy() {
	},

	methods: {
	}
}
</script>

<!-- anything here only applies to this component (because of "scoped") -->
<style scoped>
</style>
