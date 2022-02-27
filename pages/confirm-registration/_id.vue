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
export default {
  name: "confirm-registration",
  mounted() {
    console.log(this.$route.params.id)
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
