import { getClientByToken } from "@/api/account";

export const verifyClientByToken = async (router, token, returnclient = false, nonRedirect = false) => {
  if (!nonRedirect) {
    if (!token) return await router.push({ path: '/' })

    const client = await getClientByToken({ token })

    if (!client || client.status === -1) {
      localStorage.removeItem('token')
      localStorage.removeItem('email')
      return await router.push({ path: '/' })
    }

    if (returnclient) return client
    else return { status: 1 }
  } else {
    if (token) {
      const client = await getClientByToken({ token })
      if (client || client.status !== -1) return await router.push({ path: '/account' })
    }
  }
}
