<template>
  <div class="basic-input-outer" :style="styles">
    <p class="paragraph-small">{{ title }}</p>
    <input :type="type" class="basic-input">
  </div>
</template>

<script>
export default {
  name: "Input",
  props: ['type', 'styles', 'title'],
  data() {
    return {

    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Input";
</style>
