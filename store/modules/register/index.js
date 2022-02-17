import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  email: null,
  password: null,
  passwordRepeat: null,
  status: null,
  error: false,
  tac: false
})

export default {
  state,
  mutations,
  getters,
  actions
}
