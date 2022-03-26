<template>
  <div>
    <Header :dark="scrollPosition < 640" />

    <Footer :bright="true"/>
  </div>
</template>

<script>
import { darkHeader } from "~/mixins/darkHeader";
export default {
  name: 'IndexPage',
  mixins: [ darkHeader ]
}
</script>

<style lang="scss">
@import "../assets/css/home";
</style>
