import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  email: null,
  password: null,
  passwordRepeat: null,
  status: null,
  tac: false,
  emailError: false,
  error: false,
  passwordError: {
    passwordMismatch: false,
    passwordRequirement: false,
    passwordRules: false
  },
})

export default {
  state,
  mutations,
  getters,
  actions
}
