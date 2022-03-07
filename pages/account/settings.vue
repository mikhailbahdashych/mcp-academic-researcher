<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container"></div>
  </div>
</template>

<script>
import { verifyUserToken } from "~/helpers/auth";
export default {
  name: "settings",
  async mounted() {
    await verifyUserToken(this.$router)
  }
}
</script>

<style scoped>

</style>
