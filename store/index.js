import Vuex from 'vuex';
import register from './modules/register'
import login from './modules/login'
import resetPassword from './modules/resetPassword'

const createStore = () => {
  return new Vuex.Store({
    namespaced: true,
    modules: {
      register,
      login,
      resetPassword
    }
  })
}

export default createStore
