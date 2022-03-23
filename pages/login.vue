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
      <div class="login-inputs-container" v-if="!phone.show && !twofa.show">
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
        <p class="paragraph right link" @click="redirect('reset-password')">Forgot password?</p>

      </div>

      <div class="login-inputs-container" v-else-if="twofa.show">
        <h1>Two-Factor authentication</h1>
        <p class="paragraph">Please, provide Google Authenticator code to continue</p>
        <InputTwoFa :twofa="twofa.code" @returnTwofa="returnTwofa" />
        <p class="paragraph right link">Unable to login with 2FA?</p>
      </div>

      <div class="login-inputs-container" v-else-if="phone.show"></div>

    </div>

  </div>
</template>

<script>
import {login, loginWith2fa} from "~/api";
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
    },
    phone: {
      get() { return this.$store.getters.getPhone },
      set(value) { this.$store.commit('setPhone', value) }
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

        if (res.twofa) {
          this.twofa.show = true
        } else if (res.phone) {
          this.phone.show = true
        } else {
          localStorage.setItem('token', res)
          localStorage.setItem('email', this.loginEmail.email)
          this.$store.commit('setLoginPassword', { password: null })
          this.$store.commit('setLoginEmail', { email: null })
          await this.$router.push({path: '/account'})
        }
      } else {
        this.loginEmail.loginEmailError = true
        this.loginPassword.loginPasswordError = true
      }
    },
    redirect(path) {
      this.$router.push({ path })
    },
    async returnTwofa(twofa) {
      if (twofa.length !== 6 || twofa.join('').length !== 6) return

      const res = await loginWith2fa({ twoFaCode: twofa, email: this.loginEmail.email })

      if (res.status === 1) {
        localStorage.setItem('token', res.token)
        localStorage.setItem('email', this.loginEmail.email)
        this.$store.commit('setLoginPassword', { password: null })
        this.$store.commit('setLoginEmail', { email: null })
        await this.$router.push({path: '/account'})
      } else {
        // show error here
      }
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
