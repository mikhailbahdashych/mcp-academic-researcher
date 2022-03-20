<template>
  <div>
    <Popup :content="'Copied!'" v-if="showPopup" />
    <Header />
    <AccountHeader />
    <div class="account-container wide referral-panel">
      <div class="home-base referral-panel">
        <div class="home-text-box referral-panel">
          <div class="home-welcome">
            <h1 class="title">Welcome to referral panel!</h1>
            <h1 class="title small-title">Generate your referral link, invite friends and earn bonuses bonuses.</h1>
            <h1 class="title small-content">Make from 20$ up to 1000$ from every invited friend. C'mon, it's much fun together!</h1>
            <p class="paragraph medium">For more information see <span class="paragraph medium link">FAQ</span>.</p>
          </div>
        </div>
      </div>
      <div class="referral-panel-card-container">
        <div class="referral-panel-card" v-if="reflink.status === -1">
          <p class="paragraph medium">If you feel ready to go, click the button to generate referral link.</p>
          <Button :label="'Generate referral link'" :clickon="generateRefLink" />
        </div>
        <div class="referral-panel-card" v-else>
          <div class="referral-panel-card-header">
            <div v-for="setting in settingsHeaders" :class="[setting.active ? 'active': '']" class="referral-panel-card-header-item">
              <p class="paragraph" @click="changeRef(setting)">{{ setting.title }}</p>
            </div>
          </div>
          <div v-if="settingsHeaders[0].active">
            <input id="reflink" :value="`http://localhost:8010/reflink/${reflink.reflink}`" type="hidden" />
            <input id="refcode" :value="`${reflink.reflink}`" type="hidden" />
            <InputWithButton
              :title="'Referral code'"
              :button-title="'Copy'"
              :readonly="true"
              :value="reflink.reflink"
              :button-click-on="copyCode"
              :select="test"
              :focus="test"
            />
            <InputWithButton
              :title="'Referral link'"
              :button-title="'Copy'"
              :disabled="true"
              :value="`localhost:8010/reflink/${reflink.reflink}`"
              :button-click-on="copyLink"
            />
          </div>
          <div v-else>
            <h1>Here is qr</h1>
          </div>
          <p class="paragraph opacity">Or share this link in social networks</p>
        </div>
      </div>
    </div>

<!--      <p class="paragraph medium" v-if="!reflink.invitedclients">There is no clients registered by your referral link :(</p>-->
<!--      <div v-else>-->
<!--        <p class="paragraph medium">List of clients who has been registered from your link:</p>-->
<!--        <BasicTable :headers="['Email', 'Invited at']" :items="reflink.invitedclients" />-->
<!--      </div>-->
<!--    </div>-->
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
      showPopup: false,
      test: false,
      settingsHeaders: [
        { title: 'With link', active: true },
        { title: 'With QR code', active: false },
      ],
    }
  },
  async mounted() {
    await verifyClientByToken(this.$router, localStorage.getItem('token'))
    this.reflink = await getReferralLink({ token: localStorage.getItem('token') })
  },
  methods: {
    changeRef(s) {
      this.settingsHeaders.forEach(item => {
        item.active = item.title === s.title;
      })
    },
    async generateRefLink() {
      await generateReferralLink({ token: localStorage.getItem('token') })
      .then((res) => { if (res.status === 1) window.location.reload() })
    },
    copyCode() {
      const input = document.querySelector(`#refcode`)
      input.setAttribute('type', 'text')
      input.select()
      document.execCommand('copy')
      input.setAttribute('type', 'hidden')
      this.showPopup = true
      this.test = true
      setTimeout(() => { this.showPopup = false }, 1500)
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
@import "../../assets/css/home";
</style>
