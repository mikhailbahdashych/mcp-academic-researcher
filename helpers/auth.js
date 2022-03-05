import { verifyToken } from "@/api";
import createStore from "~/store";

export const verifyUserToken = async (router) => {
  if (!localStorage.getItem('token')) {
    console.log(createStore().getters.getToken)
    return await router.push({path: '/login'})
  }

  const checkToken = await verifyToken({ token: localStorage.getItem('token') })

  if (checkToken.status !== -1) return

  localStorage.removeItem('token')
  await router.push({path: '/login'})
}
