<template>
  <div :class="[bright ? 'footer bright' : 'footer']">
    <div class="footer-block up">
      <div class="footer-item">
        <p class="paragraph medium bold">About us</p>
        <p class="paragraph average">Test</p>
        <p class="paragraph average">Test</p>
        <p class="paragraph average">Test</p>
      </div>
      <div class="footer-item">
        <p class="paragraph medium bold">Products and services</p>
        <p class="paragraph average">Test</p>
        <p class="paragraph average">Test</p>
        <p class="paragraph average">Test</p>
      </div>
    </div>
    <div class="footer-block down">
      <p class="paragraph opacity">Citadel 2022 &copy;</p>
    </div>
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
