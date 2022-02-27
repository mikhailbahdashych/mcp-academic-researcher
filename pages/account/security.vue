<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container">
      <h1>Here is security subpage</h1>
      <div class="account-containers">
        <div class="security-container">
          <div class="inner-block">
            <p>Set two-factor authentication to secure you account. Strongly recommended!</p>
            <Button :label="'Click to generate 2FA'" :clickon="generate2fa" />
            <img :src="securityToken.qr" alt="2fa">
            <Input :title="'Code'" :type="'text'" v-model="securityCode" />
            <Button :label="'Set 2FA'" :clickon="set2fa" />
            <p v-if="securityToken.status === 1">2fa setted</p>
            <p v-else>2fa not setted</p>
          </div>
        </div>
        <div class="security-container">
          <div class="inner-block">
            <p>Change your password</p>
            <Input :additional-class="'basic-input-box'" :title="'Current password'" :type="'password'" v-model="securityCurrentPassword" />
            <Input :additional-class="'basic-input-box'" :title="'New password'" :type="'password'" v-model="securityNewPassword" />
            <Input :additional-class="'basic-input-box margin-bottom-20'" :title="'Repeat new password'" :type="'password'" v-model="securityNewPasswordRepeat" />
            <Button :label="'Change password'" :clickon="changePassword" />
          </div>
        </div>
      </div>
      <div class="account-containers">
        <div class="security-container">
          <div class="inner-block">
            <p>Change email</p>
            <Input :additional-class="'basic-input-box'" :title="'Current email'" :type="'email'" v-model="securityCurrentEmail" />
            <Input :additional-class="'basic-input-box'" :title="'New email'" :type="'email'" v-model="securityNewEmail" />
            <Input :additional-class="'basic-input-box margin-bottom-20'" :title="'Repeat new email'" :type="'email'" v-model="securityNewEmailRepeat" />
            <Button :label="'Change email'" :clickon="changeEmail" />
            <Button :label="'Send email'" :clickon="sendEmailMessage" />
          </div>
        </div>
        <div class="security-container">
          <div class="inner-block">
            <p>Close account</p>
            <Button :label="'Close account'" :clickon="closeAccount" />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { sendEmail } from "~/api";
import { verifyUserToken } from "~/helpers/auth";
import { mapActions } from "vuex";
import Input from "~/components/Input";
import Button from "~/components/Button";
import AccountHeader from "~/components/AccountHeader";
import * as node2fa from "node-2fa";
export default {
  name: "security",
  components: {
    Input,
    Button,
    AccountHeader
  },
  watch: {
    ...mapActions([
      'fetchSecurityCode',
      'fetchSecurityToken',
      'fetchSecurityCurrentPassword',
      'fetchSecurityNewPassword',
      'fetchSecurityNewPasswordRepeat',
      'fetchSecurityCurrentEmail',
      'fetchSecurityNewEmail',
      'fetchSecurityNewEmailRepeat',
      'fetchSecurityCodeError',
      'fetchSet2fa',
      'fetchCheck2fa',
      'fetchChangePassword',
      'fetchChangeEmail',
      'fetchCloseAccount'
    ])
  },
  computed: {
    securityCode: {
      get() { return this.$store.getters.getSecurityCode },
      set(value) { this.$store.commit('setSecurityCode', value) }
    },
    securityToken: {
      get() { return this.$store.getters.getSecurityToken },
      set(value) { this.$store.commit('setSecurityToken', value) }
    },
    securityCurrentPassword: {
      get() { return this.$store.getters.getSecurityCurrentPassword },
      set(value) { this.$store.commit('setSecurityCurrentPassword', value) }
    },
    securityNewPassword: {
      get() { return this.$store.getters.getSecurityNewPassword },
      set(value) { this.$store.commit('setSecurityNewPassword', value) }
    },
    securityNewPasswordRepeat: {
      get() { return this.$store.getters.getSecurityNewPasswordRepeat },
      set(value) { this.$store.commit('setSecurityNewPasswordRepeat', value) }
    },
    securityCurrentEmail: {
      get() { return this.$store.getters.getSecurityCurrentEmail },
      set(value) { this.$store.commit('setSecurityCurrentEmail', value) }
    },
    securityNewEmail: {
      get() { return this.$store.getters.getSecurityNewEmail },
      set(value) { this.$store.commit('setSecurityNewEmail', value) }
    },
    securityNewEmailRepeat: {
      get() { return this.$store.getters.getSecurityNewEmailRepeat },
      set(value) { this.$store.commit('setSecurityNewEmailRepeat', value) }
    },
    securityCodeError: {
      get() { return this.$store.getters.getSecurityCodeError },
      set(value) { this.$store.commit('setSecurityCodeError', value) }
    }
  },
  destroyed() {
    this.$store.commit('setSecurityDefaultValues')
  },
  async mounted() {
    await verifyUserToken(this.$router)
    await this.$store.dispatch('fetchCheck2fa', {token: localStorage.getItem('token')})
  },
  methods: {
    async sendEmailMessage() {
      await sendEmail({message: 'Here is some test message for email'})
    },
    async set2fa() {
      await this.$store.dispatch('fetchSet2fa', {
        code: this.securityCode,
        token: this.securityToken,
        jwt: localStorage.getItem('token')
      })
    },
    generate2fa() {
      this.securityToken = node2fa.generateSecret({
        name: 'Bot crypto trader', account: 'dupa@dupa.com'
      })
    },
    async changePassword() {
      await this.$store.dispatch('fetchChangePassword', {
        currentPassword: this.securityCurrentPassword,
        newPassword: this.securityNewPassword,
        newPasswordRepeat: this.securityNewPasswordRepeat,
        token: localStorage.getItem('token')
      })
    },
    async changeEmail() {
      await this.$store.dispatch('fetchChangeEmail', {
        currentEmail: this.securityCurrentEmail,
        newEmail: this.securityNewEmail,
        newEmailRepeat: this.securityNewEmailRepeat,
        token: localStorage.getItem('token')
      })
    },
    async closeAccount() {
      await this.$store.dispatch('fetchCloseAccount', { token: localStorage.getItem('token') })
    }
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
