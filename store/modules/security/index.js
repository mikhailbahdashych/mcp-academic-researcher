import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  twofaCode: null,
  securityCodeError: { status: null },
  // @TODO DO SOME REFACTOR HERE
  twofa: { qr: null, status: null, secret: null },
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
