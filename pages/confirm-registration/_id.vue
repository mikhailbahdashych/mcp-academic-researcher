<template>
  <div class="login">

    <div class="login-content">
      <h1 @click="redirect('/')">Logo</h1>
    </div>

    <div class="login-inputs">
      <div class="login-inputs-container">
        <h1>Here is some text fomr confirm registr</h1>
      </div>
    </div>

  </div>
</template>

<script>
import { confirmRegistration } from "~/api";
export default {
  name: "confirm-registration",
  async mounted() {
    if (this.$route.params.id) {
      await confirmRegistration({ confirmToken: this.$route.params.id })
      .then((res) => {
        console.log(res)
      })
    } else {
      this.redirect('/')
    }
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
