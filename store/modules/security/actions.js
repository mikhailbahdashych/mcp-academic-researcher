import { set2fa, verify2fa, changePassword, changeEmail, closeAccount, disable2fa } from "~/api";
import * as node2fa from 'node-2fa';

export default {
  fetchSecurityTwofaCode(ctx, value) { ctx.commit('setSecurityTwofaCode', value) },
  fetchSecurityCodeError(ctx, value) { ctx.commit('setSecurityCodeError', value) },
  fetchSecurity2fa(ctx, value) { ctx.commit('setSecurity2fa', value) },
  fetchSecurityCurrentPassword(ctx, value) { ctx.commit('setSecurityCurrentPassword', value) },
  fetchSecurityNewPassword(ctx, value) { ctx.commit('setSecurityNewPassword', value) },
  fetchSecurityNewPasswordRepeat(ctx, value) { ctx.commit('setSecurityNewPasswordRepeat', value) },
  fetchSecurityCurrentEmail(ctx, value) { ctx.commit('setSecurityCurrentEmail', value) },
  fetchSecurityNewEmail(ctx, value) { ctx.commit('setSecurityNewEmail', value) },
  fetchSecurityNewEmailRepeat(ctx, value) { ctx.commit('setSecurityNewEmailRepeat', value) },
  fetchSecurityShowModal(ctx, value) { ctx.commit('setSecurityShowModal', value) },

  fetchGenerate2fa(ctx, { name, account }) {
    const { qr, secret } = node2fa.generateSecret({ name, account })
    ctx.commit('setSecurity2fa', { secret, qr, status: null })
  },

  async fetchCheck2fa(ctx, value) {
    const { status } = await verify2fa(value)
    ctx.commit('setSecurity2fa', { secret: null, qr: null, status })
  },

  async fetchSet2fa(ctx, value) {
    ctx.commit('setSecurityCodeError', await set2fa(value))
  },

  async fetchDisable2fa(ctx, value) {

  },

  async fetchChangePassword(ctx, value) {
    const { status } = await changePassword(value)
    if (status === 1) {
      localStorage.removeItem('token')
      await this.$router.push({ path: '/' })
    }
  },

  async fetchChangeEmail(ctx, value) {
    const { status } = await changeEmail(value)
    if (status === 1) {
      localStorage.removeItem('token')
      await this.$router.push({ path: '/' })
    }
  },

  async fetchCloseAccount(ctx, value) {
    const { status } = await closeAccount(value)
    if (status === 1) {
      localStorage.removeItem('token')
      await this.$router.push({ path: '/' })
    }
  }
}
