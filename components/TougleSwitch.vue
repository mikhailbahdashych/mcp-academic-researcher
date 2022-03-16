<template>
  <div>
    <label class="switch-box">
      <input type="checkbox" v-model="check.switch" @click="changeSwitch(check.switch)">
      <span class="slider round"></span>
    </label>
  </div>
</template>

<script>
export default {
  name: "TougleSwitch",
  props: {
    check: Object
  },
  methods: {
    changeSwitch(item) {
      this.$emit('changeSwitch', { item, items: this.check })
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/TougleSwitch";
</style>
