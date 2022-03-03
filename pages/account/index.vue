<template>
  <div>
    <Header />
    <AccountHeader />
  </div>
</template>

<script>
import Header from "~/components/Header";
import AccountHeader from "~/components/AccountHeader";
export default {
  name: "account",
  components: {
    Header,
    AccountHeader
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
