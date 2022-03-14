<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container">
      <h1>Account Information</h1>
      <div class="account-container-info">
        <Panel />
        <Panel />
        <Panel />
      </div>
    </div>
    <Footer :bright="true" />
  </div>
</template>

<script>
import { verifyUserToken } from "~/helpers/auth";
export default {
  name: "account",
  data() {
    return {
      email: null
    }
  },
  async mounted() {
    await verifyUserToken(this.$router)
    this.hideEmail(localStorage.getItem('email'))
  },
  methods: {
    hideEmail(email) {
      if (email) {
        this.email = email.split('@')[0].slice(0, 2) + '**'
          + '@**.' + email.split('.')[email.split('.').length - 1]
      }
    },
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
