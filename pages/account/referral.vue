<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container center">
      <h1>Generate your referral link, invite friends and get bonuses</h1>
      <p>By generating your own referral link you are able to send it to your friends and make bonuses. C'mon, it's much fun together!</p>
      <Button class="center-button" :label="'Generate referral link'" :clickon="generateRefLink" />
    </div>
    <Footer :bright="true" />
  </div>
</template>

<script>
import { generateReferralLink } from "~/api";
export default {
  name: "referral",
  methods: {
    async generateRefLink() {
      const res = await generateReferralLink({ token: localStorage.getItem('token') })
    }
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
