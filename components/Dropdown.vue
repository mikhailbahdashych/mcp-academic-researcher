<template>
  <div class="dropdown-menu">
    <p class="paragraph medium" @click="$emit('show')">{{ defaultValue }}</p>
    <p v-if="showContent">Here is hidden content</p>
  </div>
</template>

<script>
export default {
  name: "Dropdown",
  props: {
    defaultValue: String,
    dropdownItems: Array,
    showContent: Boolean,
    onShow: Boolean
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Dropdown";
</style>
