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
        <Input :title="'Email'" :type="'email'" />
        <Input :title="'Password'" :type="'password'" />
        <Input :title="'Repeat password'" :type="'password'" :styles="'padding-bottom: 50px'" />
        <Button :label="'Sign up'" :clickon="() => {}" />
      </div>
    </div>

  </div>
</template>

<script>
import { register } from "@/api";
import Input from "@/components/Input";
import Button from "@/components/Button";
export default {
  name: "register",
  components: {
    Input,
    Button
  },
  data() {
    return {

    }
  },
  methods: {
    redirect(path) {
      this.$router.push({ path: path })
    },
    async register() {
      const res = await register()
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/login";
</style>
