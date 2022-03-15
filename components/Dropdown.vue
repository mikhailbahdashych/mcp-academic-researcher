<template>
  <div class="dropdown-menu" @click="$emit('show')">
    <p class="paragraph medium">{{ defaultValue }}</p>

    <div v-if="showContent" class="dropdown-content-test">
      <div class="dropdown-item-test" v-for="item in dropdownItems">
        <span>{{ item }}</span>
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
