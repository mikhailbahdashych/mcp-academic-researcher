<template>
  <div class="referral-container">
    <div class="referral-container-side">
      <div class="referral-container-side-title-box" v-if="reflink.status === -1">
        <h1>Oops... Something went wrong! :(</h1>
      </div>
      <div class="referral-container-side-title-box" v-else>
        <h1>Oh, you are probably from someone's referral program? It's nice to see you!</h1>
        <p class="paragraph medium">Lemme explain what is this and why it's cool.</p>
      </div>
    </div>
    <div class="referral-container-side">
      <div class="referral-container-card">
        <Input :additional-class="'basic-input-box'" :title="'Email'" :disabled="reflink.status === -1" />
        <Input :additional-class="'basic-input-box'" :title="'Password'" :disabled="reflink.status === -1" />
        <Input :additional-class="'basic-input-box'" :title="'Password repeat'" :disabled="reflink.status === -1" />
        <Checkbox :label="`I have read and accepted <a href='/'>terms and conditions.</a>`" :disabled="reflink.status === -1" />
        <Button :label="'Create account'" :disabled="reflink.status === -1" />
      </div>
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
