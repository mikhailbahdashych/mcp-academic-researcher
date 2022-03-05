export default {
  getSecurityCode: state => state.securityCode,
  getSecurityCodeError: state => state.securityCodeError,
  get2fa: state => state.twofa,
  getSecurityCurrentPassword: state => state.securityCurrentPassword,
  getSecurityNewPassword: state => state.securityNewPassword,
  getSecurityNewPasswordRepeat: state => state.securityNewPasswordRepeat,
  getSecurityCurrentEmail: state => state.securityCurrentEmail,
  getSecurityNewEmail: state => state.securityNewEmail,
  getSecurityNewEmailRepeat: state => state.securityNewEmailRepeat,
}
