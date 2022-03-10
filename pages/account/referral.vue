<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container"></div>
    <Footer :bright="true" />
  </div>
</template>

<script>
export default {
  name: "referral"
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
