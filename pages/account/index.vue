<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container">
      <div class="account-container-wrap">
        <h1>Account Information</h1>
        <div class="account-container-info">
          <Panel :title="'UUID'" :text="`Your UUID: ${client.personaluuid}`" />
          <Panel :title="'Email'" :text="`Your email: ${client.email}`" :img="'email'" />
          <Panel :title="'Phone'" :text="'Your mobile phone'" :img="'phone'" />
          <Panel :title="'2FA'" :text="'Your Google Authenticator status'" :img="'google'" />
        </div>
        <h1>Wallets</h1>
        <!--      <div class="account-container-info" v-for="wallet in client.wallets">-->
        <!--        <Panel :title="`${wallet.shortname}`" :text="`${wallet.name}`" />-->
        <!--      </div>-->
      </div>
    </div>
    <Footer :bright="true" />
  </div>
</template>

<script>
import { verifyClientByToken } from "~/helpers/auth";
import { checkWallets } from "~/api/wallet";
export default {
  name: "account",
  data() {
    return {
      client: {}
    }
  },
  async mounted() {
    this.client = await verifyClientByToken(this.$router, localStorage.getItem('token'), true)
    // this.client.wallets = await checkWallets({ token: localStorage.getItem('token') })
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account/account";
</style>
