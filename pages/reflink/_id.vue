<template>
  <div class="referral-container">
    <div class="referral-container-side">
      <div class="referral-container-side-title-box">
        <h1>Oh, you are probably from someone's referral program? It's nice to see you!</h1>
        <p class="paragraph medium">Lemme explain what is this and why it's cool.</p>
      </div>
<!--      <p class="paragraph">Oops... Something went wrong!</p>-->
    </div>
    <div class="referral-container-side">
      <div class="referral-container-card"></div>
<!--      <p class="paragraph">{{ reflink }}</p>-->
    </div>
  </div>
</template>

<script>
import { registrationFromReflink } from "~/api";
export default {
  name: "reflink",
  data() {
    return {
      reflink: {}
    }
  },
  async mounted() {
    if (!this.$route.params.id) return this.redirect('/')
    this.reflink = await registrationFromReflink(this.$route.params.id)
  },
  methods: {
    redirect(path) {
      this.$router.push({ path })
    },
  }
}
</script>

<style lang="scss">
@import "../../assets/css/referral";
</style>
