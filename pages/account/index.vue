<template>
  <div>
    <Header />
  </div>
</template>

<script>
import { verifyUserToken } from "@/helpers/auth";
import Header from "~/components/Header";
export default {
  name: "account",
  components: {
    Header
  },
  async mounted() {
    await verifyUserToken(this.$router)
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
