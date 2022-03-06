import { setParser } from "~/helpers/frontValidators";

export default {
  setResetPasswordEmail(state, value) { setParser(state, 'resetPasswordEmail', value) },
  setResetPasswordPhone(state, value) { setParser(state, 'resetPasswordPhone', value
  ) },
  setResetPasswordCode(state, value) { state.resetPasswordCode = value },
  setResetPasswordLoginWithEmail(state, value) { state.resetPasswordLoginWithEmail = value },
  setResetPasswordDefaultValues(state) {
    state.resetPasswordEmail = {
      email: null,
      emailError: false,
      emailFocus: false
    }
    state.resetPasswordPhone = {
      phone: null,
      phoneFocus: false,
    }
    state.resetPasswordCode = null
    state.resetPasswordLoginWithEmail = false
  },
  setResetPasswordEmailFocusLogin(state) {
    state.resetPasswordLoginWithEmail = true
    state.resetPasswordEmail = {
      email: null,
      emailError: false,
      emailFocus: true
    }
    state.resetPasswordPhone = {
      phone: null,
      phoneFocus: false,
    }
  },
  setResetPasswordPhoneFocusLogin(state) {
    state.resetPasswordLoginWithEmail = false
    state.resetPasswordEmail = {
      email: null,
      emailError: false,
      emailFocus: false
    }
    state.resetPasswordPhone = {
      phone: null,
      phoneFocus: true,
    }
  }
}
