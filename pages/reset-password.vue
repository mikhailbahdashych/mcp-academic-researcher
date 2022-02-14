<template>
  <div class="login">

    <div class="login-content">
      <h1 @click="redirect('/')">Logo</h1>
    </div>

    <div class="login-header">
      <p class="paragraph-small right">Don't have account yet?
        <span class="paragraph-small pointer link" @click="redirect('/register')">Register now!</span>
      </p>
    </div>

    <div class="login-inputs">
      <div class="login-inputs-container">
        <h1>Forgot password?</h1>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: "reset-password",
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
