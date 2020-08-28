import Vue from 'vue'
import Router from 'vue-router'
import { store } from '@/store.js'

//import Dashboard from '@/components/Dashboard'
//import Details from '@/components/layouts/Details'
//import Default from '@/components/layouts/Default'
//import Stats from '@/components/layouts/Stats'
//import FixedDemo from '@/components/layouts/FixedDemo'
//import Donna from '@/components/layouts/Donna'
//import Admin from '@/components/layouts/Admin'
//import Demo from '@/components/layouts/Demo'
//import Carousel from '@/components/layouts/Carousel'
const Dashboard = () => import('@/components/Dashboard')
const Details = () => import('@/components/layouts/Details')
const Default = () => import('@/components/layouts/Default')
const Stats = () => import('@/components/layouts/Stats')
const Donna = () => import('@/components/layouts/Donna')
const Admin = () => import('@/components/layouts/Admin')
const Carousel = () => import('@/components/layouts/Carousel')
const Login = () => import('@/components/layouts/Login')


Vue.use(Router)

/*
  /dashboard/default
  /dashboard/stats
  /dashboard/donna
  :location = public (metrics) / internal (internal metrics) / stats (stats) / admin (all)
  /dashboard/:location/details

*/

const router = new Router({
  routes: [
    { path: '/', redirect: { name: 'Default' } },
    { path: '/dashboard/login/:required',
        name: 'Login',
        component: Login,
        meta: {
            title: 'Login',
        }
    },
    { path: 'account/:required',
        name: 'Account',
        component: Login,
        meta: {
            title: 'Login',
        }
    },
    {
      path: '/dashboard/admin',
      name: 'Admin',
      component: Admin,
      meta: {
        requiresAuth: true,
      },
      beforeEnter: checkAuth,
    },
// check host in component beforeRouteEnter, beforeRouteUpdate
    {
      path: '/dashboard/default',
      name: 'Default',
      component: Default,
      beforeEnter: (to, from, next) => {
        console.log('Default - beforeEnter')
        console.log(store.getters.isStats)
        if(store.getters.isStats) next({ name: 'Stats' })
        else next()
      },
    },
// check host in component beforeRouteEnter, beforeRouteUpdate
    {
      path: '/dashboard/stats',
      name: 'Stats',
      component: Stats,
      beforeEnter: (to, from, next) => {
        console.log('Stats - beforeEnter')
        console.log(store.getters.isStats)
        if(!store.getters.isStats) next({ name: 'Default' })
        else next()
      },
    },
    {
      path: '/dashboard/carousel',
      name: 'Carousel',
      component: Carousel
    },
    {
      path: '/dashboard/donna',
      name: 'Donna',
      component: Donna,
    },

// edit redirects
    {
      path: '/dashboard/:location/details/edit',
      redirect: to => {
        const { hash, params, query } = to
        console.log('/dashboard/:location/details/edit - redirect')
        var newParams = {location: params.location, dept: 'all', status: 'deployed'}
        return { name: 'DetailsEdit', params: newParams }
      },
    },
    {
      path: '/dashboard/:location/details/:dept/edit',
      redirect: to => {
        const { hash, params, query } = to
        console.log('/dashboard/:location/details/:dept/edit - redirect')
        var newParams = {location: params.location, dept: params.dept, status: 'deployed'}
        return { name: 'DetailsEdit', params: newParams }
      },
    },
    {
      path: '/dashboard/:location/details/:dept/:id/edit',
      redirect: to => {
        const { hash, params, query } = to
        console.log('/dashboard/:location/details/:dept/:id/edit - redirect')
        var newParams = {location: params.location, dept: params.dept, id: params.id, status: 'deployed'}
        return { name: 'DetailsWithIdEdit', params: newParams }
      },
    },

// view components
    {
      path: '/dashboard/:location/details/:dept',
      name: 'Details',
      component: Details,
      beforeEnter: checkViewParams,
    },
    {
      path: '/dashboard/:location/details/:dept/:id',
      name: 'DetailsWithId',
      component: Details,
      beforeEnter: checkViewParams,
    },

// edit components
    {
      path: '/dashboard/:location/details/:dept/edit/:status',
      name: 'DetailsEdit',
      component: Details,
      beforeEnter: checkEditParams,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/dashboard/:location/details/:dept/:id/edit/:status',
      name: 'DetailsWithIdEdit',
      component: Details,
      beforeEnter: checkEditParams,
      meta: {
        requiresAuth: true,
      },
    },

// random edit redirects
    /*{
      path: '/edit',
      redirect: to => {
        const { hash, params, query } = to
        console.log('/edit - redirect')
        var newParams = {location: 'public', dept: 'all', status: 'deployed'}
        if(store.getters.isStats) newParams.location = 'stats'
        return { name: 'DetailsEdit', params: newParams }
      }
    },
    {
      path: '/dashboard/edit',
      redirect: to => {
        const { hash, params, query } = to
        console.log('/dashboard/edit - redirect')
        var newParams = {location: 'public', dept: 'all', status: 'deployed'}
        if(store.getters.isStats) newParams.location = 'stats'
        return { name: 'DetailsEdit', params: newParams }
      }
    },
    {
      path: '/dashboard/details/edit',
      redirect: to => {
        const { hash, params, query } = to
        console.log('/dashboard/details/edit - redirect')
        var newParams = {location: 'public', dept: 'all', status: 'deployed'}
        if(store.getters.isStats) newParams.location = 'stats'
        return { name: 'DetailsEdit', params: newParams }
      }
    },

// catch all
    { path: '*',
      redirect: to => {
        const { hash, params, query } = to
        console.log('* - redirect')
        if(store.getters.isStats) return {name: 'Stats'}
        else return {name: 'Default'}
      }
    },*/
  ]
})

// set domain name in store on initial load
router.beforeEach((to, from, next) => {
  console.log('beforeEach')

  // set domain name if needed
  if(!store.state.domainName){
    var domainN = window.location.hostname.startsWith('stats') ? 'stats' : 'metrics'
    store.commit('setDomainName', { domainName: domainN } )
  }

  // save useremail if in storage and not already in store
  if(!store.state.userEmail && sessionStorage.authChecked && localStorage.colAuthToken && localStorage.colEmail){
    store.commit('login', { email: localStorage.colEmail })
  }
  next()
})


function checkAuth (to, from, next){
  if(store.state.userEmail){
    next()
  }
  else{
    // if already authenticated && has token & email, store user, allow
    if(sessionStorage.authChecked && localStorage.colAuthToken && localStorage.colEmail){
      store.commit('login', { email: localStorage.colEmail })
      next()
    }
    // else push to login page, immediately require login, then return or redirect
    else{
      var redirectOnAuth = to.fullPath;
      var redirectOnFail = redirectOnAuth
      if(to.name == 'Admin'){
        console.log('going to admin')
        if(store.getters.isStats) redirectOnFail = '/dashboard/stats'
        else redirectOnFail = '/dashboard/default'
      }
      else if(to.name == 'DetailsEdit' ||  to.name == 'DetailsWithIdEdit'){
        console.log('going to edit')
        var i = redirectOnFail.indexOf('/edit')
        if(i > -1) redirectOnFail = redirectOnFail.substring(0, i)
      }
      if(to.name == 'Details' || to.name == 'DetailsWithId' || to.name == 'DetailsEdit' ||  to.name == 'DetailsWithIdEdit'){
        var failLocation = 'public'
        if(store.getters.isStats) failLocation = 'stats'
        if(to.params.location == 'internal') redirectOnFail = redirectOnFail.replace('internal', 'public')
        else if(to.params.location == 'admin') redirectOnFail = redirectOnFail.replace('admin', failLocation)
        else if(to.params.location == 'data') redirectOnFail = redirectOnFail.replace('data', failLocation)
        else if(to.params.location == 'unknown') redirectOnFail = redirectOnFail.replace('unknown', failLocation)
      }
      next({ path: '/login/1', query: { redirect: redirectOnAuth, failredirect: redirectOnFail } })
    }
  }
}

function checkViewParams (to, from, next) {
  // copied into Details.vue beforeUpdate
  if(store.state.routeDebug) console.log(to.name + ' - beforeEnter')
  if(store.state.routeDebug) console.log(to.fullPath)
  var newParams = to.params
  var isStats = store.getters.isStats
  var needsUpdate = false
  // admin, dept, unknown redirects to edit automatically
  if(newParams.location == 'admin' || newParams.location == 'data' || newParams.location == 'unknown'){
    newParams = Object.assign(newParams, {status: 'deployed'})
    if(newParams.id) next({ name: 'DetailsWithIdEdit', params: newParams })
    else next({ name: 'DetailsEdit', params: newParams })
  }
  // redirect
  else if((isStats && (newParams.location == 'public' || newParams.location == 'internal')) || (!isStats && newParams.location == 'stats')){
    var redirectURL = store.getters.redirectURL + to.fullPath
    window.location.assign(redirectURL)
    next(false)
  }
  else{
    // clean location param
    if((isStats && newParams.location != 'stats') || (!isStats && newParams.location != 'public' && newParams.location != 'internal')){
      if(isStats) newParams.location = 'stats'
      else newParams.location = 'public'
      needsUpdate = true
    }
    
    if(needsUpdate) next({ name: to.name, params: newParams })
    else{
      if(newParams.location == 'internal'){
        checkAuth(to, from, next)
      }
      else next()
    }
  }
}

function checkEditParams (to, from, next) {
  // copied into Details.vue beforeUpdate
  if(store.state.routeDebug) console.log(to.name + ' - beforeEnter')
  if(store.state.routeDebug) console.log(to.fullPath)
  var newParams = to.params
  var isStats = store.getters.isStats
  var needsUpdate = false
  // clean location param
  if(newParams.location != 'admin' && newParams.location != 'public' && newParams.location != 'stats' && newParams.location != 'internal' && newParams.location != 'data' && newParams.location != 'unknown'){
    if(isStats) newParams.location = 'stats'
    else newParams.location = 'public'
    needsUpdate = true
  }
  // clean status param
  if(newParams.status != 'deployed' && newParams.status != 'development' && newParams.status != 'review' && newParams.status != 'missing'){
    newParams.status = 'deployed'
    needsUpdate = true
  }

  // deployed edit view should look the same as view - hide routes for all locations and all departments
  if(newParams.status == 'deployed'){
    if(newParams.location == 'admin'){
      if(isStats) newParams.location = 'stats'
      else newParams.location = 'public'
      needsUpdate = true
    }
    if(newParams.dept == 'all'){
      newParams.dept = 'citywide'
      needsUpdate = true
    }
  }

  if(needsUpdate) next({ name: to.name, params: newParams })
  else{
    checkAuth(to, from, next)
  }
}

export default router