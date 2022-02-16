<template>
  <div class="checkbox-container">
    <label class="container">
      <input type="checkbox">
      <span class="checkmark"></span>
    </label>
    <p class="checkbox-paragraph" v-html="label" />
  </div>
</template>

<script>
export default {
  props: ['label'],
  name: "Checkbox"
}
</script>

<style lang="scss">
@import "../assets/css/components/Checkbox";
</style>
