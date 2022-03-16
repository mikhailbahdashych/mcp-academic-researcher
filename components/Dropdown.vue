<template>
  <div class="dropdown-menu" v-click-outside="hide">
    <p class="paragraph medium dropdown-default-value" @click="$emit('show')">
      <span>{{ defaultValue }}</span>
    </p>
    <div v-if="showContent" class="dropdown-menu-content">
      <div v-for="item in dropdownItems">
        <p class="paragraph medium drop-item">{{ item }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import vClickOutside from 'v-click-outside';
export default {
  name: "Dropdown",
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    defaultValue: String,
    dropdownItems: Array,
    showContent: Boolean,
    onShow: Boolean
  },
  methods: {
    hide() {
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Dropdown";
</style>
