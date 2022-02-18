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
        <h1>Forgot password?</h1>

        <div class="login-options">
          <p class="choose" @click="chooseOption('email')">Email</p>
          <div class="vertical-line" />
          <p class="choose" @click="chooseOption('phone')">Phone</p>
        </div>

        <InputWithButton
          :button-click-on="test"
          :title="'Email'"
          :button-title="'Send code'"
        />

        <Input :title="'Verification code'" :styles="'padding-bottom: 30px'" />
        <Button :label="'Submit'" />
      </div>
    </div>

  </div>
</template>

<script>
import Input from "~/components/Input";
import InputWithButton from "~/components/InputWithButton";
import Button from "~/components/Button";
export default {
  name: "reset-password",
  components: {
    Input,
    InputWithButton,
    Button
  },
  data() {
    return {

    }
  },
  methods: {
    test() {
      console.log(123)
    },
    redirect(path) {
      this.$router.push({ path: path })
    },
    chooseOption(option) {
      if (option === 'email') {
        //
      } else {
        //
      }
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/login";
</style>
