<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container">
      <h1>Account Information</h1>
      <div class="account-container-info">
        <Panel :title="'UUID'" :text="`Your UUID: ${user.personaluuid}`" />
        <Panel :title="'Email'" :text="`Your email: ${user.email}`" />
        <Panel :title="'Phone'" :text="'Your mobile phone'" />
        <Panel :title="'2FA'" :text="'Your Google Authenticator status'" />
      </div>
    </div>
    <Footer :bright="true" />
  </div>
</template>

<script>
import { verifyUserToken, getUserByToken } from "~/helpers/auth";
export default {
  name: "account",
  data() {
    return {
      user: {}
    }
  },
  async mounted() {
    await verifyUserToken(this.$router)
    this.user = await getUserByToken(this.$router, localStorage.getItem('token'))
    this.hideEmail(this.user.email)
  },
  methods: {
    hideEmail(email) {
      if (email) {
        this.user.email = email.split('@')[0].slice(0, 2) + '**'
          + '@**.' + email.split('.')[email.split('.').length - 1]
      }
    },
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
