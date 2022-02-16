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
<!--        <input type="checkbox" v-model="tac">-->
        <p v-if="error">Passwords have to match!</p>
      </div>
    </div>

  </div>
</template>

<script>
import { register } from "~/api";
// import { mapGetters, mapState, mapActions, mapMutations } from 'vuex';
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
    tac: function () {
      this.$store.dispatch("fetchTac", this.tac)
      console.log(this.$store.getters.getTac)
    },
    password() { this.error = (this.password !== this.passwordRepeat) && (this.password !== null && this.passwordRepeat !== null) },
    passwordRepeat() { this.error = (this.password !== this.passwordRepeat) && (this.password !== null && this.passwordRepeat !== null) }
  },
  data() {
    return {
      email: null,
      password: null,
      passwordRepeat: null,
      status: null,
      error: false,
      tac: false
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
