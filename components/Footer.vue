<template>
  <div :class="[bright ? 'footer bright' : 'footer']">
  </div>
</template>

<script>
export default {
  name: "Footer",
  props: {
    bright: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Footer";
</style>
