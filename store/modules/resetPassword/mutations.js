export default {
  setResetPasswordEmail(state, value) { state.resetPasswordEmail = value },
  setResetPasswordPhone(state, value) { state.resetPasswordPhone = value },
  setResetPasswordCode(state, value) { state.resetPasswordCode = value },
  setResetPasswordEmailError(state, value) { state.resetPasswordEmailError = value },
  setResetPasswordEmailFocus(state, value) { state.resetPasswordEmailFocus = value },
  setResetPasswordPhoneFocus(state, value) { state.resetPasswordPhoneFocus = value },
  setResetPasswordLoginWithEmail(state, value) { state.resetPasswordLoginWithEmail = value },
  setResetPasswordDefaultValues(state) {
    state.resetPasswordEmail = null
    state.resetPasswordPhone = null
    state.resetPasswordCode = null
    state.resetPasswordEmailError = false
    state.resetPasswordEmailFocus = false
    state.resetPasswordPhoneFocus = false
    state.resetPasswordLoginWithEmail = false
  }
}
