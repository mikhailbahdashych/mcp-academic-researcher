<template>
  <div class="basic-button-outer">
    <button class="basic-button">{{ label }}</button>
  </div>
</template>

<script>
export default {
  name: "Button",
  props: ['label']
}
</script>

<style lang="scss">
@import "../assets/css/components/Button";
</style>
