<template>
  <div class="basic-textarea-outer">
    <p :class="`paragraph ${titleClass}`">{{ title }}</p>
    <textarea
      class="basic-textarea"
      :disabled="disabled"
      :class="additionalClass"
      :placeholder="placeholder"
      :name="name"
      :value="innerValue"
      @input="onInput"
    />
  </div>
</template>

<script>
export default {
  name: "Textarea",
  props: {
    title: {
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
    name: {
      type: String,
      default: ''
    },
    additionalClass: {
      type: String,
      default: ''
    },
    titleClass: {
      type: String,
      default: ''
    }
  },
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
    onInput(event) {
      this.$nextTick(() => {
        this.innerValue = event.target.value
      })
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Textarea";
</style>
