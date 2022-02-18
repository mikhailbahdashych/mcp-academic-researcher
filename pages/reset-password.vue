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
          :button-click-on="() => {}"
          :title="'Email'"
          :focus="resetPasswordEmailFocus"
          :button-title="'Send code'"
          :style="[!resetPasswordLoginWithEmail ? {'display': 'none'} : {'': ''}]"
          v-model="resetPasswordEmail"
        />
        <InputWithButton
          :button-click-on="() => {}"
          :title="'Phone'"
          :focus="resetPasswordPhoneFocus"
          :button-title="'Send code'"
          :style="[resetPasswordLoginWithEmail ? {'display': 'none'} : {'': ''}]"
          v-model="resetPasswordPhone"
        />

        <Input :title="'Verification code'" :styles="'padding-bottom: 30px'" />
        <Button :label="'Submit'" :clickon="resetPassword" />
      </div>
    </div>

  </div>
</template>

<script>
import { resetPassword } from "~/api";
import { mapActions } from "vuex";
import { validateEmail } from "~/helpers/frontValidators";
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
  watch: {
    ...mapActions([
      'fetchResetPasswordEmail',
      'fetchResetPasswordPhone',
      'fetchResetPasswordCode',
      'fetchResetPasswordEmailError',
      'fetchResetPasswordEmailFocus',
      'fetchResetPasswordPhoneFocus',
      'fetchResetPasswordLoginWithEmail'
    ]),
    resetPasswordEmail() { this.resetPasswordEmailError = !validateEmail(this.resetPasswordEmail) },
  },
  computed: {
    resetPasswordEmail: {
      get() { return this.$store.getters.getResetPasswordEmail },
      set(value) { this.$store.commit('setResetPasswordEmail', value) }
    },
    resetPasswordPhone: {
      get() { return this.$store.getters.getResetPasswordPhone },
      set(value) { this.$store.commit('setResetPasswordPhone', value) }
    },
    resetPasswordCode: {
      get() { return this.$store.getters.getResetPasswordCode },
      set(value) { this.$store.commit('setResetPasswordCode', value) }
    },
    resetPasswordEmailError: {
      get() { return this.$store.getters.getResetPasswordEmailError },
      set(value) { this.$store.commit('setResetPasswordEmailError', value) }
    },
    resetPasswordEmailFocus: {
      get() { return this.$store.getters.getResetPasswordEmailFocus },
      set(value) { this.$store.commit('setResetPasswordEmailFocus', value) }
    },
    resetPasswordPhoneFocus: {
      get() { return this.$store.getters.getResetPasswordPhoneFocus },
      set(value) { this.$store.commit('setResetPasswordPhoneFocus', value) }
    },
    resetPasswordLoginWithEmail: {
      get() { return this.$store.getters.getResetPasswordLoginWithEmail },
      set(value) { this.$store.commit('setResetPasswordLoginWithEmail', value) }
    }
  },
  mounted() {
    this.chooseOption('email')
  },
  methods: {
    async resetPassword() {
      // const res = await resetPassword()
    },
    redirect(path) {
      this.$router.push({ path: path })
    },
    chooseOption(option) {
      if (option === 'email') {
        this.resetPasswordLoginWithEmail = true
        this.resetPasswordEmailFocus = true
      } else {
        this.resetPasswordLoginWithEmail = false
        this.resetPasswordPhoneFocus = true
      }
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/login";
</style>
