<template>
  <div class="login">

    <div class="login-content">
      <h1 @click="redirect('/')">Logo</h1>
    </div>

    <div class="login-inputs">
      <div class="login-inputs-container">
        <h1>Log In</h1>

        <div class="login-options">
          <p class="choose" @click="chooseLogin('email')">With Email</p>
          <div class="vertical-line" />
          <p class="choose" @click="chooseLogin('phone')">With Phone Number</p>
        </div>

        <div v-if="loginWithEmail">
          <Input :title="'Email'" :type="'email'" />
        </div>
        <div v-else>
          <Input :title="'Phone number'" :type="'email'" />
        </div>

        <Input :title="'Password'" :type="'password'" :styles="'padding-bottom: 50px'" />
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
      loginWithEmail: true,
    }
  },
  methods: {
    redirect(path) {
      this.$router.push({ path: path })
    },
    chooseLogin(option) {
      this.loginWithEmail = option === 'email';
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/login";
</style>
