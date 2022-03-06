export default {
  fetchResetPasswordEmail(ctx, value) { ctx.commit('setResetPasswordEmail', value) },
  fetchResetPasswordPhone(ctx, value) { ctx.commit('setResetPasswordPhone', value) },
  fetchResetPasswordCode(ctx, value) { ctx.commit('setResetPasswordCode', value) },
  fetchResetPasswordLoginWithEmail(ctx, value) { ctx.commit('setResetPasswordLoginWithEmail', value) },
  fetchResetPasswordEmailFocusLogin(ctx, value) { ctx.commit('setResetPasswordEmailFocusLogin', value) },
  fetchResetPasswordPhoneFocusLogin(ctx, value) { ctx.commit('setResetPasswordPhoneFocusLogin', value) }
}
