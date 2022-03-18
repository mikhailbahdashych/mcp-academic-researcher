<template>
  <div class="login">

    <div class="login-content">
      <h1 @click="redirect('/')">Logo</h1>
    </div>

    <div class="login-header">
      <p class="paragraph right">Already have account?
        <span class="paragraph pointer link" @click="redirect('/login')">Log in!</span>
      </p>
    </div>

    <div class="login-inputs">
      <div v-if="status !== 1" class="login-inputs-container">
        <h1>Sign up</h1>
        <Input :additional-class="'basic-input-wide'" :oneerror="email.emailError" :title="'Email'" :type="'text'" v-model="email.email" />
        <Input :additional-class="'basic-input-wide'" :oneerror="passwordError.passwordMismatch || passwordError.passwordRequirement || passwordError.passwordRules" :title="'Password'" :type="'password'" v-model="password.password" />
        <Input :additional-class="'basic-input-wide margin-bottom-10'" :oneerror="passwordError.passwordMismatch || passwordError.passwordRequirement || passwordError.passwordRules" :title="'Repeat password'" :type="'password'" v-model="password.passwordRepeat" />
        <p v-if="passwordError.passwordMismatch" class="paragraph error">Passwords have to match!</p>
        <p v-if="passwordError.passwordRequirement" class="paragraph error">Password are requirement!</p>
        <div v-if="passwordError.passwordRules" class="password-requirement">

          <div v-for="rule in passwordRulesList" style="display: flex;">
            <div v-for="(item) in Object.entries(rule)">
              <p>
                <span v-if="item[0] === 'text'">{{ item[1] }}</span>
                <span v-else>
                  <span class="paragraph medium success" v-if="item[1]">OK</span>
                  <span class="paragraph medium error" v-else>NOT OK</span>
                </span>
              </p>
            </div>
          </div>
        </div>

        <Checkbox v-model="tac" :label="`I have read and accepted <a href='/'>terms and conditions.</a>`" />
        <p v-if="status === -1" class="paragraph error">User with this email already exists!</p>
        <Button :label="'Sign up'" :clickon="register" :disabled="!validFields()" />
      </div>
      <div class="login-inputs-container" v-else>
        <h1>Conformation email has been sent.</h1>
        <p class="paragraph medium">Please, follow the instruction in the email to complete registration process.</p>
        <p class="paragraph medium">The link will be valid for 24 hours.</p>
      </div>
    </div>

  </div>
</template>

<script>
import {register, sendEmail} from "~/api";
import { verifyClientByToken } from "~/helpers/auth";
import { mapActions } from "vuex";
import { validateEmail, validatePassword, validatePasswordRules } from "~/helpers/frontValidators";
export default {
  name: "register",
  watch: {
    ...mapActions([
      'fetchTac',
      'fetchError',
      'fetchStatus',
      'fetchPassword',
      'fetchEmail',
      'fetchPasswordError',
      'fetchPasswordRulesList'
    ]),
    'password.password': {
      handler: function () {
        if (this.password.password === this.password.passwordRepeat) { this.passwordError.passwordMismatch = false }
        this.validPassword()
      }
    },
    'password.passwordRepeat': {
      handler: function () {
        if (this.password.password === this.password.passwordRepeat) { this.passwordError.passwordMismatch = false }
        this.validPassword()
      }
    },
    'email.email': {
      handler: function () {
        if (!validateEmail(this.email.email)) this.email.emailError = true
        else if (validateEmail(this.email.email) === 1) this.email.emailError = false
        else this.email.emailError = false
      }
    },
  },
  computed: {
    error: {
      get() { return this.$store.getters.getError },
      set(value) { this.$store.commit('setError', value) }
    },
    email: {
      get() { return this.$store.getters.getEmail },
      set(value) { this.$store.commit('setEmail', value) }
    },
    password: {
      get() { return this.$store.getters.getPassword },
      set(value) { this.$store.commit('setPassword', value) }
    },
    status: {
      get() { return this.$store.getters.getStatus },
      set(value) { this.$store.commit('setStatus', value) }
    },
    tac: {
      get() { return this.$store.getters.getTac },
      set(value) { this.$store.commit('setTac', value) }
    },
    passwordError: {
      get() { return this.$store.getters.getPasswordError },
      set(value) { this.$store.commit('setPasswordError', value) }
    },
    passwordRulesList: {
      get() { return this.$store.getters.getPasswordRulesList },
      set(value) { this.$store.commit('setPasswordRulesList', value) }
    }
  },
  destroyed() {
    this.$store.commit('setDefaultValues')
  },
  async mounted() {
    await verifyClientByToken(this.$router, localStorage.getItem('token'), false, true)
  },
  methods: {
    redirect(path) {
      this.$router.push({ path })
    },
    validFields() {
      return this.tac &&
      !this.email.emailError &&
      this.email.email && this.password.password && this.password.passwordRepeat &&
      (!this.passwordError.passwordMismatch && !this.passwordError.passwordRequirement && !this.passwordError.passwordRules)
    },
    validPassword() {
      this.$store.commit('setPasswordRulesList', validatePasswordRules(this.password.password))
      this.passwordError.passwordMismatch = !!((this.password.password && this.password.passwordRepeat) && (this.password.password !== this.password.passwordRepeat));
      this.passwordError.passwordRequirement = !this.password.password || !this.password.passwordRepeat;
      this.passwordError.passwordRules = !!(!validatePassword(this.password.password) || !validatePassword(this.password.passwordRepeat));
      if (!this.password.password && !this.password.passwordRepeat) {
        this.passwordError.passwordMismatch = false
        this.passwordError.passwordRequirement = false
        this.passwordError.passwordRules = false
      }
    },
    async register() {
      if (this.validFields()) {
        await register({
          email: this.email.email,
          password: this.password.password
        }).then(async (res) => {
          if (res.status === -1) return this.$store.commit('setStatus', -1)
          await sendEmail({ type: 'reg', to: this.email.email }).then((res) => {
            if (res.status === 1) {
              this.$store.commit('setStatus', 1)
            }
          })
        }).catch(() => {
          this.$store.commit('setStatus', -1)
        })
      }
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/login";
</style>
