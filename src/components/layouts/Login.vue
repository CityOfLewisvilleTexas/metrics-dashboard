<template>
    <div>
        <header>
            <div class="navbar-fixed">
                <nav>
                    <div id="top-nav" class="nav-wrapper col-purple left-align">
                        <a data-activates="slide-out" id="details-side" class="button-collapse"><i class="material-icons">menu</i></a>
                        <div class="logo"></div>
                        <div class="brand-logo white-text text-darken-3">City of Lewisville</div>
                            <li v-if="!underLarge">
                                <a class="btn amber black-text" :href="landingURL">
                                    <span>dashboard</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>
            </div>
        </header>

        <main>
            <div class="container">

                <div class="spinner main" v-if="isLoading">
                    <div class="double-bounce1"></div>
                    <div class="double-bounce2"></div>
                </div>

                <div class="modal white">
                    <div class="modal-content">
                        <div class="left-align card-title valign-wrapper">
                            {{ title }}
                        </div>
                        <div class="left-align card-subtitle valign-wrapper">
                            {{ statusDisplay }}
                        </div>
                        <div class="left-align card-text valign-wrapper">
                            {{ message }}
                            {{userEmailDisplay}}
                        </div>
                    </div>

                    <div class="modal-footer">
                        <a v-if="status == 3 && userStatus > 1" @click="switchUser"
                            class="modal-action waves-effect waves-dark btn-flat">
                            Change Account
                        </a>
                        <a v-if="status == 3 && userStatus > 1" @click="logout"
                            class="modal-action waves-effect waves-dark btn-flat">
                            Log Out
                        </a>
                        <a v-if="status == 0 || status == 2" @click="login"
                            class="modal-action waves-effect waves-dark btn-flat">
                            {{status == 2 ? 'Change Account' : 'Log In'}}
                        </a>
                        <v-spacer></v-spacer>
                        <a v-if="loginRequired && (status == 0 || status == 2)" @click="gotoFailRedirect"
                            class="modal-action waves-effect waves-dark btn-flat">
                            Cancel
                        </a>
                        <a v-if="(loginRequired && status > 2) || !loginRequired" @click="gotoRedirect"
                            class="modal-action waves-effect waves-dark btn-flat">
                            {{ loginRequired ? 'Continue' : 'Return' }}
                        </a>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'
import Moment from 'moment'
export default {
    name: 'Login',
    components: {},
    beforeRouteUpdate (to, from, next) {
        // clear timeouts
        if(this.checkTimeout) clearTimeout(this.checkTimeout)
        if(this.redirectTimeout) clearTimeout(this.redirectTimeout)
        Vue.nextTick(function(){
            next();
        });
    },
    beforeRouteLeave (to, from, next) {
        // clear timeouts
        if(this.checkTimeout) clearTimeout(this.checkTimeout)
        if(this.redirectTimeout) clearTimeout(this.redirectTimeout)
        Vue.nextTick(function(){
            next();
        });
    },


    data: function(){
        return{
            debug: false,
            statusDebug: [],
            isLoading: true,
            sharedState: store.state,

            dialog: false,
            authImmediate: false,
            status: null,
            countCallAuth: 0,
            checkTimeout: null,
            redirectTimeout: null,
        }
    },


    watch:{
        $route(to, from){
            if(this.routeDebug) console.log('\t\tRoute changed');
            this.routeChanged();
        },
        userEmail(newVal, oldVal){
            if(this.debug) console.log('\tuserEmail changed - old: ' + oldVal + ' -> new: ' + newVal)
        },
        status:{
            immediate: false,
            handler: function(newVal, oldVal) {
                if(this.debug) this.statusDebug.unshift(newVal)
                if(this.debug) console.log('\tstatus - ' + this.statusDebug)
                /*if(newVal == 3){
                    this.dialog = false
                    this.gotoRedirect()
                }*/
            },
        },
    },


    computed: {
        routeParams: function(){ if(this.$route.hasOwnProperty('params') && this.$route.params) return this.$route.params },
        routeQuery: function(){ if(this.$route.hasOwnProperty('query') && this.$route.query) return this.$route.query },
        requiredParam: function(){ if(this.routeParams && this.routeParams.hasOwnProperty('required')) return this.routeParams.required },
        queryRedirect: function(){ if(this.routeQuery && this.routeQuery.hasOwnProperty('redirect') && this.routeQuery.redirect) return this.routeQuery.redirect },
        queryFailRedirect: function(){ if(this.routeQuery && this.routeQuery.hasOwnProperty('failredirect') && this.routeQuery.failredirect) return this.routeQuery.failredirect },

        storeDebug: function(){ return this.$store.state.debug },
        routeDebug: function(){ return this.$store.state.routeDebug },
        userEmail: function(){ return this.$store.state.userEmail },

        loginRequired: function(){
            return this.requiredParam == 1;
        },

        // 0: never signed in; 1: signed in, no localstorage (not @col), 2: email only (no AD account), 1: user fully logged in (email & AD)
        userStatus: function(){
            var status = 0
            if(this.userLoading) status = -1
            else if(this.userEmail) status = 2
            else if(sessionStorage.authChecked) status = 1
            return status;
        },
        userEmailDisplay: function(){
            if(this.userStatus == -1) return 'Loading...'
            if(this.userStatus == 0) return 'None'
            if(this.userStatus == 1) return 'Emails must be @cityoflewisville.com'
            if(this.userStatus > 1 && this.userEmail) return this.userEmail
            return '???'
        },
        title: function(){
            var title = 'Login'
            if(this.loginRequired) title = 'Login Required'
            return title
        },
        statusDisplay: function(){
            var str = ''
            if(this.status == 3) str = 'Account verified.'
            else if(this.status == 2){
                if(this.loginRequired) str = 'Access denied.'
                else str = 'Unregistered email'
            }
            else if(this.status == 1) str = 'Logging in...'
            return str
        },
        message: function(){
            var msg = ''
            if(this.status == 2 || this.status == 0){
                msg = 'You are not currently logged in to a City of Lewisville account.'
                if(this.status == 2 && this.loginRequired) msg += ' Log in with a different account, or you will be redirected.'
                else if(this.status == 0 && this.loginRequired) msg += ' Please login to continue.'
            }
            if(this.status == 3){
                msg = 'You are logged in to the following City of Lewisville account:'
            }
            return msg
        },
    },


    created: function(){
        if(this.debug) console.log('\t\tLOGIN - Created');
    },
    mounted: function(){
        if(this.debug) console.log('\t\tLOGIN - Mounted');
        this.initialize();
    },
    beforeDestroy: function() { 
        if(this.debug) console.log('\t\tLOGIN - Destroy');
        // clear timeouts
        if(this.checkTimeout) clearTimeout(checkTimeout)
        if(this.redirectTimeout) clearTimeout(redirectTimeout)
    },


    methods: {
        routeChanged: function(){
            if(this.debug) console.log('\trouteChanged')
            this.initialize();
        },
        initialize: function(){
            var self = this
            if(this.debug) console.log('\tinitialize - ' + this.routeName + (this.routeParams ? ('\nparams: ' + JSON.stringify(this.routeParams)) : '') + (this.routeQuery ? ('\nquery: ' + this.routeQuery) : '') );
            if(this.routeName == 'Login'){
                this.authImmediate = true;
                this.$router.push({ path: '/account/' + this.requiredParam, query: this.routeQuery })
            }
            else{
                if(this.authImmediate){
                    if(this.debug) console.log('call immediately')
                    //this.callAuthenticate();
                }
                else{
                    this.dialog = true
                    if(this.debug) console.log('call on click')
                    this.checkStorage()
                }
            }
        },
        checkStorage: function(){
            var self = this
            if(sessionStorage.authChecked && localStorage.colAuthToken && localStorage.colEmail) this.status = 3
            else if(sessionStorage.authChecked && !(localStorage.colAuthToken && localStorage.colEmail)) this.status = 2
            else if(this.countCallAuth > 0){
                this.status = 1
                this.checkTimeout = setTimeout(self.checkStorage, 100)
            }
            else this.status = 0
        },
        callAuthenticate: function(){
            this.authImmediate = false
            this.countCallAuth++
            this.checkStorage()
            authenticate()
        },
        gotoRedirect: function(){
            this.$router.replace({ path: this.queryRedirect })
        },
        gotoFailRedirect: function(){
            this.$router.replace({ path: this.queryFailRedirect })
        },
        login: function(){
            sessionStorage.removeItem('authChecked');
            this.callAuthenticate()
        },
        switchUser: function(){
            this.$store.commit('logout');
            localStorage.removeItem('colEmail');
            localStorage.removeItem('colAuthToken');
            sessionStorage.removeItem('authChecked');
            this.login();
        },
        logout: function(){
            this.$store.commit('logout');
            localStorage.removeItem('colEmail');
            localStorage.removeItem('colAuthToken');
            sessionStorage.removeItem('authChecked');
        },
    }
}
</script>

<style scoped>
.pointy {
    cursor: pointer;
}
.card-title {
    font-size: 16px;
    padding: 8px 16px;
    display: block;
}
.card-subtitle {
    font-size: 12px;
    padding: 8px 16px;
    display: block;
}
.card-content .col {
    padding: 0;
}
.card-header {
    font-weight: 600;
    border-bottom: 1px solid rgba(0,0,0,0.2);
}
.card-text {
    margin-bottom: 8px;
}
.modal {
    max-width: 500px;
}
</style>
