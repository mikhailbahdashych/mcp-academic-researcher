export default {
  setSecurityCode(state, value) { state.securityCode = value },
  setSecurityToken(state, value) { state.securityToken = value },
  setSecurityTwoFaStatus(state, value) { state.securityTwofaStatus = value },
  setSecurityCurrentPassword(state, value) { state.securityCurrentPassword = value },
  setSecurityNewPassword(state, value) { state.securityNewPassword = value },
  setSecurityNewPasswordRepeat(state, value) { state.securityNewPasswordRepeat = value },
  setSecurityCurrentEmail(state, value) { state.securityCurrentEmail = value },
  setSecurityNewEmail(state, value) { state.securityNewEmail = value },
  setSecurityNewEmailRepeat(state, value) { state.securityNewEmailRepeat = value },
  setSecurityDefaultValues(state) {
    state.securityCode = null
    state.securityToken = { qr: 'asd', status: 'asd' }
    state.securityTwofaStatus = {}
    state.securityCurrentPassword = null
    state.securityNewPassword = null
    state.securityNewPasswordRepeat = null
    state.securityCurrentEmail = null
    state.securityNewEmail = null
    state.securityNewEmailRepeat = null
  }
}
