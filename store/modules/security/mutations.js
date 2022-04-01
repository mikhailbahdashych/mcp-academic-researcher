import { setParser } from "~/helpers/frontValidators";

export default {
  setSecurity2fa(state, value) { setParser(state, 'securityTwofa', value) },
  setSecurityPassword(state, value) { setParser(state, 'securityPassword', value) },
  setSecurityEmail(state, value) { setParser(state, 'securityEmail', value) },
  setSecurityShowModal(state, value) { setParser(state, 'securityShowModal', value) },
  setSecurityDefaultValues(state) {
    state.securityTwofa = { code: [], qr: null, status: null, secret: null }
    state.securityPassword = {
      currentPassword: null,
      newPassword: null,
      newPasswordRepeat: null,
      error: false
    }
    state.securityEmail = {
      currentEmail: null,
      newEmail: null,
      newEmailRepeat: null
    }
    state.securityShowModal = {
      ga: false,
      sms: false,
      closingAccount: false,
      changeEmail: false,
      changePassword: false,
      disable2fa: false,
      freezeAccount: false,
      twofa: false
    }
  }
}
