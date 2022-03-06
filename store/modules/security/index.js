import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  securityTwofaCode: null,
  securityCodeError: { status: null },
  // @TODO DO SOME REFACTOR HERE
  securityTwofa: { qr: null, status: null, secret: null },
  securityCurrentPassword: null,
  securityNewPassword: null,
  securityNewPasswordRepeat: null,
  securityCurrentEmail: null,
  securityNewEmail: null,
  securityNewEmailRepeat: null,
  securityShowModal: {
    ga: false,
    sms: false,
    closingAccount: false,
    changeEmail: false,
    changeEmailSuccess: false,
    disable2fa: false
  },
})

export default {
  state,
  mutations,
  getters,
  actions
}
