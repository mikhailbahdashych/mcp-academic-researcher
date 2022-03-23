import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  loginEmail: {
    email: null,
    loginWithEmail: null,
    emailFocus: false,
    loginEmailError: false,
  },
  loginPassword: {
    loginPasswordError: false,
    password: null,
  },
  loginPhone: {
    phoneFocus: false,
    phone: null,
  },
  loginError: false,
  twofa: null
})

export default {
  state,
  mutations,
  getters,
  actions
}
