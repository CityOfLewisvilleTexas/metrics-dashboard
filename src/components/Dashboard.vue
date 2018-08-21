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

      console.log('initial fetch')

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
      this.$store.dispatch('fetchMetrics', _params)

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
