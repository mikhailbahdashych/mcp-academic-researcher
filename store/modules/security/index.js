import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  securityCode: null,
  securityCodeError: null,
  securityToken: { qr: null, status: null },
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
