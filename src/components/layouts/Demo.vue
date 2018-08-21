<template>
	<div>
		{{ message }}
		<DemoWidget :config="'chris'" />
		<DemoWidget :config="'jason'" />
		<DemoWidget :config="'elizabeth'" />
		<DemoWidget :config="'colton'" />
		<DemoWidget :config="'jesse'" />
	</div>
</template>

<script>
import DemoWidget from '@/components/widgets/DemoWidget'
export default {
	name: 'Demo',
	components: {
		DemoWidget
	},
	props: ['config'],
	data () {
		return {
			message: 'Hello, World!'
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
