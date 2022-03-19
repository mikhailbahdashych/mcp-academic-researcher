<template>
  <div class="popup">
    <p class="paragraph medium">{{ content }}</p>
  </div>
</template>

<script>
export default {
  name: "Popup",
  props: {
    content: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Popup";
</style>
