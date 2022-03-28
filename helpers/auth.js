// @TODO Here, in, probably store, I should write data about 2FA, phone etc.
// Or start think about cookie staff
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
