<template>
  <div class="login">

    <div class="login-content">
      <h1 @click="redirect('/')">Logo</h1>
    </div>

    <div class="login-inputs">
      <div class="login-inputs-container">
        <h1 v-if="status === null">Trying to confirm your email</h1>
        <h1 v-else-if="status === 1">Your email was successfully confirmed</h1>
        <h1 v-else-if="status === -2">The link has expired!</h1>
        <h1 v-else>Something went wrong :(</h1>
      </div>
    </div>

  </div>
</template>

<script>
import { confirmRegistration } from "~/api";
export default {
  name: "confirm-registration",
  data() {
    return {
      status: null
    }
  },
  async mounted() {
    if (!this.$route.params.id) return this.redirect('/')
    await confirmRegistration({ confirmToken: this.$route.params.id })
      .then((res) => {
        this.status = res.status
      })
  },
  methods: {
    redirect(path) {
      this.$router.push({ path })
    },
  }
}
</script>

<style lang="scss">
@import "../../assets/css/login";
</style>
