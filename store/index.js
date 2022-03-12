import Vuex from 'vuex';
import register from './modules/register'
import login from './modules/login'
import resetPassword from './modules/resetPassword'
import security from "./modules/security";

const createStore = () => {
  return new Vuex.Store({
    namespaced: true,
    state: {
      loading: false,
      emailStore: null
    },
    actions: {
      fetchLoading(ctx, value) { ctx.commit('setLoading', value) },
      fetchEmailStore(ctx, value) { ctx.commit('setEmailStore', value) },
    },
    mutations: {
      setLoading(state, value) { state.loading = value },
      setEmailStore(state, value) { state.emailStore = value }
    },
    getters: {
      getLoading: state => state.loading,
      getEmailStore: state => state.emailStore
    },
    modules: {
      register,
      login,
      resetPassword,
      security
    }
  })
}

export default createStore
