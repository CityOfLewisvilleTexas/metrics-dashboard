<template>
    <ListOfMetrics :config="config7" />
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