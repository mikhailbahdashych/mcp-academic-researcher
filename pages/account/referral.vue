<template>
  <div>
    <Popup :content="'Copied!'" v-if="showPopup.status" />
    <Header />
    <AccountHeader />
    <div class="account-container referral-panel">

      <div class="referral-panel">
        <div class="referral-panel-welcome-texts">
          <h1>Welcome to referral panel!</h1>
          <h1 class="medium">Generate your referral link, invite friends and earn bonuses.</h1>
          <h1 class="small">Make from 20$ up to 1000$ from every invited friend. C'mon, it's much fun together!</h1>
          <p class="paragraph medium">For more information see <span class="paragraph medium link">FAQ</span>.</p>
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
              @show="copyCode('refcode')"
              :select="showPopup.refcode"
            />
            <InputWithButton
              :title="'Referral link'"
              :button-title="'Copy'"
              :readonly="true"
              :value="`localhost:8010/reflink/${reflink.reflink}`"
              @show="copyCode('reflink')"
              :select="showPopup.reflink"
            />
          </div>
          <div class="qr-side" v-else>
            <p class="paragraph medium">Invite by QR code</p>
            <img class="qr-code" :src="reflink.qrcode" alt="QR" style="border-radius: 3px">
          </div>
          <p class="paragraph opacity">Or share this link in social networks</p>
        </div>
      </div>

    </div>

    <div class="invited-clients" v-if="reflink.status !== -1">
      <BasicTable :headers="['Email', 'Invited at']" :items="reflink.invitedclients" />
    </div>

    <Footer :bright="true" />
  </div>
</template>

<script>
import { generateReferralLink, getReferralLink } from "@/api/reflink";
import { verifyClientByToken } from "~/helpers/auth";
export default {
  name: "referral",
  data() {
    return {
      reflink: {},
      showPopup: { status: false, refcode: false, reflink: false },
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
    copyCode(t) {
      const input = document.querySelector(`#${t}`)
      input.setAttribute('type', 'text')
      input.select()
      document.execCommand('copy')
      input.setAttribute('type', 'hidden')

      this.showPopup.status = true
      if (t === 'refcode') this.showPopup.refcode = true
      else this.showPopup.reflink = true

      setTimeout(() => {
        this.showPopup.status = false
        this.showPopup.refcode = false
        this.showPopup.reflink = false
      }, 1500)
    }
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account/account";
@import "../../assets/css/account/referral";
@import "../../assets/css/home";
</style>
