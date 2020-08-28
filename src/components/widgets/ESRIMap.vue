<template>
	<div class="card maps left-align">
		<div v-if="config.title" class="title grey lighten-2 grey-text text-darken-1">
             {{ config.title }}
            <span class="spaced" v-if="config.external_url && config.external_url.display"><a :href="config.external_url.url" target="_blank">{{ config.external_url.text }}</a></span>
			<i class="material-icons right tooltipped" :data-tooltip="config.why" data-delay="0" v-if="config.why">help</i>
		</div>
		<iframe width="100%" :height="config.height" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" :src="config.url"></iframe>
	</div>
</template>

<script>
import Vue from 'vue'
export default {
	name: 'ESRIMap',
	components: {},
	props: {
		config: {
			type: Object,
			required: true,
		},
	},
	data () {
		return {
			debug: false,
			isLoading: true
		}
	},

	computed: {
	},

	// START
	mounted() {
		this.isLoading = false
	},

	methods: {}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.title {
	font-size: 1.4rem;
	font-family: 'Product Sans';
	padding: 8px 16px;
}
iframe {
	height: calc(100% - 47px);
}
.maps {
	height: 100%;
}
.spaced {
	margin-left: 10px;
}
</style>
