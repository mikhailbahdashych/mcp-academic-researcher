<template>
  <div class="checkbox-container">
    <label class="container">
      <input type="checkbox" :value="innerValue" @input="onInput" :disabled="disabled">
      <span class="checkmark"></span>
    </label>
    <p class="checkbox-paragraph" v-html="label" />
  </div>
</template>

<script>
export default {
  props: {
    label: {
      type: String,
      default: ''
    },
    value: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  name: "Checkbox",
  watch: {
    value(value) {
      this.innerValue = value
    },
    innerValue(value) {
      this.$emit('input', value)
    }
  },
  data() {
    return {
      innerValue: this.value
    }
  },
  methods: {
    onInput() {
      this.$nextTick(() => {
        this.innerValue = !this.innerValue
      })
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Checkbox";
</style>
