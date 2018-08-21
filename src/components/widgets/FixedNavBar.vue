<template>
	<div :id="compid">
		<div class="navbar-fixed">
			<nav>
	    		<div class="nav-wrapper">
	    			<a href="#!" class="brand-logo">Logo</a>
	    			<ul class="right hide-on-med-and-down">
	        			<li><a href="sass.html">Sass</a></li>
	        			<li><a href="badges.html">Components</a></li>
	    			</ul>
				</div>
			</nav>
		</div>
	</div>
</template>

<script>
export default {
	name: 'Table',
	props: ['compid'],
	data () {
		return {
		}
	},

	mounted() {
	},

	beforeDestroy() {
	},

	methods: {
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.table-container {
	background-color: rgba(255,255,255,0.2);
	width: 100%;
	border-radius: 10px;
	height: 100%;
	overflow-y: scroll;
}
table {
	color: white;
}
</style>
