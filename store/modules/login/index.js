import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  loginEmail: null,
  loginPhone: null,
  loginPassword: null,
  loginWithEmail: null,
  emailFocus: false,
  phoneFocus: false
})

export default {
  state,
  mutations,
  getters,
  actions
}
