<template>
	<main>
		<div class="container">
			<div class="row">
				<div class="col s12" id="g1">
					<ListOfMetrics :config="config1"/>
				</div>
			</div>
		</div>
	</main>
</template>

<script>
import ListOfMetrics from '../widgets/ListOfMetrics'

export default {
	name: 'Carousel',
	components: {
		ListOfMetrics
	},
	props: [],
	data () {
		return {
			debug: true,
			config1: {
				compid: 'g1-list',
				type: 'landingPageCarousel',
				editable: false,
			},
		}
	},

	computed: {
		carouselLoading() { return this.$store.getters.isLoading_landingPageCarousel },
		carouselRefreshing() { return this.$store.state.landingPageCarouselSoftReloading },
		underLarge() { return this.$store.state.underLarge },
		// debug only
		storeIsLoading() { return this.$store.state.isLoading },
		storeIsRefreshing() { return this.$store.state.softReloading },
		categoriesLoading(){ return this.$store.getters.isLoading_categories },
	},

	watch: {
		carouselLoading:{	// debug only
			immediate: true,
			handler(newVal, oldVal) {
				if(this.debug) console.log('carouselLoading: ' + oldVal  + ' -> ' + newVal)
			},
		},
		carouselRefreshing:{	// debug only
			immediate: true,
			handler(newVal, oldVal) {
				if(this.debug) console.log('carouselRefreshing: ' + oldVal  + ' -> ' + newVal)
			},
		},
		isLoading:{	// debug only
			immediate: true,
			handler(newVal, oldVal) {
				if(this.debug) console.log('isLoading: ' + oldVal  + ' -> ' + newVal)
			},
		},
		isRefreshing:{	// debug only
			immediate: true,
			handler(newVal, oldVal) {
				if(this.debug) console.log('isRefreshing: ' + oldVal  + ' -> ' + newVal)
			},
		},
		categoriesLoading:{	// debug only
			immediate: true,
			handler(newVal, oldVal) {
				if(this.debug) console.log('categoriesLoading: ' + oldVal  + ' -> ' + newVal)
			},
		},
	},

	mounted() {
		if(this.debug) console.log('Mounted')
		this.fetchMetrics()
	},
	beforeDestroy() {
		if(this.debug) console.log('Destroy')
	},

	methods: {
		// for refreshing
		fetchMetrics() {
			if(this.debug) console.log('carousel - fetch metrics')
			this.$store.dispatch('fetchLandingPageCarousel')
		},
	}
}
</script>

<!-- anything here only applies to this component (because of "scoped") -->
<style scoped>
.row {
	margin-bottom: 0 !important;
}
.row .col {
	padding: 0 0 0 0 !important;
}
.card {
	margin: 0 0 0 0 !important;
}
.embed-container {
	position: relative;
	padding-bottom: 80%;
	height: 0;
	max-width: 100%;
}
.embed-container iframe, .embed-container object, .embed-container iframe {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 370px;
}

</style>