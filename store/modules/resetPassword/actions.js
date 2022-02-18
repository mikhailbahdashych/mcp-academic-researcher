export default {
  fetchResetPasswordEmail(ctx, value) { ctx.commit('setResetPasswordEmail', value) },
  fetchResetPasswordPhone(ctx, value) { ctx.commit('setResetPasswordPhone', value) },
  fetchResetPasswordCode(ctx, value) { ctx.commit('setResetPasswordCode', value) },
}
