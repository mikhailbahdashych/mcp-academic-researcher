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
      clientData: {}
    },
    actions: {
      fetchLoading(ctx, value) { ctx.commit('setLoading', value) },
      fetchClientData(ctx, value) { ctx.commit('setClientData', value) }
    },
    mutations: {
      setLoading(state, value) { state.loading = value },
      setClientData(state, value) { state.clientData = value }
    },
    getters: {
      getLoading: state => state.loading,
      getClientData: state => state.clientData
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
