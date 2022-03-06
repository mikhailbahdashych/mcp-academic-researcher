const setParser = (state, statename, value) => {
  Object.entries(value).forEach(item => {
    Object.entries(state[statename]).forEach(modal => {
      if (item[0] === modal[0]) state[statename][item[0]] = item[1]
    })
  })
}

export default {
  setSecurity2fa(state, value) { setParser(state, 'securityTwofa', value) },
  setSecurityCurrentPassword(state, value) { state.securityCurrentPassword = value },
  setSecurityNewPassword(state, value) { state.securityNewPassword = value },
  setSecurityNewPasswordRepeat(state, value) { state.securityNewPasswordRepeat = value },
  setSecurityCurrentEmail(state, value) { state.securityCurrentEmail = value },
  setSecurityNewEmail(state, value) { state.securityNewEmail = value },
  setSecurityNewEmailRepeat(state, value) { state.securityNewEmailRepeat = value },
  setSecurityShowModal(state, value) { setParser(state, 'securityShowModal', value) },
  setSecurityDefaultValues(state) {
    state.securityTwofa = { code: null, qr: null, status: null, secret: null }
    state.securityCurrentPassword = null
    state.securityNewPassword = null
    state.securityNewPasswordRepeat = null
    state.securityCurrentEmail = null
    state.securityNewEmail = null
    state.securityNewEmailRepeat = null
    state.securityShowModal = {
      ga: false,
      sms: false,
      closingAccount: false,
      changeEmail: false,
      changeEmailSuccess: false,
      disable2fa: false
    }
  }
}
