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
            <img :src="token.qr" alt="2fa">
            <Input :title="'Code'" :type="'text'" v-model="code" />
            <Button :label="'Set 2FA'" :clickon="set2fa" />
            <p v-if="twofaStatus.status === 1">2fa setted</p>
            <p v-else>2fa not setted</p>
          </div>
        </div>
        <div class="security-container">
          <div class="inner-block">
            <p>Change your password</p>
            <Input :additional-class="'basic-input-box'" :title="'Current password'" :type="'password'" v-model="currentPassword" />
            <Input :additional-class="'basic-input-box'" :title="'New password'" :type="'password'" v-model="newPassword" />
            <Input :additional-class="'basic-input-box margin-bottom-20'" :title="'Repeat new password'" :type="'password'" v-model="newPasswordRepeat" />
            <Button :label="'Change password'" :clickon="changePassword" />
          </div>
        </div>
      </div>
      <div class="account-containers">
        <div class="security-container">
          <div class="inner-block">
            <p>Change email</p>
            <Input :additional-class="'basic-input-box'" :title="'Current email'" :type="'email'" v-model="currentEmail" />
            <Input :additional-class="'basic-input-box'" :title="'New email'" :type="'email'" v-model="newEmail" />
            <Input :additional-class="'basic-input-box margin-bottom-20'" :title="'Repeat new email'" :type="'email'" v-model="newEmailRepeat" />
            <Button :label="'Change email'" :clickon="changeEmail" />
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
import { set2fa, verify2fa, changePassword, closeAccount, changeEmail } from "~/api";
import { verifyUserToken } from "~/helpers/auth";
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
  data() {
    return {
      code: null,
      token: {},
      twofaStatus: {},

      currentPassword: null,
      newPassword: null,
      newPasswordRepeat: null,

      currentEmail: null,
      newEmail: null,
      newEmailRepeat: null
    }
  },
  async mounted() {
    await verifyUserToken(this.$router)
    await this.check2fa()
  },
  methods: {
    async set2fa() {
      await set2fa({
        code: this.code,
        token: this.token,
        jwt: localStorage.getItem('token')
      })
    },
    generate2fa() {
      this.token = node2fa.generateSecret({
        name: 'Bot crypto trader', account: 'dupa@dupa.com'
      })
    },
    async check2fa() {
      this.twofaStatus = await verify2fa({token: localStorage.getItem('token')})
    },
    async changePassword() {
      const response = await changePassword({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
        newPasswordRepeat: this.newPasswordRepeat,
        token: localStorage.getItem('token')
      })
      if (response.status === 1) {
        localStorage.removeItem('token')
        await this.$router.push({ path: '/' })
      }
    },
    async changeEmail() {
      await changeEmail()
    },
    async closeAccount() {
      const response = await closeAccount({ token: localStorage.getItem('token') })
      if (response.status === 1) {
        localStorage.removeItem('token')
        await this.$router.push({ path: '/' })
      }
    }
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
