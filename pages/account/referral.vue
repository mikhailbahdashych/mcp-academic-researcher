<template>
  <div>
    <Popup :content="'Copied!'" v-if="showPopup" />
    <Header />
    <AccountHeader />
    <div class="account-container center" v-if="reflink.status === -1">
      <h1>Generate your referral link, invite friends and get bonuses</h1>
      <p>By generating your own referral link you are able to send it to your friends and make bonuses. C'mon, it's much fun together!</p>
      <Button class="center-button" :label="'Generate referral link'" :clickon="generateRefLink" />
    </div>
    <div class="account-container" v-else>

      <input id="reflink" :value="`http://localhost:8010/reflink/${reflink.reflink}`" type="hidden" />
      <p class="paragraph medium">
        Here is your referral link (click on to copy):
        <span class="paragraph link average" @click="copyLink">localhost:8010/reflink/{{ reflink.reflink }}</span>
      </p>

      <p class="paragraph medium" v-if="!reflink.invitedclients">There is no clients registered by your referral link :(</p>
      <div v-else>
        <p class="paragraph medium">List of clients who has been registered from your link:</p>
<!--        <BasicTable :headers="['Email', 'Invited at', 'Amount']" :items="reflink.invitedclients" />-->
        <BasicTable :headers="[{title: 'Email', field: 'email'}, {title: 'Invited at', field: 'Invited at'}]" :items="reflink.invitedclients" />
      </div>
    </div>
    <Footer :bright="true" />
  </div>
</template>

<script>
import { generateReferralLink, getReferralLink } from "~/api";
import { verifyClientByToken } from "~/helpers/auth";
export default {
  name: "referral",
  data() {
    return {
      reflink: {},
      showPopup: false
    }
  },
  async mounted() {
    await verifyClientByToken(this.$router, localStorage.getItem('token'))
    this.reflink = await getReferralLink({ token: localStorage.getItem('token') })
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
      this.showPopup = true
      setTimeout(() => { this.showPopup = false }, 1500)
    }
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
