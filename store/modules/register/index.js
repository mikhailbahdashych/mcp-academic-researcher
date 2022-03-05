import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  email: null,
  password: null,
  passwordRepeat: null,
  status: null,
  tac: false,
  emailError: false,
  error: false,
  passwordError: {
    passwordMismatch: false,
    passwordRequirement: false,
    passwordRules: false
  },
  passwordRulesList: [
    {eightChars: false, text: 'Password length should be more than 8 characters'},
    {uppCase: false, text: 'Password should contain at least one uppercase character'},
    {lowCase: false, text: 'Password should contain at least one lowercase character'},
    {specChar: false, text: 'Password should contain at least one special character'},
    {digitChar: false, text: 'Password should contain at least one digit character'}
  ]
})

export default {
  state,
  mutations,
  getters,
  actions
}
