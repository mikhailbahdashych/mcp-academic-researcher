import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  securityTwofa: { code: [], qr: null, status: null, secret: null },
  securityPassword: {
    currentPassword: null,
    newPassword: null,
    newPasswordRepeat: null
  },
  securityEmail: {
    email: null,
    currentEmail: null,
    newEmail: null,
    newEmailRepeat: null,
    currentEmailError: false,
    newEmailError: false,
    newEmailRepeatError: false
  },
  securityShowModal: {
    ga: false,
    sms: false,
    closingAccount: false,
    changeEmail: false,
    changePassword: false,
    disable2fa: false,
    freezeAccount: false,
    twofa: false,
  },
  securityOptions: [
    { title: 'Login password', text: 'Used for account login', buttonTitle: 'Change password', showModalParam: 'changePassword' },
    { title: 'Login email', text: 'Used for account login. Be careful, you are able to change email only one time.', buttonTitle: 'Change email', showModalParam: 'changeEmail' },
    { title: 'Google Authenticator', text: 'Used from the verification in account actions, etc. Could be switched to phone verification.', buttonTitle: 'Set 2FA', showModalParam: 'ga' },
    { title: 'Phone', text: 'Used from the verification in account actions, etc. Could be switched to Google Authenticator verification.', buttonTitle: 'Confirm phone', showModalParam: 'sms' },
    { title: 'Freeze account', text: 'When this feature is enabled, your account\'s activity will be stopped. You may apply to unfreeze your account the next time you log in.', buttonTitle: 'Freeze account', showModalParam: 'freezeAccount' },
    { title: 'Close account', text: 'All account data will be removed without opportunity of recovering!', buttonTitle: 'Close account', showModalParam: 'closingAccount' },
  ]
})

export default {
  state,
  mutations,
  getters,
  actions
}
