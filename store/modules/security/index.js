import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  securityTwofa: { code: null, qr: null, status: null, secret: null },
  securityPassword: {
    currentPassword: null,
    newPassword: null,
    newPasswordRepeat: null
  },
  securityEmail: {
    email: null,
    currentEmail: null,
    newEmail: null,
    newEmailRepeat: null,
    currentEmailError: false,
    newEmailError: false,
    newEmailRepeatError: false
  },
  securityShowModal: {
    ga: false,
    sms: false,
    closingAccount: false,
    changeEmail: false,
    changePassword: false,
    disable2fa: false
  },
})

export default {
  state,
  mutations,
  getters,
  actions
}
