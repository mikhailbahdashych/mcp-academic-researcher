export default {
  fetchLoginEmail(ctx, value) { ctx.commit('setLoginEmail', value) },
  fetchLoginPhone(ctx, value) { ctx.commit('setLoginPhone', value) },
  fetchLoginPassword(ctx, value) { ctx.commit('setLoginPassword', value) },
  fetchLoginWithEmail(ctx, value) { ctx.commit('setLoginWithEmail', value) },
  fetchEmailFocus(ctx, value) { ctx.commit('setEmailFocus', value) },
  fetchPhoneFocus(ctx, value) { ctx.commit('setPhoneFocus', value) },
}
