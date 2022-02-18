export default {
  setLoginEmail(state, value) { state.loginEmail = value },
  setLoginPhone(state, value) { state.loginPhone = value },
  setLoginPassword(state, value) { state.loginPassword = value },
  setLoginWithEmail(state, value) { state.loginWithEmail = value },
  setEmailFocus(state, value) { state.emailFocus = value },
  setPhoneFocus(state, value) { state.phoneFocus = value },
  setLoginPasswordError(state, value) { state.loginPasswordError = value },
  setLoginEmailError(state, value) { state.loginEmailError = value },
  setLoginError(state, value) { state.loginError = value }
}
