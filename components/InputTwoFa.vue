<template>
  <div>
    <input
      class="input-two-fa"
      :id="`n1`" type="number"
      v-model="i1"
      min="0"
      max="9"
      autocomplete="off"
      autofocus
      oninput="this.nextElementSibling.focus()"
    >
    <input
      class="input-two-fa"
      :id="`n2`" type="number"
      v-model="i2"
      min="0"
      max="9"
      autocomplete="off"
      autofocus
      oninput="this.nextElementSibling.focus()"
    >
    <input
      class="input-two-fa"
      :id="`n3`" type="number"
      v-model="i3"
      min="0"
      max="9"
      autocomplete="off"
      autofocus
      oninput="this.nextElementSibling.focus()"
    >
    <input
      class="input-two-fa"
      :id="`n4`" type="number"
      v-model="i4"
      min="0"
      max="9"
      autocomplete="off"
      autofocus
      oninput="this.nextElementSibling.focus()"
    >
    <input
      class="input-two-fa"
      :id="`n5`" type="number"
      v-model="i5"
      min="0"
      max="9"
      autocomplete="off"
      autofocus
      oninput="this.nextElementSibling.focus()"
    >
    <input
      class="input-two-fa"
      :id="`n6`" type="number"
      v-model="i6"
      min="0"
      max="9"
      autocomplete="off"
      autofocus
    >
  </div>
</template>

<script>
import { validate2fa } from "~/helpers/frontValidators";
export default {
  name: "InputTwoFa",
  watch: {
    i1() { this.i1 = validate2fa(this.i1) },
    i2() { this.i2 = validate2fa(this.i2) },
    i3() { this.i3 = validate2fa(this.i3) },
    i4() { this.i4 = validate2fa(this.i4) },
    i5() { this.i5 = validate2fa(this.i5) },
    i6() { this.i6 = validate2fa(this.i6) },
  },
  data() {
    return {
      i1: null, i2: null, i3: null, i4: null, i5: null, i6: null,
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/InputTwoFa";
</style>
