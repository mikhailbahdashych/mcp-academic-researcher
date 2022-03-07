<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container">

    </div>
  </div>
</template>

<script>
import { verifyUserToken } from "~/helpers/auth";
import Header from "~/components/Header";
import AccountHeader from "~/components/AccountHeader";
export default {
  name: "account",
  components: {
    Header,
    AccountHeader
  },
  async mounted() {
    await verifyUserToken(this.$router)
  },
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
