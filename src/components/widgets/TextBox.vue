<template>
	<div :id="config.id" class="card blue-grey z-depth-0 white-text valign-wrapper" :class="'arrow-'+config.arrowPos">
		<div class="title grey lighten-2 grey-text text-darken-1" v-if="config.title">{{ config.title }}</div>
		<div class="body">{{ config.body }}</div>
	</div>
</template>

<script>
export default {
	name: 'TextBox',
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
.card {
	height: 100%;
}
.title {
	font-size: 1.4rem;
	font-family: 'Product Sans';
	padding: 8px 16px;
}
.body {
	padding: 16px;
	word-wrap: break-word;
	position: relative;
	overflow-y: auto;
	height: 100%;
	/*height: calc(100%);*/
}
.card:after {
	content: '';
	height: 100px;
	width: 100px;
	background-color: #607d8b;
	position: absolute;
	border-radius: 4px;
	transform: rotate(45deg);
	z-index: -1
}
.arrow-left { margin-left: 15px; }
.arrow-left:after {
	left: -15px;
	top: calc(50% - 50px);
}
.arrow-right { margin-right: 15px; }
.arrow-right:after {
	right: -15px;
	top: calc(50% - 50px);
}
.arrow-top {
	margin-top: 15px;
	height: calc(100% - 15px)
}
.arrow-top:after {
	top: -15px;
	left: calc(50% - 50px);
}
.arrow-bottom {
	margin-bottom: 15px;
	height: calc(100% - 15px)
}
.arrow-bottom:after {
	bottom: -15px;
	left: calc(50% - 50px);
}
</style>
