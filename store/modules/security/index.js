import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  securityCode: null,
  securityCodeError: null,
  twofa: { qr: null, status: null },
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
