<template>
  <div>
    <Header :dark="scrollPosition < 640" />

  </div>
</template>

<script>
import { darkHeader } from "~/mixins/darkHeader";
export default {
  name: "blog",
  mixins: [ darkHeader ]
}
</script>

<style lang="scss">
@import "../assets/css/home";
</style>
