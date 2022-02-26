export default {
  setSecurityCode(state, value) { state.code = value },
  setSecurityToken(state, value) { state.token = value },
  setSecurityTwoFaStatus(state, value) { state.twofaStatus = value },
  setSecurityCurrentPassword(state, value) { state.currentPassword = value },
  setSecurityNewPassword(state, value) { state.newPassword = value },
  setSecurityNewPasswordRepeat(state, value) { state.newPasswordRepeat = value },
  setSecurityCurrentEmail(state, value) { state.currentEmail = value },
  setSecurityNewEmail(state, value) { state.newEmail = value },
  setSecurityNewEmailRepeat(state, value) { state.newEmailRepeat = value },
  setSecurityDefaultValues(state) {
    state.code = null
    state.token = {}
    state.twofaStatus = {}
    state.currentPassword = null
    state.newPassword = null
    state.newPasswordRepeat = null
    state.currentEmail = null
    state.newEmail = null
    state.newEmailRepeat = null
  }
}
