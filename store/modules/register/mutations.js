export default {
  setEmail(state, value) { state.email = value },
  setPassword(state, value) { state.password = value },
  setPasswordRepeat(state, value) { state.passwordRepeat = value },
  setStatus(state, value) { state.status = value },
  setError(state, value) { state.error = value },
  setEmailError(state, value) { state.emailError = value },
  setTac(state, value) { state.tac = value },
  setPasswordError(state, value) { state.passwordError[value.key] = value.value },
}
