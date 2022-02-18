import actions from "./actions";
import getters from "./getters";
import mutations from "./mutations";

const state = () => ({
  resetPasswordEmail: null,
  resetPasswordPhone: null,
  resetPasswordCode: null
})

export default {
  state,
  mutations,
  getters,
  actions
}
