export default {
  fetchLoginEmail(ctx, value) { ctx.commit('setLoginEmail', value) },
  fetchLoginPhone(ctx, value) { ctx.commit('setLoginPhone', value) },
  fetchLoginPassword(ctx, value) { ctx.commit('setLoginPassword', value) },
  fetchLoginError(ctx, value) { ctx.commit('setLoginError', value) },
  fetchEmailFocusLogin(ctx, value) { ctx.commit('setEmailFocusLogin', value) },
  fetchPhoneFocusLogin(ctx, value) { ctx.commit('setPhoneFocusLogin', value) }
}
