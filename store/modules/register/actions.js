export default {
  fetchEmail(ctx, value) { ctx.commit('setEmail', value) },
  fetchPassword(ctx, value) { ctx.commit('setPassword', value) },
  fetchPasswordRepeat(ctx, value) { ctx.commit('setPasswordRepeat', value) },
  fetchStatus(ctx, value) { ctx.commit('setStatus', value) },
  fetchError(ctx, value) { ctx.commit('setError', value) },
  fetchTac(ctx, value) { ctx.commit('setTac', value) },
}
