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
    // if stats domain, redirect ot the stats page
    // if (location.href.indexOf('stats.cityoflewisville.com') != -1 && ) {
    //   this.$router.push({path: '/dashboard/stats'})
    // }
    this.setSite()
    this.setSize()
  },

  data () {
    return {
      ready: true
    }
  },

  computed: {
    site() {
      return this.$store.state.site
    },
    isLoading() {
      return this.$store.state.isLoading
    },
    isRefreshing() {
      return this.$store.state.softReloading
    },
    refreshedAt() {
      return this.$store.state.fromNow
    },
    underLarge() {
      return this.$store.state.underLarge
    }
  },

  watch: {
    site() {
      this.goToSite()
    }
  },

  methods: {
    setSize() {
      this.$store.commit('setSize')
    },
    setSite() {
      var site = location.href.indexOf('stats.cityoflewisville.com') == -1 ? 'metrics' : 'stats'
      this.$store.commit('setSite', site)
    },

    goToSite() {

      // specifies metrics to get
      var _params = {
        public: this.site == 'stats' ? 0 : 1,
        internal: 0,
        stat: this.site == 'stats' ? 1 : 0,
        status: 'deployed',
        type: '',
        master: ''
      }

      // call fetch on Store
      if(this.$route.fullPath.toLowerCase().indexOf('carousel') == -1){
        console.log('initial fetch')
        this.$store.dispatch('fetchMetrics', _params)
      }

      var sitename = this.site == 'stats' ? 'stats' : location.href.indexOf('donna')!=-1 ? 'donna' : location.href.indexOf('details')!=-1 ? '' : ''
      // if (sitename != '') this.$router.push({ path: '/dashboard/'+sitename })
    }

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#pie-holder {
}
</style>
