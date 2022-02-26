export default {
  getSecurityCode: state => state.code,
  getSecurityToken: state => state.token,
  getSecurityTwoFaStatus: state => state.twofaStatus,
  getSecurityCurrentPassword: state => state.currentPassword,
  getSecurityNewPassword: state => state.newPassword,
  getSecurityNewPasswordRepeat: state => state.newPasswordRepeat,
  getSecurityCurrentEmail: state => state.currentEmail,
  getSecurityNewEmail: state => state.newEmail,
  getSecurityNewEmailRepeat: state => state.newEmailRepeat,
}
