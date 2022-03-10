<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container">

    </div>
    <Footer :bright="true" />
  </div>
</template>

<script>
import { verifyUserToken } from "~/helpers/auth";
export default {
  name: "account",
  async mounted() {
    await verifyUserToken(this.$router)
  },
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
