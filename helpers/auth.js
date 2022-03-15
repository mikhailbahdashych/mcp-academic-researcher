import { getClientByToken } from "~/api";

export const getUserByToken = async (router, token) => {
  if (!localStorage.getItem('token')) return await router.push({ path: '/' })

  const user = await getClientByToken({ token })

  if (!user) return await router.push({ path: '/' })

  return user
}
