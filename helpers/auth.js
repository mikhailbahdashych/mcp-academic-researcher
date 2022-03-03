import { verifyToken } from "@/api";

export const verifyUserToken = async (router) => {
  if (!localStorage.getItem('token')) return await router.push({path: '/login'})

  const checkToken = await verifyToken({ token: localStorage.getItem('token') })

  if (checkToken.status !== -1) return

  localStorage.removeItem('token')
  await router.push({path: '/login'})
}

// export const verifyUserTokenSoft = async () => {
//   if (localStorage.getItem('token')) {
//     const checkToken = await verifyToken({ token: localStorage.getItem('token') })
//     if (checkToken.error) {
//       localStorage.removeItem('token')
//       return false
//     } else {
//       return true
//     }
//   } else {
//     return false
//   }
// }
