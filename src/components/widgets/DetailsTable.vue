<template>
	<div class="center-align details-table">
		<div :id="'metric-details-'+metric.psofia_recordid" ></div>
	</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'
export default {
	name: 'DetailsTable',
	components: {},
	props: {
		metric: {
			type: Object,
			required: true,
		},
		config: {	// timestamp
			type: Object,
			required: true,
		},
	},
	data () {
		return {
			debug: true,
		}
	},

	computed: {},

	watch: {
		metric() {
			Vue.nextTick(this.fetchDetails)
		}
	},

	// START
	mounted() {
		google.charts.load('current', {'packages':['table']})
		google.charts.setOnLoadCallback(this.fetchDetails)
	},

	methods: {
		fetchDetails() {
			if (this.metric.metrictype != 'Query') return
			// fetch
			axios.post('https://query.cityoflewisville.com/v2/?webservice=Performance Measures/Get Details or History', {
				uspName: this.metric.uspname,
				DetOrAvg: 'DETAILS'
			}).then(results => {
				if (results.data[0]) this.setupTableData(results.data[0])
			})
		},

		setupTableData(entries) {
			var data = new google.visualization.DataTable()
			var headers = 0
			// add each header
			for (var prop in entries[0]) {
				if (entries[0].hasOwnProperty(prop)) {
					data.addColumn('string', prop)
					headers++
				}
			}
			// fill in the data
			entries.forEach(entry => {
				var row = []
				for (var prop in entry) {
					if (entry.hasOwnProperty(prop)) {
						row.push(String(entry[prop]))
					}
				}
				data.addRow(row)
			})

			var el = document.getElementById('metric-details-'+this.metric.psofia_recordid)
			if (!el) return

			// draw table
			var table = new google.visualization.Table(el)
			table.draw(data, {height: 300})
			$('.google-visualization-table').css('width', '100%')

			$('.google-visualization-table-table th')
				.css('padding', '8px')
				.css('background-image', 'none')
				.css('background-color', 'white')
			$('th.google-visualization-table-th').css('border-bottom', '3px solid lightgrey')
			if (headers > 5)
				$('#details-modal-'+this.metric.psofia_recordid).css('width', '80%')
			else
				$('#details-modal-'+this.metric.psofia_recordid).css('width', '55%')
		}
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.pointy {
	cursor: pointer;
}
.google-visualization-table-table th {
	padding: 8px !important;
}
.loader {
	display: inline-block;
    border: 6px solid #D1C4E9;
    border-top: 6px solid #673AB7;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 2s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
