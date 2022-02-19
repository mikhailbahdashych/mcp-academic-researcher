<template>
  <div @click="clickon" class="basic-button-outer">
    <button :disabled="disabled" class="basic-button">{{ label }}</button>
  </div>
</template>

<script>
export default {
  name: "Button",
  props: ['label', 'clickon', 'disabled']
}
</script>

<style lang="scss">
@import "../assets/css/components/Button";
</style>
