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
      <div class="login-inputs-container">
        <h1>Forgot password?</h1>

        <div class="login-options">
          <p class="choose" @click="chooseOption('email')">Email</p>
          <div class="vertical-line" />
          <p class="choose" @click="chooseOption('phone')">Phone</p>
        </div>

        <InputWithButton
          :additional-class="'basic-input-wide'"
          :error="resetPasswordEmail.emailError"
          :button-click-on="() => {}"
          :title="'Email'"
          :focus="resetPasswordEmail.emailFocus"
          :button-title="'Send code'"
          :style="[!resetPasswordLoginWithEmail ? {'display': 'none'} : {'': ''}]"
          v-model="resetPasswordEmail.email"
        />
        <InputWithButton
          :additional-class="'basic-input-wide'"
          :button-click-on="() => {}"
          :title="'Phone'"
          :focus="resetPasswordPhone.phoneFocus"
          :button-title="'Send code'"
          :style="[resetPasswordLoginWithEmail ? {'display': 'none'} : {'': ''}]"
          v-model="resetPasswordPhone.phone"
        />

        <Input @keyup.enter.native="() => {}" :title="'Verification code'" :additional-class="'basic-input-wide'" />
        <Button :label="'Submit'" :clickon="() => {}" />
      </div>
    </div>

  </div>
</template>

<script>
import { mapActions } from "vuex";
import { validateEmail } from "~/helpers/frontValidators";
export default {
  name: "reset-password",
  watch: {
    ...mapActions([
      'fetchResetPasswordEmail',
      'fetchResetPasswordPhone',
      'fetchResetPasswordCode',
      'fetchResetPasswordLoginWithEmail',
      'fetchResetPasswordEmailFocusLogin',
      'fetchResetPasswordPhoneFocusLogin'
    ]),
    'resetPasswordEmail.email': {
      handler: function () {
        this.resetPasswordEmail.emailError = !validateEmail(this.resetPasswordEmail.email)
      }
    },
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
    resetPasswordLoginWithEmail: {
      get() { return this.$store.getters.getResetPasswordLoginWithEmail },
      set(value) { this.$store.commit('setResetPasswordLoginWithEmail', value) }
    }
  },
  destroyed() {
    this.$store.commit('setResetPasswordDefaultValues')
  },
  mounted() {
    this.chooseOption('email')
  },
  methods: {
    redirect(path) {
      this.$router.push({ path })
    },
    chooseOption(option) {
      if (option === 'email') {
        this.$store.dispatch('fetchResetPasswordEmailFocusLogin')
      } else {
        this.$store.dispatch('fetchResetPasswordPhoneFocusLogin')
      }
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/login";
</style>
