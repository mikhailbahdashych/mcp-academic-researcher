<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container">
      <h1>Account Information</h1>
      <div class="account-container-info">
        <Panel :title="'UUID'" :text="`Your UUID: ${client.personaluuid}`" />
        <Panel :title="'Email'" :text="`Your email: ${client.email}`" />
        <Panel :title="'Phone'" :text="'Your mobile phone'" />
        <Panel :title="'2FA'" :text="'Your Google Authenticator status'" />
      </div>
    </div>
    <Footer :bright="true" />
  </div>
</template>

<script>
import { verifyClientByToken } from "~/helpers/auth";
export default {
  name: "account",
  data() {
    return {
      client: {}
    }
  },
  async mounted() {
    this.client = await verifyClientByToken(this.$router, localStorage.getItem('token'), true)
    this.hideEmail(this.client.email)
  },
  methods: {
    hideEmail(email) {
      if (email) {
        this.client.email = email.split('@')[0].slice(0, 2) + '**'
          + '@**.' + email.split('.')[email.split('.').length - 1]
      }
    },
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
