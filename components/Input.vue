<template>
  <div class="basic-input-outer" :style="styles">
    <p class="paragraph-small">{{ title }}</p>
    <input ref="name" :type="type" class="basic-input">
  </div>
</template>

<script>
export default {
  name: "Input",
  props: ['type', 'styles', 'title', 'focus'],
  watch: {
    focus: function() {
      if (this.focus) this.$refs.name.focus()
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Input";
</style>
