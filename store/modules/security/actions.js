import { set2fa } from "~/api";

export default {
  fetchSecurityCode(ctx, value) { ctx.commit('setSecurityCode', value) },
  fetchSecurityCodeError(ctx, value) { ctx.commit('setSecurityCodeError', value) },
  fetchSecurityToken(ctx, value) { ctx.commit('setSecurityToken', value) },
  fetchSecurityTwoFaStatus(ctx, value) { ctx.commit('setSecurityTwoFaStatus', value) },
  fetchSecurityCurrentPassword(ctx, value) { ctx.commit('setSecurityCurrentPassword', value) },
  fetchSecurityNewPassword(ctx, value) { ctx.commit('setSecurityNewPassword', value) },
  fetchSecurityNewPasswordRepeat(ctx, value) { ctx.commit('setSecurityNewPasswordRepeat', value) },
  fetchSecurityCurrentEmail(ctx, value) { ctx.commit('setSecurityCurrentEmail', value) },
  fetchSecurityNewEmail(ctx, value) { ctx.commit('setSecurityNewEmail', value) },
  fetchSecurityNewEmailRepeat(ctx, value) { ctx.commit('setSecurityNewEmailRepeat', value) },
  async fetchSet2fa(ctx, value) {
    const response = await set2fa(value)
    ctx.commit('setSecurityCodeError', response)
  }
}
