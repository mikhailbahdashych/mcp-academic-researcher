import Vuex from 'vuex';
import register from './modules/register'
import login from './modules/login'
import resetPassword from './modules/resetPassword'
import security from "./modules/security";

const createStore = () => {
  return new Vuex.Store({
    namespaced: true,
    state: { loading: false },
    actions: { fetchLoading(ctx, value) { ctx.commit('setLoading', value) } },
    mutations: { setLoading(state, value) { state.loading = value } },
    modules: {
      register,
      login,
      resetPassword,
      security
    }
  })
}

export default createStore
