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
        <h1>Log In</h1>

        <div class="login-options">
          <p class="choose" @click="chooseLogin('email')">With Email</p>
          <div class="vertical-line" />
          <p class="choose" @click="chooseLogin('phone')">With Phone Number</p>
        </div>

        <Input :error="loginEmailError" :style="[!loginWithEmail ? {'display': 'none'} : {'': ''}]" :focus="emailFocus" :title="'Email'" :type="'email'" v-model="loginEmail" />
        <Input :style="[loginWithEmail ? {'display': 'none'} : {'': ''}]" :focus="phoneFocus" :title="'Phone number'" :type="'email'" v-model="loginPhone" />

        <Input :error="loginPasswordError" :title="'Password'" :type="'password'" :styles="'padding-bottom: 50px'" v-model="loginPassword" />
        <Button :label="'Log In'" :clickon="login" />
        <p class="paragraph-small right pointer" @click="redirect('reset-password')">Forgot password?</p>

      </div>
    </div>

  </div>
</template>

<script>
import { login } from "~/api";
import { mapActions } from "vuex";
import { validateEmail, validatePasswordLength } from "~/helpers/frontValidators";
import Input from "~/components/Input";
import Button from "~/components/Button";
export default {
  name: "login",
  components: {
    Input,
    Button
  },
  watch: {
    ...mapActions([
      'fetchLoginEmail',
      'fetchLoginPhone',
      'fetchLoginPassword',
      'fetchLoginWithEmail',
      'fetchEmailFocus',
      'fetchPhoneFocus',
      'fetchLoginEmailError',
      'fetchLoginPasswordError',
      'fetchLoginError'
    ]),
    loginEmail() { this.loginEmailError = !validateEmail(this.loginEmail) },
    loginPassword() { this.loginPasswordError = !validatePasswordLength(this.loginPassword) }
  },
  computed: {
    loginEmail: {
      get() { return this.$store.getters.getLoginEmail },
      set(value) { this.$store.commit('setLoginEmail', value) }
    },
    loginPhone: {
      get() { return this.$store.getters.getLoginPhone },
      set(value) { this.$store.commit('setLoginPhone', value) }
    },
    loginPassword: {
      get() { return this.$store.getters.getLoginPassword },
      set(value) { this.$store.commit('setLoginPassword', value) }
    },
    loginWithEmail: {
      get() { return this.$store.getters.getLoginWithEmail },
      set(value) { this.$store.commit('setLoginWithEmail', value) }
    },
    emailFocus: {
      get() { return this.$store.getters.getEmailFocus },
      set(value) { this.$store.commit('setEmailFocus', value) }
    },
    phoneFocus: {
      get() { return this.$store.getters.getPhoneFocus },
      set(value) { this.$store.commit('setPhoneFocus', value) }
    },
    loginEmailError: {
      get() { return this.$store.getters.getLoginEmailError },
      set(value) { this.$store.commit('setLoginEmailError', value) }
    },
    loginError: {
      get() { return this.$store.getters.getLoginError },
      set(value) { this.$store.commit('setLoginError', value) }
    },
    loginPasswordError: {
      get() { return this.$store.getters.getLoginPasswordError },
      set(value) { this.$store.commit('setLoginPasswordError', value) }
    }
  },
  mounted() {
    this.chooseLogin('email')
  },
  methods: {
    async login() {
      // const res = await login()
    },
    redirect(path) {
      this.$router.push({ path: path })
    },
    chooseLogin(option) {
      if (option === 'email') {
        this.loginWithEmail = true
        this.emailFocus = true
        this.phoneFocus = false
        this.loginPhone = null
      } else {
        this.loginWithEmail = false
        this.emailFocus = false
        this.phoneFocus = true
        this.loginEmail = null
      }
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/login";
</style>
