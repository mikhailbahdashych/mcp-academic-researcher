import Vuex from 'vuex';
import register from './modules/register'
import login from './modules/login'

const createStore = () => {
  return new Vuex.Store({
    namespaced: true,
    modules: {
      register,
      login
    }
  })
}

export default createStore
