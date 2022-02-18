export default {
  fetchResetPasswordEmail(ctx, value) { ctx.commit('setResetPasswordEmail', value) },
  fetchResetPasswordPhone(ctx, value) { ctx.commit('setResetPasswordPhone', value) },
  fetchResetPasswordCode(ctx, value) { ctx.commit('setResetPasswordCode', value) },
  fetchResetPasswordEmailError(ctx, value) { ctx.commit('setResetPasswordEmailError', value) },
  fetchResetPasswordEmailFocus(ctx, value) { ctx.commit('setResetPasswordEmailFocus', value) },
  fetchResetPasswordPhoneFocus(ctx, value) { ctx.commit('setResetPasswordPhoneFocus', value) },
  fetchResetPasswordLoginWithEmail(ctx, value) { ctx.commit('setResetPasswordLoginWithEmail', value) }
}
