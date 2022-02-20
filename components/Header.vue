<template>
  <div class="header">

    <div class="header-side">
      <div class="header-logo" @click="redirect('/')">
        LOGO
      </div>
      <div class="header-nav">
        <div class="header-nav-menu">Nav menu 1</div>
        <div class="header-nav-menu">Nav menu 2</div>
        <div class="header-nav-menu">Nav menu 3</div>
      </div>
    </div>

    <div class="header-middle">
      <input class="header-middle-search" />
    </div>

    <div class="header-side">
      <div class="user-nav" @click="redirect('login')">
        <div class="user-nav-button">
          Log in
        </div>
      </div>
      <div class="user-nav" @click="redirect('register')">
        <div class="user-nav-button filled">
          Sign up
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { verifyToken } from "~/api";
export default {
  name: "Header",
  data() {
    return {

    }
  },
  async mounted() {
    // @TODO FRONT END MIDDLEWARE
    if (!localStorage.getItem('token')) {
      await this.$router.push({path: '/login'})
    } else {
      const checkToken = await verifyToken({ token: localStorage.getItem('token') })
      if (checkToken.error) {
        localStorage.removeItem('token')
        await this.$router.push({path: '/login'})
      }
    }
  },
  methods: {
    redirect(path) {
      this.$router.push({ path: path })
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Header";
</style>
