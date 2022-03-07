<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container"></div>
  </div>
</template>

<script>
import { verifyUserToken } from "~/helpers/auth";
import AccountHeader from "~/components/AccountHeader";
import Header from "~/components/Header";
export default {
  name: "settings",
  components: {
    AccountHeader,
    Header
  },
  async mounted() {
    await verifyUserToken(this.$router)
  }
}
</script>

<style scoped>

</style>
