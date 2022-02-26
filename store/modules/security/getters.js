export default {
  getSecurityCode: state => state.securityCode,
  getSecurityCodeError: state => state.securityCodeError,
  getSecurityToken: state => state.securityToken,
  getSecurityCurrentPassword: state => state.securityCurrentPassword,
  getSecurityNewPassword: state => state.securityNewPassword,
  getSecurityNewPasswordRepeat: state => state.securityNewPasswordRepeat,
  getSecurityCurrentEmail: state => state.securityCurrentEmail,
  getSecurityNewEmail: state => state.securityNewEmail,
  getSecurityNewEmailRepeat: state => state.securityNewEmailRepeat,
}
