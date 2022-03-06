<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container">
      <h1>Here is security subpage</h1>
      <div class="account-containers">
        <div class="security-container">
          <div class="inner-block">
            <p>Change email</p>
            <Input :additional-class="'basic-input-box'" :title="'Current email'" :type="'email'" v-model="securityEmail.currentEmail" />
            <Input :additional-class="'basic-input-box'" :title="'New email'" :type="'email'" v-model="securityEmail.newEmail" />
            <Input :additional-class="'basic-input-box margin-bottom-20'" :title="'Repeat new email'" :type="'email'" v-model="securityEmail.newEmailRepeat" />
            <Button :label="'Change email'" :clickon="changeEmail" />
          </div>
        </div>

        <div class="security-container">
          <div class="inner-block">
            <p>Change your password</p>
            <Input :additional-class="'basic-input-box'" :title="'Current password'" :type="'password'" v-model="securityPassword.currentPassword" />
            <Input :additional-class="'basic-input-box'" :title="'New password'" :type="'password'" v-model="securityPassword.newPassword" />
            <Input :additional-class="'basic-input-box margin-bottom-20'" :title="'Repeat new password'" :type="'password'" v-model="securityPassword.newPasswordRepeat" />
            <Button :label="'Change password'" :clickon="changePassword" />
          </div>
        </div>
      </div>
      <div class="account-containers">
        <div class="security-container">
          <div class="inner-block">
            <p>Set two-factor authentication to secure you account. Strongly recommended!</p>
            <Button v-if="this.$store.getters.getSecurity2fa.status === 1" :label="'Disable 2FA'" @show="showModal('disable2fa')" />
            <Button v-else :label="'Click here to generate and set 2FA'" @show="showModal('ga')" />
            <p v-if="this.$store.getters.getSecurity2fa.status === 1">2FA is set!</p>
            <p v-else>You have not set 2FA for now!</p>
            <basic-modal
              @close="closeModal('ga')"
              v-if="securityShowModal.ga"
              header="Generating 2FA"
              description="We strongly recommend you to 2FA.
              This will increase the security of you account.
              Before it, you should download Google Authenticator application.
              Once it's done, click the button below to start."
            >
              <Button v-if="!this.$store.getters.getSecurity2fa.qr" :label="'Generate 2FA'" :clickon="generate2fa" />
              <img v-if="this.$store.getters.getSecurity2fa.qr && (this.$store.getters.getSecurity2fa.status === null || this.$store.getters.getSecurity2fa.status === -2 || this.$store.getters.getSecurity2fa.status === -1)" :src="this.$store.getters.getSecurity2fa.qr" alt="2fa">
              <div v-if="this.$store.getters.getSecurity2fa.qr && (this.$store.getters.getSecurity2fa.status === null || this.$store.getters.getSecurity2fa.status === -2 || this.$store.getters.getSecurity2fa.status === -1)">
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
              header="Disabling 2FA"
              description="Are you sure you want to do this?
              If you are, provide code below."
            >
              <Input :title-class="'on-white-paragraph'" :additional-class="'margin-bottom-20 on-white'" :title="'Provide 6-digit code'" :placeholder="'XXXXXX'" :type="'text'"  />
              <Button :label="'Disable 2FA'" :clickon="deactivate2fa" />
            </basic-modal>
          </div>
        </div>
        <div class="security-container">
          <div class="inner-block">

          </div>
        </div>
        <div class="security-container">
          <div class="inner-block">
            <p>Close account</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquam animi at dolores doloribus earum eius, omnis pariatur quos tempore velit! Aspernatur dolores fugit incidunt iure iusto nobis perferendis praesentium, repudiandae? Accusantium adipisci corporis dolorem doloribus error fugit, harum ipsam iure minima mollitia, pariatur placeat praesentium quae quas, quisquam rem vel?</p>
            <Button :label="'Close account'" :clickon="closeAccount" />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { verifyUserToken } from "~/helpers/auth";
import { mapActions } from "vuex";
import Input from "~/components/Input";
import Button from "~/components/Button";
import AccountHeader from "~/components/AccountHeader";
import BasicModal from "~/components/BasicModal";
export default {
  name: "security",
  components: {
    Input,
    Button,
    AccountHeader,
    BasicModal
  },
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
    ])
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
    async set2fa() {
      await this.$store.dispatch('fetchSet2fa', {
        code: this.securityTwofa.code,
        token: this.securityTwofa.secret,
        jwt: localStorage.getItem('token')
      })
    },
    async deactivate2fa() {
      await this.$store.dispatch('fetchDisable2fa', {

      })
    },
    generate2fa() {
      this.$store.dispatch('fetchGenerate2fa', { name: 'asdas', account: 'asdasd' })
    },
    closeModal(modal) { this.$store.dispatch('fetchSecurityShowModal', {[modal]: false}) },
    showModal(modal) { this.$store.dispatch('fetchSecurityShowModal', {[modal]: true}) },
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
