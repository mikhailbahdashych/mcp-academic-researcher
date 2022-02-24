import { verifyToken } from "@/api";

export const verifyUserToken = async (router) => {
  if (!localStorage.getItem('token')) {
    await router.push({path: '/login'})
  } else {
    const checkToken = await verifyToken({ token: localStorage.getItem('token') })
    if (checkToken.error) {
      localStorage.removeItem('token')
      await router.push({path: '/login'})
    }
  }
}
