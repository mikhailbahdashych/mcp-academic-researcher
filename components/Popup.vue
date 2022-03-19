<template>
  <transition name="slide-fade" mode="out-in">
    <div class="popup fadeInclass">
      <p class="paragraph">{{ content }}</p>
    </div>
  </transition>
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
