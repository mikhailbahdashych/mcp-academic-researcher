<template>
  <div class="login">
    <div class="login-content">
      <h1 @click="redirect('/')">Logo</h1>
    </div>
    <div class="login-inputs">
      <h1>Log In</h1>
    </div>
  </div>
</template>

<script>
import Header from "@/components/Header";
export default {
  name: "login",
  components: {
    Header
  },
  data() {
    return {

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
@import "../assets/css/login";
</style>
