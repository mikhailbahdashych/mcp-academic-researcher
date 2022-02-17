import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  email: null,
  password: null,
  passwordRepeat: null,
  status: null,
  tac: false,
  passwordError: false,
  emailError: false,
  error: false
})

export default {
  state,
  mutations,
  getters,
  actions
}
