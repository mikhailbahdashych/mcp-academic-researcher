import { set2fa, verify2fa, changePassword, changeEmail, closeAccount } from "~/api";
import * as node2fa from 'node-2fa';

export default {
  fetchSecurityCode(ctx, value) { ctx.commit('setSecurityCode', value) },
  fetchSecurityCodeError(ctx, value) { ctx.commit('setSecurityCodeError', value) },
  fetch2fa(ctx, value) { ctx.commit('set2fa', value) },
  fetchSecurityCurrentPassword(ctx, value) { ctx.commit('setSecurityCurrentPassword', value) },
  fetchSecurityNewPassword(ctx, value) { ctx.commit('setSecurityNewPassword', value) },
  fetchSecurityNewPasswordRepeat(ctx, value) { ctx.commit('setSecurityNewPasswordRepeat', value) },
  fetchSecurityCurrentEmail(ctx, value) { ctx.commit('setSecurityCurrentEmail', value) },
  fetchSecurityNewEmail(ctx, value) { ctx.commit('setSecurityNewEmail', value) },
  fetchSecurityNewEmailRepeat(ctx, value) { ctx.commit('setSecurityNewEmailRepeat', value) },

  fetchGenerate2fa(ctx, value) {
    const { qr } = node2fa.generateSecret({ name: value.name, account: value.email })
    ctx.commit('set2fa', { qr, status: null })
  },

  async fetchSet2fa(ctx, value) {
    ctx.commit('setSecurityCodeError', await set2fa(value))
  },

  async fetchCheck2fa(ctx, value) {
    const response = await verify2fa(value)
    ctx.commit('set2fa', { value: response.status, key: 'status' })
  },

  async fetchChangePassword(ctx, value) {
    const response = await changePassword(value)
    if (response.status === 1) {
      localStorage.removeItem('token')
      await this.$router.push({ path: '/' })
    }
  },

  async fetchChangeEmail(ctx, value) {
    const response = await changeEmail(value)
    if (response.status === 1) {
      localStorage.removeItem('token')
      await this.$router.push({ path: '/' })
    }
  },

  async fetchCloseAccount(ctx, value) {
    const response = await closeAccount(value)
    if (response.status === 1) {
      localStorage.removeItem('token')
      await this.$router.push({ path: '/' })
    }
  }
}
