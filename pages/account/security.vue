<template>
  <div>
    <Header />
    <div id="navbar">
      <AccountHeader />
    </div>
    <div class="account-container">
      <h1>Account information</h1>

      <h1>Two-Factor Authentication</h1>
      <div class="account-containers">
        <div class="security-container small">
          <div class="inner-block">
            <p>Set two-factor authentication to secure you account. Strongly recommended!</p>

            <Button v-if="[1, -4].includes(this.$store.getters.getSecurity2fa.status)" :label="'Disable 2FA'" @show="showModal('disable2fa')" />
            <Button v-else-if="this.$store.getters.getSecurity2fa.status !== -4" :label="'Click here to generate and set 2FA'" @show="showModal('ga')" />

            <p v-if="[1, -4].includes(this.$store.getters.getSecurity2fa.status)">2FA is set!</p>
            <p v-else-if="this.$store.getters.getSecurity2fa.status !== -4">You have not set 2FA for now!</p>

            <basic-modal
              @close="closeModal('ga')"
              v-if="securityShowModal.ga"
              header="Activate 2FA"
              description="We strongly recommend you to 2FA.
              This will increase the security of you account.
              Before it, you should download Google Authenticator application.
              Once it's done, click the button below to start."
            >
              <Button v-if="!this.$store.getters.getSecurity2fa.qr" :label="'Generate 2FA'" :clickon="generate2fa" />
              <img v-if="this.$store.getters.getSecurity2fa.qr && ([null, -1, -2].includes(this.$store.getters.getSecurity2fa.status))" :src="this.$store.getters.getSecurity2fa.qr" alt="2fa">
              <div v-if="this.$store.getters.getSecurity2fa.qr && ([null, -1, -2].includes(this.$store.getters.getSecurity2fa.status))">
                <Input :title-class="'on-white-paragraph'" :additional-class="'margin-bottom-20 on-white'" :title="'Provide 6-digit code'" :placeholder="'XXXXXX'" :type="'text'" v-model="securityTwofa.code" />
                <Button :label="'Confirm 2FA'" :clickon="set2fa" />
              </div>
              <div v-else-if="this.$store.getters.getSecurity2fa.status === 1">
                <p class="paragraph-small medium on-white-paragraph">2FA set successfully</p>
              </div>
              <div v-if="this.$store.getters.getSecurity2fa.status === -1">
                <p class="paragraph-small medium error">Wrong code!</p>
              </div>
            </basic-modal>
            <basic-modal
              @close="closeModal('disable2fa')"
              v-if="securityShowModal.disable2fa"
              header="Disable 2FA"
              description="Are you sure you want to do this?
              If you are, provide code below."
            >
              <Input :title-class="'on-white-paragraph'" :additional-class="'margin-bottom-20 on-white'" :title="'Provide 6-digit code'" :placeholder="'XXXXXX'" :type="'text'" v-model="securityTwofa.code" />
              <Button :label="'Disable 2FA'" :clickon="deactivate2fa" />
              <div v-if="this.$store.getters.getSecurity2fa.status === -3">
                <p class="paragraph-small medium on-white-paragraph">Successfully deactivated!</p>
              </div>
              <div v-else-if="this.$store.getters.getSecurity2fa.status === -4">
                <p class="paragraph-small medium error">Wrong code!</p>
              </div>
            </basic-modal>
          </div>
        </div>
        <div class="security-container small">
          <div class="inner-block">
            <p>Phone verification</p>
            <Button :label="'Click here to verify mobile phone'" @show="showModal('sms')" />
            <basic-modal
              @close="closeModal('sms')"
              v-if="securityShowModal.sms"
              header="Verify mobile phone"
              description="Here is some text text."
            >
            </basic-modal>
          </div>
        </div>
      </div>

      <h1>Login credentials</h1>
      <div class="account-containers">
        <div class="security-container">
          <div class="inner-block">
            <p>Change email</p>
            <Input :additional-class="'basic-input-box'" :title="'Current email'" :type="'email'" v-model="securityEmail.currentEmail" :oneerror="securityEmail.currentEmailError" />
            <Input :additional-class="'basic-input-box'" :title="'New email'" :type="'email'" v-model="securityEmail.newEmail" :oneerror="securityEmail.newEmailError" />
            <Input :additional-class="'basic-input-box margin-bottom-20'" :title="'Repeat new email'" :type="'email'" v-model="securityEmail.newEmailRepeat" :oneerror="securityEmail.newEmailRepeatError" />
            <Button :label="'Change email'" @show="showModal('changeEmail')" />
            <basic-modal
              @close="closeModal('changeEmail')"
              v-if="securityShowModal.changeEmail"
              header="Change email"
              description="Be careful! You are able to change email only one time."
            >
              <Button :label="'Change email'" :clickon="changeEmail" />
            </basic-modal>
          </div>
        </div>

        <div class="security-container">
          <div class="inner-block">
            <p>Change your password</p>
            <Input :additional-class="'basic-input-box'" :title="'Current password'" :type="'password'" v-model="securityPassword.currentPassword" />
            <Input :additional-class="'basic-input-box'" :title="'New password'" :type="'password'" v-model="securityPassword.newPassword" />
            <Input :additional-class="'basic-input-box margin-bottom-20'" :title="'Repeat new password'" :type="'password'" v-model="securityPassword.newPasswordRepeat" />
            <Button :label="'Change password'" @show="showModal('changePassword')" />
            <basic-modal
              @close="closeModal('changePassword')"
              v-if="securityShowModal.changePassword"
              header="Change password"
              description="Are you sure you want to change password?"
            >
              <Button :label="'Change password'" :clickon="changePassword" />
            </basic-modal>
          </div>
        </div>
      </div>

      <h1>Danger zone</h1>
      <div class="account-containers">
        <div class="security-container danger small">
          <div class="inner-block">
            <p>Close account</p>
            <p>We are so sorry to see that, but if you want to, click the button below.</p>
            <Button :label="'Close account'" @show="showModal('closingAccount')" />
            <basic-modal
              @close="closeModal('closingAccount')"
              v-if="securityShowModal.closingAccount"
              header="Close account"
              description="Are you sure you want to close account? You won't be able to restore your data!"
            >
              <Button :label="'Close account'" :clickon="closeAccount" />
            </basic-modal>
          </div>
        </div>
      </div>

    </div>
    <Footer :bright="true" />
  </div>
</template>

<script>
import { verifyUserToken } from "~/helpers/auth";
import { validateEmail } from "~/helpers/frontValidators";
import { mapActions } from "vuex";
export default {
  name: "security",
  watch: {
    ...mapActions([
      'fetchSecurity2fa',
      'fetchSecurityPassword',
      'fetchSecurityEmail',
      'fetchSecurityShowModal',

      'fetchSet2fa',
      'fetchCheck2fa',
      'fetchChangePassword',
      'fetchChangeEmail',
      'fetchCloseAccount',
      'fetchGenerate2fa',
      'fetchDisable2fa',
    ]),
    'securityEmail.currentEmail': {
      handler: function () {
        if (!validateEmail(this.securityEmail.currentEmail)) this.securityEmail.currentEmailError = true
        else if (validateEmail(this.securityEmail.currentEmail) === 1) this.securityEmail.currentEmailError = false
        else this.securityEmail.currentEmailError = false
      }
    },
    'securityEmail.newEmail': {
      handler: function () {
        if (!validateEmail(this.securityEmail.newEmail)) this.securityEmail.newEmailError = true
        else if (validateEmail(this.securityEmail.newEmail) === 1) this.securityEmail.newEmailError = false
        else this.securityEmail.newEmailError = false
      }
    },
    'securityEmail.newEmailRepeat': {
      handler: function () {
        if (!validateEmail(this.securityEmail.newEmailRepeat)) this.securityEmail.newEmailRepeatError = true
        else if (validateEmail(this.securityEmail.newEmailRepeat) === 1) this.securityEmail.newEmailRepeatError = false
        else this.securityEmail.newEmailRepeatError = false
      }
    },
  },
  computed: {
    securityTwofa: {
      get() { return this.$store.getters.getSecurity2fa },
      set(value) { this.$store.commit('set2fa', value) }
    },
    securityPassword: {
      get() { return this.$store.getters.getSecurityPassword },
      set(value) { this.$store.commit('setSecurityPassword', value) }
    },
    securityEmail: {
      get() { return this.$store.getters.getSecurityEmail },
      set(value) { this.$store.commit('setSecurityEmail', value) }
    },
    securityCodeError: {
      get() { return this.$store.getters.getSecurity2fa },
      set(value) { this.$store.commit('setSecurityCodeError', value) }
    },
    securityShowModal: {
      get() { return this.$store.getters.getSecurityShowModal },
      set(value) { this.$store.commit('setSecurityShowModal', value) }
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
    closeModal(modal) { this.$store.dispatch('fetchSecurityShowModal', {[modal]: false}) },
    showModal(modal) { this.$store.dispatch('fetchSecurityShowModal', {[modal]: true}) },
    async set2fa() {
      await this.$store.dispatch('fetchSet2fa', {
        code: this.securityTwofa.code,
        token: this.securityTwofa.secret,
        jwt: localStorage.getItem('token')
      })
    },
    async deactivate2fa() {
      await this.$store.dispatch('fetchDisable2fa', {
        code: this.securityTwofa.code,
        jwt: localStorage.getItem('token')
      })
    },
    generate2fa() {
      this.$store.dispatch('fetchGenerate2fa', { name: 'asdas', account: 'asdasd' })
    },
    async changePassword() {
      await this.$store.dispatch('fetchChangePassword', {
        currentPassword: this.securityPassword.currentPassword,
        newPassword: this.securityPassword.newPassword,
        newPasswordRepeat: this.securityPassword.newPasswordRepeat,
        token: localStorage.getItem('token')
      })
    },
    async changeEmail() {
      await this.$store.dispatch('fetchChangeEmail', {
        currentEmail: this.securityEmail.currentEmail,
        newEmail: this.securityEmail.newEmail,
        newEmailRepeat: this.securityEmail.newEmailRepeat,
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
