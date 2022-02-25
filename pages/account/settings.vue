<template>
  <div>
    <Header />
    <AccountHeader />
  </div>
</template>

<script>
import AccountHeader from "~/components/AccountHeader";
import Header from "~/components/Header";
export default {
  name: "settings",
  components: {
    AccountHeader,
    Header
  }
}
</script>

<style scoped>

</style>
