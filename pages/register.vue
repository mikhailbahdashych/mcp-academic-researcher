<template>
  <div class="login">

    <div class="login-content">
      <h1 @click="redirect('/')">Logo</h1>
    </div>

    <div class="login-header">
      <p class="paragraph-small right">Already have account?
        <span class="paragraph-small pointer link" @click="redirect('/login')">Log in!</span>
      </p>
    </div>

    <div class="login-inputs">
      <div v-if="status !== 1" class="login-inputs-container">
        <h1>Sign up</h1>
        <Input :additional-class="'basic-input-wide'" :oneerror="emailError" :title="'Email'" :type="'text'" v-model="email" />
        <Input :additional-class="'basic-input-wide'" :oneerror="passwordError.passwordMismatch || passwordError.passwordRequirement || passwordError.passwordRules" :title="'Password'" :type="'password'" v-model="password" />
        <Input :additional-class="'basic-input-wide margin-bottom-10'" :oneerror="passwordError.passwordMismatch || passwordError.passwordRequirement || passwordError.passwordRules" :title="'Repeat password'" :type="'password'" v-model="passwordRepeat" />
        <p v-if="passwordError.passwordMismatch" class="paragraph-small error">Passwords have to match!</p>
        <p v-if="passwordError.passwordRequirement" class="paragraph-small error">Password are requirement!</p>
        <div v-if="passwordError.passwordRules" class="password-requirement">

          <div v-for="rule in passwordRulesList" style="display: flex;">
            <div v-for="(item) in Object.entries(rule)">
              <p>
                <span v-if="item[0] === 'text'">{{ item[1] }}</span>
                <span v-else>
                  <span class="paragraph-small medium link" v-if="item[1]">OK</span>
                  <span class="paragraph-small medium error" v-else>NOT OK</span>
                </span>
              </p>
            </div>
          </div>
        </div>

        <Checkbox v-model="tac" :label="`I have read and accepted <a href='/'>terms and conditions.</a>`" />
        <p v-if="status === -1" class="paragraph-small error">User with this email already exists!</p>
        <Button :label="'Sign up'" :clickon="register" :disabled="!validFields()" />
      </div>
      <div class="login-inputs-container" v-else>
        <h2>Conformation email has been sent.</h2>
        <p>Please, follow the instruction in the email to complete registration process.</p>
      </div>
    </div>

  </div>
</template>

<script>
import { register, sendEmail } from "~/api";
import { mapActions } from "vuex";
import { validateEmail, validatePassword, validatePasswordRules } from "~/helpers/frontValidators";
import Input from "~/components/Input";
import Button from "~/components/Button";
import Checkbox from "~/components/Checkbox";
export default {
  name: "register",
  components: {
    Input,
    Button,
    Checkbox
  },
  watch: {
    ...mapActions([
      'fetchTac',
      'fetchError',
      'fetchStatus',
      'fetchPasswordRepeat',
      'fetchPassword',
      'fetchEmail',
      'fetchEmailError',
      'fetchPasswordError',
      'fetchPasswordRulesList'
    ]),
    password() { this.validPassword() },
    passwordRepeat() { this.validPassword() },
    email() {
      if (!validateEmail(this.email)) this.emailError = true
      else if (validateEmail(this.email) === 1) this.emailError = false
      else this.emailError = false
    }
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
    passwordRepeat: {
      get() { return this.$store.getters.getPasswordRepeat },
      set(value) { this.$store.commit('setPasswordRepeat', value) }
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
    emailError: {
      get() { return this.$store.getters.getEmailError },
      set(value) { this.$store.commit('setEmailError', value) }
    },
    passwordRulesList: {
      get() { return this.$store.getters.getPasswordRulesList },
      set(value) { this.$store.commit('setPasswordRulesList', value) }
    }
  },
  destroyed() {
    this.$store.commit('setDefaultValues')
  },
  methods: {
    redirect(path) {
      this.$router.push({ path })
    },
    validFields() {
      return this.tac &&
      !this.emailError &&
      this.email && this.password && this.passwordRepeat &&
      (!this.passwordError.passwordMismatch && !this.passwordError.passwordRequirement && !this.passwordError.passwordRules)
    },
    validPassword() {
      this.$store.commit('setPasswordRulesList', validatePasswordRules(this.password))
      this.passwordError.passwordMismatch = !!((this.password && this.passwordRepeat) && (this.password !== this.passwordRepeat));
      this.passwordError.passwordRequirement = !this.password || !this.passwordRepeat;
      this.passwordError.passwordRules = !!(!validatePassword(this.password) || !validatePassword(this.passwordRepeat));
      if (!this.password && !this.passwordRepeat) {
        this.passwordError.passwordMismatch = false
        this.passwordError.passwordRequirement = false
        this.passwordError.passwordRules = false
      }
    },
    async register() {
      if (this.validFields()) {
        await register({
          email: this.email,
          password: this.password
        }).then(async () => {
          await sendEmail({ type: 'reg', to: this.email }).then((res) => {
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
