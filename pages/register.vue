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
        <Input :error="error" :title="'Email'" :type="'email'" v-model="email" />
        <Input :error="error" :title="'Password'" :type="'password'" v-model="password" />
        <Input :error="error" :title="'Repeat password'" :type="'password'" :styles="'padding-bottom: 10px'" v-model="passwordRepeat" />
        <Checkbox v-model="tac" :label="`I have read and accepted <a href='/'>terms and conditions.</a>`" />
        <Button :label="'Sign up'" :clickon="register" />
        <p v-if="error">Passwords have to match!</p>
      </div>
    </div>

  </div>
</template>

<script>
import { register } from "~/api";
import { mapActions } from 'vuex';
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
    ...mapActions(['fetchTac', 'fetchError', 'fetchStatus', 'fetchPasswordRepeat', 'fetchPassword', 'fetchEmail']),
    password() { this.error = (this.password !== this.passwordRepeat) && (this.password !== null && this.passwordRepeat !== null) },
    passwordRepeat() { this.error = (this.password !== this.passwordRepeat) && (this.password !== null && this.passwordRepeat !== null) }
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
      get() { return this.$store.getters.getError },
      set(value) { this.$store.commit('setTac', value) }
    }
  },
  methods: {
    redirect(path) {
      this.$router.push({ path })
    },
    async register() {
      if (!this.error && this.password && this.passwordRepeat && this.email) {
        const res = await register({
          email: this.email,
          password: this.password
        })
        this.status = res.status
      }
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/login";
</style>
