import { verifyToken } from "~/api";
export default {
  async mounted() {
    if (!localStorage.getItem('token')) {
      await this.$router.push({path: '/login'})
    } else {
      const checkToken = await verifyToken({ token: localStorage.getItem('token') })
      if (checkToken.error) {
        localStorage.removeItem('token')
        await this.$router.push({path: '/login'})
      }
    }
  }
}
