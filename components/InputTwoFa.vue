<template>
  <div>
    <input
      class="input-two-fa"
      :id="`n1`" type="text" pattern="[0-9\/]*"
      min="0"
      max="9"
      maxlength="1"
      autocomplete="off"
      autofocus
      oninput="this.nextElementSibling.focus()"
    >
    <input
      class="input-two-fa"
      :id="`n2`" type="text" pattern="[0-9\/]*"
      min="0"
      max="9"
      maxlength="1"
      autocomplete="off"
      autofocus
      oninput="this.nextElementSibling.focus()"
    >
    <input
      class="input-two-fa"
      :id="`n3`" type="text" pattern="[0-9\/]*"
      min="0"
      max="9"
      maxlength="1"
      autocomplete="off"
      autofocus
      oninput="this.nextElementSibling.focus()"
    >
    <input
      class="input-two-fa"
      :id="`n4`" type="text" pattern="[0-9\/]*"
      min="0"
      max="9"
      maxlength="1"
      autocomplete="off"
      autofocus
      oninput="this.nextElementSibling.focus()"
    >
    <input
      class="input-two-fa"
      :id="`n5`" type="text" pattern="[0-9\/]*"
      min="0"
      max="9"
      maxlength="1"
      autocomplete="off"
      autofocus
      oninput="this.nextElementSibling.focus()"
    >
    <input
      class="input-two-fa"
      :id="`n6`" type="text" pattern="[0-9\/]*"
      min="0"
      max="9"
      maxlength="1"
      autocomplete="off"
      autofocus
      oninput="this.nextElementSibling.focus()"
    >
  </div>
</template>

<script>
export default {
  name: "InputTwoFa"
}
</script>

<style lang="scss">
@import "../assets/css/components/InputTwoFa";
</style>
