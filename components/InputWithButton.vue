<template>
  <div>
    <p class="paragraph">{{ title }}</p>
    <div class="main-class" :class="additionalClass">
      <input
        ref="name"
        class="bi basic-input-button"
        :class="[error && innerValue && innerValue.length > 0 ? 'error' : '']"
        :type="type"
        :disabled="disabled"
        :readonly="readonly"
        :placeholder="placeholder"
        :name="name"
        :value="innerValue"
        @input="onInput"
      >
      <div @click="buttonClickOn">
        <button
          @click="$emit('show')"
          class="basic-button input-with-button"
        >
          {{ buttonTitle }}
        </button>
      </div>
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
    readonly: {
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
    },
    select: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    focus: function() {
      if (this.focus) this.$refs.name.focus()
    },
    select: function () {
      if (this.select) this.$refs.name.select()
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
@import "../assets/css/components/Button";
</style>
