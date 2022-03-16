<template>
  <div class="dropdown-menu" v-click-outside="close">
    <p class="paragraph medium dropdown-default-value" @click="$emit('show')">
      <span>{{ defaultValue }}</span>
    </p>
    <div v-if="showContent" class="dropdown-menu-content">
      <div v-for="item in dropdownItems">
        <p class="paragraph medium drop-item" @click="pick(item)">{{ item }}</p>
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
    close() {
      this.$emit('close')
    },
    pick(item) {
      this.$emit('pick', item)
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Dropdown";
</style>
