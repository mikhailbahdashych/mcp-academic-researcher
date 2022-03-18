<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container center" v-if="reflink.status === -1">
      <h1>Generate your referral link, invite friends and get bonuses</h1>
      <p>By generating your own referral link you are able to send it to your friends and make bonuses. C'mon, it's much fun together!</p>
      <Button class="center-button" :label="'Generate referral link'" :clickon="generateRefLink" />
    </div>
    <div class="account-container" v-else>

      <input id="reflink" :value="`http://localhost:8010/register/${reflink}`" type="hidden" />
      <p class="paragraph medium">
        Here is your referral link (click on to copy):
        <span class="paragraph link average pointer" @click="copyLink">http://localhost:8010/register/{{ reflink }}</span>
      </p>

      <p class="paragraph medium" v-if="reflinkclients.length === 0">There is no clients registered by your referral link :(</p>
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
      reflink: {},
      reflinkclients: []
    }
  },
  async mounted() {
    this.reflink = await getReferralLink({ token: localStorage.getItem('token') })
    this.reflinkclients = await getClientsByReferralLink(this.reflink)
  },
  methods: {
    async generateRefLink() {
      await generateReferralLink({ token: localStorage.getItem('token') })
    },
    copyLink() {
      const input = document.querySelector(`#reflink`)
      input.setAttribute('type', 'text')
      input.select()
      document.execCommand('copy')
      input.setAttribute('type', 'hidden')
    }
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
