<template>
  <div class="login">
    <div class="login-content">
      <h1 @click="redirect('/')">Logo</h1>
    </div>
    <div class="login-inputs">
      <div class="login-inputs-container">
        <h1>Log In</h1>
        <p>Email</p>
        <Input />
        <p>Password</p>
        <Input />
        <Button />
      </div>
    </div>
  </div>
</template>

<script>
import Input from "@/components/Input";
import Button from "@/components/Button";
import Header from "@/components/Header";
export default {
  name: "login",
  components: {
    Header,
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
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/login";
</style>
