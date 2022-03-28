// @TODO Here, in, probably store, I should write data about 2FA, phone etc.
// Or start think about cookie staff
// UPD. Ok, seems like half of it is done, so, next, I think, I should make such staff:
// 1) remove those endpoints in second todos
// 2) Maybe do something to make it store only one time, not to make a lot of requests
// 3) Think something about redirect staff
import { getClientByToken } from "~/api/account";

export const verifyClientByToken = async (router, token) => {
  if (!token) return await router.push({ path: '/' })

  const client = await getClientByToken({ token })

  if (!client || client.status === -1) {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    return await router.push({ path: '/' })
  }

  return client
}
