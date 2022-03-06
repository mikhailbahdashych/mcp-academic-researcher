const setParser = (state, statename, value) => {
  Object.entries(value).forEach(item => {
    Object.entries(state[statename]).forEach(modal => {
      if (item[0] === modal[0]) state[statename][item[0]] = item[1]
    })
  })
}

export default {
  setSecurity2fa(state, value) { setParser(state, 'securityTwofa', value) },
  setSecurityPassword(state, value) { setParser(state, 'securityPassword', value) },
  setSecurityEmail(state, value) { setParser(state, 'securityEmail', value) },
  setSecurityShowModal(state, value) { setParser(state, 'securityShowModal', value) },
  setSecurityDefaultValues(state) {
    state.securityTwofa = { code: null, qr: null, status: null, secret: null }
    state.securityPassword = {
      currentPassword: null,
      newPassword: null,
      newPasswordRepeat: null
    }
    state.securityEmail = {
      currentEmail: null,
      newEmail: null,
      newEmailRepeat: null
    }
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
