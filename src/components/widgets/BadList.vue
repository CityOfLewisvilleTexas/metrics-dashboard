<template>
	<div :id="compid" class="valign-wrapperX table-container">
		<table class="">
			<thead>
				<tr>
					<th>Metric Name</th>
					<th>Value</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="i in 12">
					<td>Pct of Dashboard Complete</td>
					<td>{{ (Math.random()*100).toFixed(2) }}%</td>
				</tr>
			</tbody>
		</table>
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
	background-color: rgba(255,255,255,0.4);
	width: 100%;
	border-radius: 10px;
	height: 100%;
	overflow-y: scroll;
	padding: 32px;
}
table {
	color: white;
}
</style>
