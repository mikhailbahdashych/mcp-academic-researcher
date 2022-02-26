import Vuex from 'vuex';
import register from './modules/register'
import login from './modules/login'
import resetPassword from './modules/resetPassword'
import security from "./modules/security";

const createStore = () => {
  return new Vuex.Store({
    namespaced: true,
    modules: {
      register,
      login,
      resetPassword,
      security
    }
  })
}

export default createStore
