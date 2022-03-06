import { set2fa, verify2fa, changePassword, changeEmail, closeAccount, disable2fa } from "~/api";
import * as node2fa from 'node-2fa';

export default {
  fetchSecurity2fa(ctx, value) { ctx.commit('setSecurity2fa', value) },
  fetchSecurityPassword(ctx, value) { ctx.commit('setSecurityPassword', value) },
  fetchSecurityEmail(ctx, value) { ctx.commit('setSecurityEmail', value) },
  fetchSecurityShowModal(ctx, value) { ctx.commit('setSecurityShowModal', value) },

  fetchGenerate2fa(ctx, { name, account }) {
    const { qr, secret } = node2fa.generateSecret({ name, account })
    ctx.commit('setSecurity2fa', { secret, qr })
  },

  async fetchCheck2fa(ctx, value) {
    const { status } = await verify2fa(value)
    ctx.commit('setSecurity2fa', { status })
  },

  async fetchSet2fa(ctx, value) { ctx.commit('setSecurity2fa', await set2fa(value)) },

  async fetchDisable2fa(ctx, value) {
    const { status } = await disable2fa(value)
    ctx.commit('setSecurity2fa', { status })
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
