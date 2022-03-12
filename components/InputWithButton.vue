<template>
  <div>
    <p class="paragraph">{{ title }}</p>
    <div class="main-class" :class="additionalClass">
      <input
        ref="name"
        class="basic-input-button"
        :class="[error && innerValue && innerValue.length > 0 ? 'error' : '']"
        :type="type"
        :disabled="disabled"
        :placeholder="placeholder"
        :name="name"
        :value="innerValue"
        @input="onInput"
      >
      <Button :clickon="buttonClickOn" :label="`${buttonTitle}`" class="input-button" />
    </div>
  </div>
</template>

<script>
export default {
  name: "InputWithButton",
  props: {
    title: {
      type: String,
      default: ''
    },
    buttonTitle: {
      type: String,
      default: ''
    },
    value: {
      type: String,
      default: ''
    },
    additionalClass: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    buttonClickOn: {
      type: Function,
      default: () => {}
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
    error: {
      type: Boolean,
      default: false
    },
    focus: {
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
@import "../assets/css/components/InputWithButton";
</style>
