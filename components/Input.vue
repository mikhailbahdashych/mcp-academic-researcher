<template>
  <div class="basic-input-outer" :style="styles">
    <input :type="type" class="basic-input">
  </div>
</template>

<script>
export default {
  name: "Input",
  props: ['type', 'styles'],
  data() {
    return {

    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Input";
</style>
