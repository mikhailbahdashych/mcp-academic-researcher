import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  securityCode: null,
  securityToken: {},
  securityTwofaStatus: {},
  securityCurrentPassword: null,
  securityNewPassword: null,
  securityNewPasswordRepeat: null,
  securityCurrentEmail: null,
  securityNewEmail: null,
  securityNewEmailRepeat: null
})

export default {
  state,
  mutations,
  getters,
  actions
}
