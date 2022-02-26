import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  code: null,
  token: {},
  twofaStatus: {},
  currentPassword: null,
  newPassword: null,
  newPasswordRepeat: null,
  currentEmail: null,
  newEmail: null,
  newEmailRepeat: null
})

export default {
  state,
  mutations,
  getters,
  actions
}
