export default {
  setTwofaCode(state, value) { state.twofaCode = value },
  setSecurityCodeError(state, value) { state.securityCodeError = value },
  set2fa(state, value) { state.twofa = value },
  setSecurityCurrentPassword(state, value) { state.securityCurrentPassword = value },
  setSecurityNewPassword(state, value) { state.securityNewPassword = value },
  setSecurityNewPasswordRepeat(state, value) { state.securityNewPasswordRepeat = value },
  setSecurityCurrentEmail(state, value) { state.securityCurrentEmail = value },
  setSecurityNewEmail(state, value) { state.securityNewEmail = value },
  setSecurityNewEmailRepeat(state, value) { state.securityNewEmailRepeat = value },
  setSecurityDefaultValues(state) {
    state.twofaCode = null
    state.securityCodeError = { status: null }
    state.twofa = { qr: null, status: null, secret: null }
    state.securityTwofaStatus = {}
    state.securityCurrentPassword = null
    state.securityNewPassword = null
    state.securityNewPasswordRepeat = null
    state.securityCurrentEmail = null
    state.securityNewEmail = null
    state.securityNewEmailRepeat = null
  }
}
