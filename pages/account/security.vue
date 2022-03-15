<template>
  <div>
    <Header />
    <AccountHeader />

    <div class="account-container">
      <div :class="`account-container-item ${item.title === 'Freeze account' || item.title === 'Close account' ? 'danger' : ''}`"
           v-for="item in securityOptions">
        <div class="account-container-item-icon"></div>
        <div class="account-container-item-icon-texts">
          <div class="account-container-item-icon-texts" v-if="item.title === 'Freeze account' || item.title === 'Close account'">
            <p class="paragraph large bold error">{{ item.title }}</p>
          </div>
          <div class="account-container-item-icon-texts text" v-else>
            <p class="paragraph large bold">{{ item.title }}</p>
          </div>
          <div class="account-container-item-icon-texts text">
            <p class="paragraph opacity">{{ item.text }}</p>
          </div>
        </div>
        <div class="account-container-item-button" v-if="item.title === 'Google Authenticator'">
          <Button v-if="[1, -4].includes(securityTwofa.status)" :label="`Disable 2FA`" @show="showModal('disable2fa')" />
          <Button v-else-if="securityTwofa.status !== -4" :label="`${item.buttonTitle}`" @show="showModal(item.showModalParam)" />
        </div>
        <div class="account-container-item-button" v-else>
          <Button :label="`${item.buttonTitle}`" @show="showModal(item.showModalParam)" />
        </div>
      </div>
    </div>

    <basic-modal
      @close="closeModal('changePassword')"
      v-if="securityShowModal.changePassword"
      header="Change password"
      description="Are you sure you want to change password?"
    >
      <Input
        :outer-class="'wide'"
        :title="'Current password'"
        :title-class="'on-white-paragraph'"
        :additional-class="'on-white'"
        :type="'password'"
        v-model="securityPassword.currentPassword"
      />
      <Input
        :outer-class="'wide'"
        :title="'New password'"
        :title-class="'on-white-paragraph'"
        :additional-class="'on-white'"
        :type="'password'"
        v-model="securityPassword.newPassword"
      />
      <Input
        :outer-class="'wide'"
        :title-class="'on-white-paragraph'"
        :additional-class="'on-white margin-bottom-20'"
        :title="'Repeat new password'"
        :type="'password'"
        v-model="securityPassword.newPasswordRepeat"
      />
      <Button :label="'Change password'" :clickon="changePassword" />
    </basic-modal>

    <basic-modal
      @close="closeModal('changeEmail')"
      v-if="securityShowModal.changeEmail"
      header="Change email"
      description="Be careful! You are able to change email only one time."
    >
      <Input
        :outer-class="'wide'"
        :type="'email'"
        :title="'Current email'"
        :title-class="'on-white-paragraph'"
        :additional-class="'on-white'"
        :oneerror="securityEmail.currentEmailError"
        v-model="securityEmail.currentEmail"
      />
      <Input
        :outer-class="'wide'"
        :type="'email'"
        :title="'New email'"
        :title-class="'on-white-paragraph'"
        :additional-class="'on-white'"
        :oneerror="securityEmail.newEmailError"
        v-model="securityEmail.newEmail"
      />
      <Input
        :outer-class="'wide'"
        :type="'email'"
        :title="'Repeat new email'"
        :title-class="'on-white-paragraph'"
        :additional-class="'on-white margin-bottom-20'"
        :oneerror="securityEmail.newEmailRepeatError"
        v-model="securityEmail.newEmailRepeat"
      />
      <Button :label="'Change email'" :clickon="changeEmail" />
    </basic-modal>

    <basic-modal
      @close="closeModal('ga')"
      v-if="securityShowModal.ga"
      header="Activate 2FA"
      description="We strongly recommend you to 2FA.
      This will increase the security of you account.
      Before it, you should download Google Authenticator application.
      Once it's done, click the button below to start."
    >
      <Button v-if="!securityTwofa.qr" :label="'Generate 2FA'" :clickon="generate2fa" />
      <img v-if="securityTwofa.qr && ([null, -1, -2].includes(securityTwofa.status))" :src="securityTwofa.qr" alt="2fa">
      <div v-if="securityTwofa.qr && ([null, -1, -2].includes(securityTwofa.status))">
        <Input :title-class="'on-white-paragraph'" :additional-class="'basic-input-box on-white margin-bottom-20'" :title="'Provide 6-digit code'" :placeholder="'XXXXXX'" :type="'text'" v-model="securityTwofa.code" />
        <Button :label="'Confirm 2FA'" :clickon="set2fa" />
      </div>
      <div v-else-if="securityTwofa.status === 1">
        <p class="paragraph medium on-white-paragraph">2FA set successfully</p>
      </div>
      <div v-if="securityTwofa.status === -1">
        <p class="paragraph medium error">Wrong code!</p>
      </div>
    </basic-modal>

    <basic-modal
      @close="closeModal('disable2fa')"
      v-if="securityShowModal.disable2fa"
      header="Disable 2FA"
      description="Are you sure you want to do this?
      If you are, provide code below."
    >
      <Input :title-class="'on-white-paragraph'" :additional-class="'margin-bottom-20 on-white'" :title="'Provide 6-digit code'" :placeholder="'XXXXXX'" :type="'text'" v-model="securityTwofa.code" :disabled="securityTwofa.status === -3" />
      <Button :label="'Disable 2FA'" :clickon="deactivate2fa" :disabled="securityTwofa.status === -3" />
      <div v-if="securityTwofa.status === -3">
        <p class="paragraph medium on-white-paragraph">Successfully deactivated!</p>
      </div>
      <div v-else-if="securityTwofa.status === -4">
        <p class="paragraph medium error">Wrong code!</p>
      </div>
    </basic-modal>

    <basic-modal
      @close="closeModal('sms')"
      v-if="securityShowModal.sms"
      header="Verify mobile phone"
      description="Here is some text text."
    >
    </basic-modal>

    <basic-modal
      @close="closeModal('freezeAccount')"
      v-if="securityShowModal.freezeAccount"
      header="Freeze account"
      description="Are you sure you want to freeze account"
    >
      <Button :label="'Freeze account'" :clickon="() => {}" />
    </basic-modal>

    <basic-modal
      @close="closeModal('closingAccount')"
      v-if="securityShowModal.closingAccount"
      header="Close account"
      description="Are you sure you want to close account? You won't be able to restore your data!"
    >
      <Button :label="'Close account'" :clickon="closeAccount" />
    </basic-modal>

    <Footer :bright="true" />
  </div>
</template>

<script>
import { getUserByToken } from "~/helpers/auth";
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
    },
    securityOptions: {
      get() { return this.$store.getters.getSecurityOptions },
    }
  },
  destroyed() {
    this.$store.commit('setSecurityDefaultValues')
  },
  async mounted() {
    await getUserByToken(this.$router, localStorage.getItem('token'))
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
      this.$store.dispatch('fetchGenerate2fa', { name: 'CTD.com', account: localStorage.getItem('email') })
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
