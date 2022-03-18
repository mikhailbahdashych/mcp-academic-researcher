<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container center" v-if="!reflink">
      <h1>Generate your referral link, invite friends and get bonuses</h1>
      <p>By generating your own referral link you are able to send it to your friends and make bonuses. C'mon, it's much fun together!</p>
      <Button class="center-button" :label="'Generate referral link'" :clickon="generateRefLink" />
    </div>
    <div class="account-container" v-else>
      <h3>Here is your referral link: {{ reflink }}</h3>
      <p class="paragraph medium">List of clients who has been registered from your link:</p>
    </div>
    <Footer :bright="true" />
  </div>
</template>

<script>
import { generateReferralLink, getReferralLink, getClientsByReferralLink } from "~/api";
export default {
  name: "referral",
  data() {
    return {
      reflink: null
    }
  },
  async mounted() {
    this.reflink = await getReferralLink({ token: localStorage.getItem('token') })
    await getClientsByReferralLink(this.reflink)
  },
  methods: {
    async generateRefLink() {
      await generateReferralLink({ token: localStorage.getItem('token') })
    }
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
