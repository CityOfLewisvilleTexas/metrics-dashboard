<template>
  <div>
      <div>
        <router-view/>
      </div>
  </div>
</template>

<script>
import Vue from 'vue'
export default {
  name: 'Dashboard',

  components: {},

  data () {
    return {
      ready: true,
      debug: true,
    }
  },

  computed: {
  },

  watch: {
  },

  mounted() {
    if(this.debug) console.log('Mounted')
    this.setSize()
    $(window).resize(this.setSize)
    google.charts.load('current', {'packages':['gauge', 'table', 'corechart']})
    google.charts.setOnLoadCallback(this.setGoogleChartsLoaded)
  },

  beforeDestroy() {
    if(this.debug) console.log('Destroy')
    $(window).off('resize')
  },

  methods: {
    setSize() {
      var width = $(window).width()
      var height = $(window).height()
      this.$store.commit('setSize', {width: width, height: height})
    },
    setGoogleChartsLoaded(){
      this.$store.commit('setGoogleChartsLoaded')
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#pie-holder {
}
</style>
