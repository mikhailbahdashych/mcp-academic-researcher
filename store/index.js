import Vuex from 'vuex';
import register from './modules/register'

const createStore = () => {
  return new Vuex.Store({
    namespaced: true,
    modules: {
      register
    }
  })
}

export default createStore
