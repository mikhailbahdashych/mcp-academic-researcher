import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  resetPasswordEmail: null,
  resetPasswordPhone: null,
  resetPasswordCode: null,
  resetPasswordEmailError: false,
  resetPasswordEmailFocus: false,
  resetPasswordPhoneFocus: false,
  resetPasswordLoginWithEmail: false
})

export default {
  state,
  mutations,
  getters,
  actions
}
