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

        <Input :style="[!loginWithEmail ? {'display': 'none'} : {'': ''}]" :focus="emailFocus" :title="'Email'" :type="'email'" />
        <Input :style="[loginWithEmail ? {'display': 'none'} : {'': ''}]" :focus="phoneFocus" :title="'Phone number'" :type="'email'" />

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
      emailFocus: false,
      phoneFocus: false
    }
  },
  methods: {
    redirect(path) {
      this.$router.push({ path: path })
    },
    chooseLogin(option) {
      if (option === 'email') {
        this.loginWithEmail = true
        this.emailFocus = true
        this.phoneFocus = false
      } else {
        this.loginWithEmail = false
        this.emailFocus = false
        this.phoneFocus = true
      }
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/login";
</style>
