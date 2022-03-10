<template>
  <div :class="[bright ? 'footer' : 'footer bright']">
  </div>
</template>

<script>
export default {
  props: ['bright'],
  name: "Footer"
}
</script>

<style lang="scss">
@import "../assets/css/components/Footer";
</style>
