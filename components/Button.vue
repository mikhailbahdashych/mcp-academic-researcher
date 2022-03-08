<template>
  <div @click="clickon" class="basic-button-outer">
    <button
      @click="$emit('show')"
      :disabled="disabled"
      class="basic-button"
      :class="[onhover ? 'on-hover' : '']"
    >
      {{ label }}
    </button>
  </div>
</template>

<script>
export default {
  name: "Button",
  props: {
    label: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    clickon: {
      type: Function,
      default: () => {}
    },
    onhover: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Button";
.on-hover {}
.on-hover:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px $maincolor;
}
</style>
