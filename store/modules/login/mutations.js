import { setParser } from "~/helpers/frontValidators";

export default {
  setLoginEmail(state, value) { setParser(state, 'loginEmail', value) },
  setLoginPhone(state, value) { setParser(state, 'loginPhone', value) },
  setLoginPassword(state, value) { setParser(state, 'loginPassword', value) },
  setLoginError(state, value) { state.loginError = value },
  setLoginDefaultValues(state) {
    state.loginEmail = {
      email: null,
      loginWithEmail: null,
      emailFocus: false,
      loginEmailError: false,
    }
    state.loginPhone = {
      phoneFocus: false,
      phone: null,
    }
    state.loginPassword = {
      loginPasswordError: false,
      password: null,
    }
    state.loginError = false
  },
}
