import { verifyToken } from "@/api";

export const verifyUserToken = async (router) => {
  // @TODO DO SOMETHING WITH LOCALSTORAGE
  if (!localStorage.getItem('token')) return await router.push({path: '/login'})

  const checkToken = await verifyToken({ token: localStorage.getItem('token') })

  if (checkToken.status !== -1) return

  localStorage.removeItem('token')
  await router.push({path: '/login'})
}
