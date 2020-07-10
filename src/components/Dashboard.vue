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

  mounted() {
    this.setSite()
    this.setSize()
    $(window).resize(this.setSize)
  },
  beforeDestroy() {
    $(window).off('resize')
  },

  data () {
    return {
      ready: true
    }
  },

  computed: {
    siteDomain() {
      return this.$store.state.domainName
    },
    site() {
      return this.$store.state.site
    },
    siteFilters() {
      return this.$store.state.siteFilters
    },
  },

  watch: {
    $route (to, from){
        this.setSite();
    },
    siteFilters: {
      handler(val){
        console.log('change to siteFilters')
        this.initialFetchPerfMeasures()
      },
      deep: true
    }
  },

  methods: {
    setSize() {
      this.$store.commit('setSize')
    },
    setSite() {
      var domainName = location.href.indexOf('stats.cityoflewisville.com') == -1 ? 'metrics' : 'stats';
      var filters = {
        sitename: '',
        status: 'deployed',
        type: '',
        master: '',
      }
      var isStatView = this.$route.fullPath.indexOf('stats') != -1 ? true : false
      var isInternalView = this.$route.fullPath.indexOf('internal') != -1 ? true : false

      if(domainName == 'stats'){
        filters.sitename = 'stats'
        // if adding stats internal only
        if(isInternalView){
          filters.master = 'stats_internal'
        }
      }
      else{ //metrics.col
        if(isStatView) filters.sitename = 'stats'
        else{
          filters.sitename = 'metricPublic
          if(isInternalView){
            filters.sitename = 'metricInternal'
            filters.master = 'metrics_internal'
          }
        }
      }

      if(this.$route.fullPath.indexOf('admin') != -1) filters.master = 'admin'

      // carousel will not have refreshing metrics
      if(this.$route.fullPath.indexOf('carousel') != -1){
        if(this.siteFilters.sitename != filters.sitename || this.siteFilters.status != filters.status || this.siteFilters.type != filters.type || this.siteFilters.master != filters.master){
          this.$store.commit('setSiteFilters', filters)
          this.$store.commit('clearMetrics')
        }
      }
    },

    initialFetchPerfMeasures() {
      // carousel will not have refreshing metrics
      if(this.$route.fullPath.indexOf('carousel') != -1) this.$store.dispatch('fetchPerfMeasures')
    }

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#pie-holder {
}
</style>
