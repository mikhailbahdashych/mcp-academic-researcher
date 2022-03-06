import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  resetPasswordEmail: {
    email: null,
    emailError: false,
    emailFocus: false,
  },

  resetPasswordPhone: {
    phone: null,
    phoneFocus: false,
  },

  resetPasswordCode: null,
  resetPasswordLoginWithEmail: false
})

export default {
  state,
  mutations,
  getters,
  actions
}
