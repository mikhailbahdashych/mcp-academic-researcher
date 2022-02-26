export default {
  setEmail(state, value) { state.email = value },
  setPassword(state, value) { state.password = value },
  setPasswordRepeat(state, value) { state.passwordRepeat = value },
  setStatus(state, value) { state.status = value },
  setError(state, value) { state.error = value },
  setEmailError(state, value) { state.emailError = value },
  setTac(state, value) { state.tac = value },
  setPasswordError(state, value) { state.passwordError[value.key] = value.value },
  setPasswordRulesList(state, value) { state.passwordRulesList = value },
  setDefaultValues(state) {
    state.email = null
    state.password = null
    state.passwordRepeat = null
    state.status = null
    state.tac = false
    state.emailError = false
    state.error = false
    state.passwordError = {
      passwordMismatch: false,
      passwordRequirement: false,
      passwordRules: false
    }
    state.passwordRulesList = {
      eightChars: false,
      uppCase: false,
      lowCase: false,
      specChar: false,
      digitChar: false
    }
  }
}
