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

        <Input
          :additional-class="'basic-input-wide'"
          :oneerror="loginEmail.loginEmailError"
          :style="[!loginEmail.loginWithEmail ? {'display': 'none'} : {'': ''}]"
          :focus="loginEmail.emailFocus"
          :title="'Email'"
          :type="'email'"
          v-model="loginEmail.email"
        />
        <Input
          :additional-class="'basic-input-wide'"
          :style="[loginEmail.loginWithEmail ? {'display': 'none'} : {'': ''}]"
          :focus="loginPhone.phoneFocus"
          :title="'Phone number'"
          :type="'email'"
          v-model="loginPhone.phone"
        />

        <Input @keyup.enter.native="login" :additional-class="'basic-input-wide margin-bottom-30'" :oneerror="loginPassword.loginPasswordError" :title="'Password'" :type="'password'" v-model="loginPassword.password" />
        <p v-if="loginError === -1" class="paragraph-small error">Wrong credentials!</p>
        <Button :label="'Log In'" :clickon="login" />
        <p class="paragraph-small right pointer" @click="redirect('reset-password')">Forgot password?</p>

      </div>
    </div>

  </div>
</template>

<script>
import { login, verifyToken } from "~/api";
import { mapActions } from "vuex";
import { validateEmail, validatePasswordLength } from "~/helpers/frontValidators";
export default {
  name: "login",
  watch: {
    ...mapActions([
      'fetchLoginEmail',
      'fetchLoginPhone',
      'fetchLoginPassword',
      'fetchLoginError',
      'fetchEmailFocusLogin',
      'fetchPhoneFocusLogin'
    ]),
    'loginEmail.email': {
      handler: function () {
        this.loginEmail.loginEmailError = !validateEmail(this.loginEmail.email)
      }
    },
    'loginPassword.password': {
      handler: function () {
        this.loginPassword.loginPasswordError = !validatePasswordLength(this.loginPassword.password)
      }
    },
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
    loginError: {
      get() { return this.$store.getters.getLoginError },
      set(value) { this.$store.commit('setLoginError', value) }
    },
  },
  destroyed() {
    this.$store.commit('setLoginDefaultValues')
  },
  async mounted() {
    await verifyToken({ token: localStorage.getItem('token') }).then(async (res) => {
      if (res.status === 1) await this.$router.push({path: '/account'})
    })
    this.chooseLogin('email')
  },
  methods: {
    async login() {
      if (
        (this.loginEmail.email || this.loginPhone.phone) &&
        (!this.loginEmail.loginEmailError && !this.loginPassword.loginPasswordError)
      ) {
        await login({
          email: this.loginEmail.email,
          phone: this.loginPhone.phone,
          password: this.loginPassword.password
        }).then(async (token) => {
          if (token.status === -1) this.$store.commit('setLoginError', -1)

          localStorage.setItem('token', token)
          this.$store.commit('setEmailStore', this.loginEmail.email)
          this.$store.commit('setLoginPassword', { password: null })
          this.$store.commit('setLoginEmail', { email: null })
          await this.$router.push({path: '/account'})
        })
      } else {
        this.loginEmail.loginEmailError = true
        this.loginPassword.loginPasswordError = true
      }
    },
    redirect(path) {
      this.$router.push({ path })
    },
    chooseLogin(option) {
      if (option === 'email') this.$store.dispatch('fetchEmailFocusLogin')
      else this.$store.dispatch('fetchPhoneFocusLogin')
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/login";
</style>
