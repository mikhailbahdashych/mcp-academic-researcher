import { verifyToken } from "~/api";
import createStore from "~/store";

export const verifyUserToken = async (router) => {
  if (!localStorage.getItem('token')) {
    createStore().commit('setToken', -1)
    return await router.push({path: '/login'})
  }

  const checkToken = await verifyToken({ token: localStorage.getItem('token') })

  if (checkToken.status !== -1) return

  createStore().commit('setToken', -1)
  createStore().commit('setEmailStore', null)
  localStorage.removeItem('token')
  await router.push({path: '/login'})
}
