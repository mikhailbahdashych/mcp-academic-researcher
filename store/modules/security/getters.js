export default {
  getTwofaCode: state => state.securityTwofaCode,
  getSecurityCodeError: state => state.securityCodeError,
  getSecurity2fa: state => state.securityTwofa,
  getSecurityCurrentPassword: state => state.securityCurrentPassword,
  getSecurityNewPassword: state => state.securityNewPassword,
  getSecurityNewPasswordRepeat: state => state.securityNewPasswordRepeat,
  getSecurityCurrentEmail: state => state.securityCurrentEmail,
  getSecurityNewEmail: state => state.securityNewEmail,
  getSecurityNewEmailRepeat: state => state.securityNewEmailRepeat,
  getSecurityShowModal: state => state.securityShowModal
}
