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
      token: null
    },
    actions: {
      fetchLoading(ctx, value) { ctx.commit('setLoading', value) },
      fetchToken(ctx, value) { ctx.commit('setToken', value) }
    },
    mutations: {
      setLoading(state, value) { state.loading = value },
      setToken(state, value) { state.token = value }
    },
    getters: {
      getLoading: state => state.loading,
      getToken: state => state.token
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
