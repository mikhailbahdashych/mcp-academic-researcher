<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container center">
      <h1>Generate your referral link, invite friends and get bonuses</h1>
      <p>By generating your own referral link you are able to send it to your friends and make bonuses. C'mon, it's much fun together!</p>
      <Button class="center-button" :label="'Generate referral link'" />
    </div>
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
