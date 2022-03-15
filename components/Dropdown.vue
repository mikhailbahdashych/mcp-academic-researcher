<template>
  <div class="dropdown-menu">
    <p class="paragraph medium" @click="$emit('show')">{{ defaultValue }}</p>

    <div v-if="showContent" class="dropdown-menu-content">
      <div v-for="item in dropdownItems">
        <p class="paragraph">{{ item }}</p>
      </div>
    </div>

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
