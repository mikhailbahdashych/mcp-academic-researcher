import { getClientByToken } from "~/api";

export const getUserByToken = async (router, token, returnUser = false) => {
  if (!token) return await router.push({ path: '/' })

  const user = await getClientByToken({ token })

  if (!user || user.status === -1) {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    return await router.push({path: '/'})
  }

  if (returnUser) return user
  else return { status: 1 }
}
