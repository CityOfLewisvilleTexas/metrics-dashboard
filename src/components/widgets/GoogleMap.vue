<template>
	<div class="center-align card">
		<div class="title grey lighten-2 grey-text text-darken-1 left-align">
			{{ config.title }}
			<i class="material-icons right tooltipped" :data-tooltip="config.why" data-delay="0" v-if="config.why">help</i>
		</div>
		<div class="outer">
			<div class="map" :id="config.compid+'-map'">
				MAP
			</div>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'
export default {
	name: 'GoogleMap',
	components: {
	},
	props: ['config'],
	data () {
		return {
			debug: true,
			isLoading: true
		}
	},

	computed: {
		// copy of store metrics, filtered to Query only
		metrics() {
			return this.$store.state.metrics.filter(metric => {
				return metric.metrictype == 'Query'
			}).sort((a,b) => {
				if (a.realtimeshortname < b.realtimeshortname) return -1
				if (a.realtimeshortname > b.realtimeshortname) return 1
				return 0
			})
		}
	},

	// START
	mounted() {
		if(this.debug) console.log('Mounted')
		this.initMap()
	},

	methods: {
		initMap() {
			var uluru = {lat: 33.047751, lng:  -96.997290}
            var map = new google.maps.Map(document.querySelector(`#${this.config.compid}-map`), {
                zoom: 12,
                center: uluru
            })
            var kmlLayer = new google.maps.KmlLayer('https://sites.google.com/a/cityoflewisville.com/gis/files/CityLimitsPoly.kmz?attredirects=0&d=1', {
                suppressInfoWindows: true,
                preserveViewport: true,
                map: map
            })
            var trafficLayer = new google.maps.TrafficLayer();
        	trafficLayer.setMap(map);
		}
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.card {
	height: 100%;
}
.title {
	font-size: 1.4rem;
	font-family: 'Product Sans';
	padding: 8px 16px;
}
.outer {
	height: 100%;
	/*padding: 8px;*/
}
.map {
	height: calc(100% - 48px);
	padding: 16px;
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
