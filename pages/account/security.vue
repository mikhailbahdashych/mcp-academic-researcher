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
            <Input :additional-class="'basic-input-box'" :title="'Current email'" :type="'email'" v-model="securityCurrentEmail" />
            <Input :additional-class="'basic-input-box'" :title="'New email'" :type="'email'" v-model="securityNewEmail" />
            <Input :additional-class="'basic-input-box margin-bottom-20'" :title="'Repeat new email'" :type="'email'" v-model="securityNewEmailRepeat" />
            <Button :label="'Change email'" :clickon="changeEmail" />
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
            <p>Set two-factor authentication to secure you account. Strongly recommended!</p>
            <Button :label="'Click here to generate and set 2FA'" :clickon="generate2fa" />
            <p v-if="securityToken.status === 1">2FA is set!</p>
            <p v-else>You have not set 2FA for now!</p>
            <basic-modal
              @close="closeModal"
              v-if="show2faModal"
              header="Closing account"
              description="We are very sorry to see you go. In order to permanently delete your account, please enter your password in the field below"
            >
              <h4>Test</h4>
              <p>Here is some test modal text</p>
            </basic-modal>
<!--            <settings-modal @close="closeModal" v-if="showModal.closingAccount" header="Closing account"-->
<!--                            description="We are very sorry to see you go. In order to permanently delete your account, please enter your password in the field below">-->
<!--              <h4>Current password</h4>-->
<!--              <input-password-->
<!--                name="closingAccountPassword"-->
<!--                v-model="closingAccount.password"-->
<!--                placeholder="Your current password"-->
<!--                v-validate="'required|'"-->
<!--              >-->
<!--              </input-password>-->
<!--              <div v-if="modalError" class="closing-accounts-error"><p>{{ modalError }}</p></div>-->
<!--              <base-button-->
<!--                white-->
<!--                style="width: 150px;"-->
<!--                @click.native="closeAccount"-->
<!--              >-->
<!--                Close account-->
<!--              </base-button>-->
<!--            </settings-modal>-->
          </div>
        </div>
        <div class="security-container">
          <div class="inner-block">
            <p>Set two-factor authentication to secure you account. Strongly recommended!</p>
            <Button :label="'Click here to generate and set 2FA'" :clickon="generate2fa" />
            <p v-if="securityToken.status === 1">2FA is set!</p>
            <p v-else>You have not set 2FA for now!</p>
            <!--            <img :src="securityToken.qr" alt="2fa">-->
            <!--            <Input :title="'Code'" :type="'text'" v-model="securityCode" />-->
            <!--            <Button :label="'Set 2FA'" :clickon="set2fa" />-->
            <p v-if="securityToken.status === 1">2fa setted</p>
            <p v-else>2fa not setted</p>
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
import * as node2fa from "node-2fa";
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
  data() {
    return {
      show2faModal: false
    }
  },
  methods: {
    async set2fa() {
      await this.$store.dispatch('fetchSet2fa', {
        code: this.securityCode,
        token: this.securityToken,
        jwt: localStorage.getItem('token')
      })
    },
    closeModal() {
      this.show2faModal = false
    },
    generate2fa() {
      this.show2faModal = true
      // this.securityToken = node2fa.generateSecret({
      //   name: 'Bot crypto trader', account: 'dupa@dupa.com'
      // })
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
