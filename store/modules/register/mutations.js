import { setParser } from "~/helpers/frontValidators";

export default {
  setEmail(state, value) { setParser(state, 'email', value) },
  setPassword(state, value) { setParser(state, 'password', value) },

  setStatus(state, value) { state.status = value },
  setError(state, value) { state.error = value },
  setTac(state, value) { state.tac = value },

  setPasswordError(state, value) { setParser(state, 'passwordError', value) },
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
    state.email = {
      email: null,
      emailError: false
    }
    state.password = {
      password: null,
      passwordRepeat: null,
    }
    state.status = null
    state.tac = false
    state.error = false
    state.passwordError = {
      passwordMismatch: false,
      passwordRequirement: false,
      passwordRules: false
    }
    state.passwordRulesList = [
      {text: 'Password length should be more than 8 characters', eightChars: false},
      {text: 'Password should contain at least one uppercase character', uppCase: false},
      {text: 'Password should contain at least one lowercase character', lowCase: false},
      {text: 'Password should contain at least one special character', specChar: false},
      {text: 'Password should contain at least one digit character', digitChar: false}
    ]
  }
}
