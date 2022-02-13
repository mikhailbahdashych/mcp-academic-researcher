<template>
  <div>
    <Header />
    <div class="home">
      <h1>Here is login page</h1>
    </div>
  </div>
</template>

<script>
import Header from "@/components/Header";
export default {
  name: "login",
  components: {
    Header
  }
}
</script>

<style lang="scss">
@import "../assets/css/login";
</style>
