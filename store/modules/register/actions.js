export default {
  fetchEmail(ctx, value) { ctx.commit('setEmail', value) },
  fetchPassword(ctx, value) { ctx.commit('setPassword', value) },
  fetchStatus(ctx, value) { ctx.commit('setStatus', value) },
  fetchError(ctx, value) { ctx.commit('setError', value) },
  fetchPasswordError(ctx, value) { ctx.commit('setPasswordError', value) },
  fetchTac(ctx, value) { ctx.commit('setTac', value) },
  fetchPasswordRulesList(ctx, value) { ctx.commit('setPasswordRulesList', value) },
}
