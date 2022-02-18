<template>
  <div>
    <p class="paragraph-small">{{ title }}</p>
    <div class="main-class">
      <input
        ref="name"
        class="basic-input"
      >
      <Button :clickon="buttonClickOn" :label="`${buttonTitle}`" class="input-button" />
    </div>
  </div>
</template>

<script>
import Button from "~/components/Button";
export default {
  name: "InputWithButton",
  components: {
    Button
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    buttonTitle: {
      type: String,
      default: ''
    },
    buttonClickOn: {
      type: Function,
      default: () => {}
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/InputWithButton";
</style>
