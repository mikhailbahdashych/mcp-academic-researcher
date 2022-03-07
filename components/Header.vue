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
      <Input :additional-class="'search-bar'" />
    </div>

    <div class="header-side" v-if="!token">
      <div class="user-nav" @click="redirect('/login')">
        <div class="user-nav-button">
          Log in
        </div>
      </div>
      <div class="user-nav" @click="redirect('/register')">
        <div class="user-nav-button filled">
          Sign up
        </div>
      </div>
    </div>

    <div class="header-side" v-else>
      <div class="user-nav" @click="redirect('/account')">
        <div class="user-nav-button filled">
          My account
        </div>
      </div>
      <div class="user-nav" @click="logout">
        <div class="user-nav-button filled">
          Log out
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import Button from "~/components/Button";
import Input from "~/components/Input";
export default {
  name: "Header",
  components: {
    Button,
    Input
  },
  data() {
    return {
      token: null
    }
  },
  mounted() {
    this.checkToken()
  },
  methods: {
    redirect(path) {
      this.$router.push({ path: path })
    },
    logout() {
      localStorage.removeItem('token')
      this.$store.commit('setToken', -1)
      this.$router.push({ path: '/' })
    },
    checkToken() {
      this.token = !!localStorage.getItem('token');
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Header";
</style>
