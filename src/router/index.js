import Vue from 'vue'
import Router from 'vue-router'
import Dashboard from '@/components/Dashboard'
import Details from '@/components/layouts/Details'
import Default from '@/components/layouts/Default'
import Stats from '@/components/layouts/Stats'
import FixedDemo from '@/components/layouts/FixedDemo'
import Donna from '@/components/layouts/Donna'
import Admin from '@/components/layouts/Admin'
import Demo from '@/components/layouts/Demo'
import Carousel from '@/components/layouts/Carousel'


Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/dashboard/default'  // replaced by landing page
    },
    {
      path: '/dashboard/:location/details/:dept/',
      name: 'Details',
      component: Details
    },
    {
      path: '/dashboard/admin/details/:dept/',
      name: 'AdminDetails',
      component: Details
    },
    {
      path: '/dashboard/:location/details/:dept/:id/',
      name: 'DetailsWithId',
      component: Details
    },
    {
      path: '/dashboard/:location/details/:dept/:id/:edit',
      name: 'DetailsWithIdEdit',
      component: Details
    },
    {
      path: '/dashboard/default/',
      name: 'Default',
      component: Default
    },
    {
      path: '/dashboard/stats/',
      name: 'Stats',
      component: Stats
    },
    {
      path: '/dashboard/fixed/',
      name: 'Fixed',
      component: FixedDemo
    },
    {
      path: '/dashboard/donna/',
      name: 'Donna',
      component: Donna
    },
    {
      path: '/dashboard/admin/',
      name: 'Admin',
      component: Admin
    },
    {
      path: '/dashboard/carousel/',
      name: 'Carousel',
      component: Carousel
    },
    {
      path: '/demo',
      name: 'Demo',
      component: Demo
    }
  ]
})
