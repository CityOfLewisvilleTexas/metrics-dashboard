<template>
    <div id="carousel">
        <ListOfMetrics :config="config7" />
    </div>
</template>

<script>
import ListOfMetrics from '../widgets/ListOfMetrics'
export default {
    components: {
		ListOfMetrics
    },
    data () {
        return {
            config7: {
				compid: 'g7-list',
				editable: false
			},
        }
    }
}
</script>

<style>
#carousel {
    overflow-x: hidden;
}
</style>