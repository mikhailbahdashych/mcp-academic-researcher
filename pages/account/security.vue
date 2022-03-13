<template>
  <div>
    <Header />
    <AccountHeader />

    <div class="account-container">
      <div :class="`account-container-item ${item.title === 'Freeze account' || item.title === 'Close account' ? 'danger' : ''}`"
           v-for="item in securityOptions">
        <div class="account-container-item-icon"></div>
        <div class="account-container-item-icon-texts">

          <div class="account-container-item-icon-texts title">
            <p class="paragraph large bold">{{ item.title }}</p>
          </div>
          <div class="account-container-item-icon-texts text">
            <p class="paragraph opacity">{{ item.text }}</p>
          </div>

        </div>

        <div class="account-container-item-button">
          <Button :label="'Change password'" @show="showModal(item.showModalParam)" />
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
  data() {
    return {
      funcName: 'test'
    }
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
    this.hideEmail(localStorage.getItem('email'))
    await verifyUserToken(this.$router)
    await this.$store.dispatch('fetchCheck2fa', {token: localStorage.getItem('token')})
  },
  methods: {
    test() { console.log('testtesttest') },
    closeModal(modal) { this.$store.dispatch('fetchSecurityShowModal', {[modal]: false}) },
    showModal(modal) { this.$store.dispatch('fetchSecurityShowModal', {[modal]: true}) },
    hideEmail(email) {
      if (email) {
        this.securityEmail.email = email.split('@')[0].slice(0, 2) + '**'
          + '@**.' + email.split('.')[email.split('.').length - 1]
      }
    },
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
      this.$store.dispatch('fetchGenerate2fa', { name: 'CTD.com', account: this.email })
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
