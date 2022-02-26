export default {
  fetchSecurityCode(ctx, value) { ctx.commit('setSecurityCode', value) },
  fetchSecurityToken(ctx, value) { ctx.commit('setSecurityToken', value) },
  fetchSecurityTwoFaStatus(ctx, value) { ctx.commit('setSecurityTwoFaStatus', value) },
  fetchSecurityCurrentPassword(ctx, value) { ctx.commit('setSecurityCurrentPassword', value) },
  fetchSecurityNewPassword(ctx, value) { ctx.commit('setSecurityNewPassword', value) },
  fetchSecurityNewPasswordRepeat(ctx, value) { ctx.commit('setSecurityNewPasswordRepeat', value) },
  fetchSecurityCurrentEmail(ctx, value) { ctx.commit('setSecurityCurrentEmail', value) },
  fetchSecurityNewEmail(ctx, value) { ctx.commit('setSecurityNewEmail', value) },
  fetchSecurityNewEmailRepeat(ctx, value) { ctx.commit('setSecurityNewEmailRepeat', value) },
}
