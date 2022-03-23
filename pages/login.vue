<template>
  <div class="login">

    <div class="login-content">
      <h1 @click="redirect('/')">Logo</h1>
    </div>

    <div class="login-header">
      <p class="paragraph right">Don't have account yet?
        <span class="paragraph link" @click="redirect('/register')">Register now!</span>
      </p>
    </div>

    <div class="login-inputs">
      <div class="login-inputs-container">
        <InputTwoFa />
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

        <Input @keyup.enter.native="logIn" :additional-class="'basic-input-wide margin-bottom-30'" :oneerror="loginPassword.loginPasswordError" :title="'Password'" :type="'password'" v-model="loginPassword.password" />
        <p v-if="loginError === -1" class="paragraph error">Account doesn't exists or wasn't confirmed!</p>
        <Button :label="'Log In'" :clickon="logIn" />
        <p class="paragraph right" @click="redirect('reset-password')">Forgot password?</p>

      </div>
    </div>

  </div>
</template>

<script>
import { login } from "~/api";
import { mapActions } from "vuex";
import { validateEmail, validatePasswordLength } from "~/helpers/frontValidators";
import { verifyClientByToken } from "~/helpers/auth";
export default {
  name: "login",
  watch: {
    ...mapActions([
      'fetchLoginEmail',
      'fetchLoginPhone',
      'fetchLoginPassword',
      'fetchLoginError',
      'fetchEmailFocusLogin',
      'fetchPhoneFocusLogin',
      'fetchTwofa'
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
    twofa: {
      get() { return this.$store.getters.getTwofa },
      set(value) { this.$store.commit('setTwofa', value) }
    }
  },
  destroyed() {
    this.$store.commit('setLoginDefaultValues')
  },
  async mounted() {
    await verifyClientByToken(this.$router, localStorage.getItem('token'), false, true)
    this.chooseLogin('email')
  },
  methods: {
    async logIn() {
      if (
        (this.loginEmail.email || this.loginPhone.phone) &&
        (!this.loginEmail.loginEmailError && !this.loginPassword.loginPasswordError)
      ) {
        const res = await login({
          email: this.loginEmail.email,
          phone: this.loginPhone.phone,
          password: this.loginPassword.password
        })

        if (res.status === -1) {
          this.$store.commit('setLoginError', -1)
          return
        }

        localStorage.setItem('token', res)
        localStorage.setItem('email', this.loginEmail.email)
        this.$store.commit('setLoginPassword', { password: null })
        this.$store.commit('setLoginEmail', { email: null })
        await this.$router.push({path: '/account'})
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
