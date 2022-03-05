export default {
  setEmail(state, value) { state.email = value },
  setPassword(state, value) { state.password = value },
  setPasswordRepeat(state, value) { state.passwordRepeat = value },
  setStatus(state, value) { state.status = value },
  setError(state, value) { state.error = value },
  setEmailError(state, value) { state.emailError = value },
  setTac(state, value) { state.tac = value },
  setPasswordError(state, value) { state.passwordError[value.key] = value.value },
  setPasswordRulesList(state, value) {
    Object.entries(value).forEach(item => {
      state.passwordRulesList.forEach(rule => {
        Object.entries(rule).forEach(x => {
          if (item[0] === x[0]) rule[item[0]] = item[1]
        })
      })
    })
  },
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
    state.passwordRulesList = [
      {eightChars: false, text: 'Password length should be more than 8 characters'},
      {uppCase: false, text: 'Password should contain at least one uppercase character'},
      {lowCase: false, text: 'Password should contain at least one lowercase character'},
      {specChar: false, text: 'Password should contain at least one special character'},
      {digitChar: false, text: 'Password should contain at least one digit character'}
    ]
  }
}
