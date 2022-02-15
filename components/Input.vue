<template>
  <div class="basic-input-outer" :style="styles">
    <p class="paragraph-small">{{ title }}</p>
    <input
      ref="name"
      class="basic-input"
      :class="[error ? 'error' : '']"
      :type="type"
      :disabled="disabled"
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
    placeholder: {
      type: String,
      default: ''
    },
    styles: {
      type: String,
      default: ''
    },
    error: {
      type: Boolean,
      default: false
    }
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
