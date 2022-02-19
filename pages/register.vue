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
      <div class="login-inputs-container">
        <h1>Sign up</h1>
        <Input :error="emailError" :title="'Email'" :type="'text'" v-model="email" />
        <Input :error="passwordError" :title="'Password'" :type="'password'" v-model="password" />
        <Input :error="passwordError" :title="'Repeat password'" :type="'password'" :styles="'padding-bottom: 10px'" v-model="passwordRepeat" />

        <p v-if="passwordError.passwordMismatch" class="paragraph-small error">Passwords have to match!</p>
        <p v-if="passwordError.passwordRequirement" class="paragraph-small error">Password are requirement!</p>
        <div v-if="passwordError.passwordRules" class="password-requirement">
          <p>Password length should be more than 8 characters</p>
          <p>Password should contain at least one uppercase character</p>
          <p>Password should contain at least one lowercase character</p>
          <p>Password should contain at least one special character</p>
          <p>Password should contain at least one digit character</p>
        </div>

        <Checkbox v-model="tac" :label="`I have read and accepted <a href='/'>terms and conditions.</a>`" />
        <Button :label="'Sign up'" :clickon="register" />
      </div>
    </div>

  </div>
</template>

<script>
import { register } from "~/api";
import { mapActions } from "vuex";
import { validateEmail, validatePassword, validatePasswordLength } from "~/helpers/frontValidators";
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
      'fetchPasswordError'
    ]),
    password() { this.validPassword() },
    passwordRepeat() { this.validPassword() },
    email() { this.emailError = !validateEmail(this.email) }
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
    }
  },
  methods: {
    redirect(path) {
      this.$router.push({ path })
    },
    validPassword() {
      this.passwordError.passwordMismatch = !!((this.password && this.passwordRepeat) && (this.password !== this.passwordRepeat));
      this.passwordError.passwordRequirement = !this.password || !this.passwordRepeat;
      this.passwordError.passwordRules = !!(!validatePassword(this.password) || !validatePassword(this.passwordRepeat));
    },
    async register() {
      if (this.email && validateEmail(this.email)) {
        if (
          this.password && this.passwordRepeat
          && this.password === this.passwordRepeat
          && validatePassword(this.password) && validatePassword(this.passwordRepeat)
        ) {
          const res = await register({
            email: this.email,
            password: this.password
          })
          this.status = res.status
        } else {
          if (!this.password || !this.passwordRepeat) {
            // password fields are required
          } else if (this.password !== this.passwordRepeat) {
            // password match
          } else {
            // password rules
          }
        }
      } else {
        this.emailError = true
      }
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/login";
</style>
