<template>
  <div>
    <Header :dark="scrollPosition < 640" />

    <Footer />
  </div>
</template>

<script>
import { darkHeader } from "~/mixins/darkHeader";
export default {
  name: "contact",
  mixins: [ darkHeader ],
}
</script>

<style lang="scss">
@import "../assets/css/home";
</style>
