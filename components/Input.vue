<template>
  <div class="basic-input-outer">
    <p :class="`paragraph ${titleClass}`">{{ title }}</p>
    <input
      ref="name"
      class="bi basic-input"
      :class="[
        oneerror ||
        (error.passwordMismatch || error.passwordRequirement || error.passwordRules)
        && innerValue && innerValue.length > 0 ? `error ${additionalClass}` : additionalClass]"
      :type="type"
      :disabled="disabled"
      :readonly="readonly"
      :placeholder="placeholder"
      :name="name"
      :value="innerValue"
      @input="onInput"
    >
  </div>
</template>

<script>
export default {
  name: "Input",
  props: {
    title: {
      type: String,
      default: ''
    },
    value: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    name: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: ''
    },
    additionalClass: {
      type: String,
      default: ''
    },
    error: {
      type: Object,
      default: function () { return {}}
    },
    focus: {
      type: Boolean,
      default: false
    },
    oneerror: {
      type: Boolean,
      default: false
    },
    titleClass: {
      type: String,
      default: ''
    },
  },
  watch: {
    focus: function() {
      if (this.focus) this.$refs.name.focus()
    },
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
    onInput(event) {
      this.$nextTick(() => {
        this.innerValue = event.target.value
      })
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Input";
</style>
