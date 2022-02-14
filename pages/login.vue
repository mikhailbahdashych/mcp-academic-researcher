<template>
  <div class="login">
    <div class="login-content">
      <h1 @click="redirect('/')">Logo</h1>
    </div>
    <div class="login-inputs">
      <div class="login-inputs-container">
        <h1>Log In</h1>
        <div class="login-options">
          <p>With Email</p>
          <div class="vertical-line" />
          <p>With QR Code</p>
        </div>
        <p class="paragraph-small">Email</p>
        <Input :type="'email'" />
        <p class="paragraph-small">Password</p>
        <Input :type="'password'" :styles="'padding-bottom: 50px'" />
        <Button />
        <p class="paragraph-small right pointer">Forgot password?</p>
      </div>
    </div>
  </div>
</template>

<script>
import Input from "@/components/Input";
import Button from "@/components/Button";
import Header from "@/components/Header";
export default {
  name: "login",
  components: {
    Header,
    Input,
    Button
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
