<template>
	<div :id="compid" class="input-field card" :class="{ nav : nav }">
		<i class="material-icons prefix">search</i>
		<input class="autocomplete" type="text" placeholder="Search metrics..." v-model="searchTerm" />
	</div>
</template>

<script>
import Vue from 'vue'
export default {
	name: 'SearchBar',
	props: ['compid', 'nav'],
	data () {
		return {
			searchTerm: ''
		}
	},

	computed: {
		admin() {
			return this.$route.fullPath.toLowerCase().indexOf('admin') != -1
		},
		metrics() {
			var copy = JSON.parse(JSON.stringify(this.$store.state.metrics))
			return copy.sort((a,b) => {
				if (a.realtimeshortname < b.realtimeshortname) return -1
				if (a.realtimeshortname > b.realtimeshortname) return 1
				return 0
			})
		},

		metricsObj() {
			// convert list of metrics into an object (for Materialize autocomplete)
			var objectified = {}
			this.metrics.forEach(metric => {
				objectified[metric.realtimeshortname] = null
			})

			return objectified
		},

		editing() {
			return this.$route.params.id == 'edit' || this.$route.params.edit == 'edit'
		}
	},

	watch: {
		metrics() {
			// when metrics are set up/changed, initialize the autocomplete
			if(this.metrics) Vue.nextTick(this.setupAutocomplete)
		}
	},
	mounted() {
		if(this.metrics) Vue.nextTick(this.setupAutocomplete)
	},
	methods: {
		setupAutocomplete() {
			if (!this.metrics.length ) return
			$('#' + this.compid + ' input.autocomplete').autocomplete({
			    data: this.metricsObj,
			    limit: 20,
			    onAutocomplete: val => {
			    	this.gotoMetric(val)
			    },
			    minLength: 1
			});
			// styling
			$('.autocomplete-content').css('margin-top', '0px').css('position', 'absolute').css('margin-left', '1rem')
		},
		gotoMetric(metric) {
			if (!metric) return
			// get the psofia id from the selected metric
			var rawMetric = {}
			for (var i in this.metrics) {
				if (this.metrics[i].realtimeshortname == metric) {
					rawMetric = this.metrics[i]
					break
				}
			}
			var dept = rawMetric.Department.toLowerCase().replace(/ /g, '')
			// go to the details page
			this.$router.push({ path: '/dashboard/'+ (this.$route.params.location ? this.$route.params.location : 'public') + '/details/'+dept+'/'+rawMetric.psofia_recordid + (this.editing ? '/edit' : '') })//, query: { id: id }})
		}
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.nav i {
	color: black !important;
	line-height: 1;
}
.input-field.nav {
	display: inline-block;
	line-height: 1 !important;
	color: grey;
	width: 350px;
}
.input-field.card {
	padding: 0px 24px 0px 8px;
	border-radius: 100px;
    border: none;
    -webkit-box-shadow: none;
    box-shadow: none;
    border-bottom: none;
}
.input-field input[type=text]:not(.browser-default) {
	border: none;
	margin: 0 0 0 3rem;
}
.input-field input[type=text]:focus {
	background-color: transparent;
	border: none;
	-webkit-box-shadow: none;
	box-shadow: none;
}
.material-icons.prefix {
	top: calc(50% - 1rem);
}
.material-icons.prefix.active {
	color: black;
}
</style>
