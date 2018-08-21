<template>
	<div :class="config">
		{{ message }}, {{ config }}!
	</div>
</template>

<script>
export default {
	name: 'DemoWidget',
	components: {
	},
	props: ['config'],
	data () {
		return {
			message: 'Hello'
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
div {
	font-size: 5rem;
	color: red;
}
.chris {
	color: rgba(0,0,0,1);
}
.jason {
	color: rgba(0,0,0,.7);
}
.elizabeth {
	color: rgba(0,0,0,.5);
}
.colton {
	color: rgba(0,0,0,.40);
}
.jesse {
	color: rgba(0,0,0,.25);
}
</style>
