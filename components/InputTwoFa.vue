<template>
  <div :class="onwhite ? 'on-white' : ''">
    <input
      class="input-two-fa"
      :id="`n1`" type="number"
      v-model="i1"
      :disabled="disabled"
      min="0"
      max="9"
      autocomplete="off"
      autofocus
      oninput="if (this.value === '') { if (this.previousElementSibling) {this.previousElementSibling.focus()} } else { this.nextElementSibling.focus() }"
    >
    <input
      class="input-two-fa"
      :id="`n2`" type="number"
      v-model="i2"
      :disabled="disabled"
      min="0"
      max="9"
      autocomplete="off"
      autofocus
      oninput="if (this.value === '') { this.previousElementSibling.focus() } else { this.nextElementSibling.focus() }"
    >
    <input
      class="input-two-fa"
      :id="`n3`" type="number"
      v-model="i3"
      :disabled="disabled"
      min="0"
      max="9"
      autocomplete="off"
      autofocus
      oninput="if (this.value === '') { this.previousElementSibling.focus() } else { this.nextElementSibling.focus() }"
    >
    <input
      class="input-two-fa"
      :id="`n4`" type="number"
      v-model="i4"
      :disabled="disabled"
      min="0"
      max="9"
      autocomplete="off"
      autofocus
      oninput="if (this.value === '') { this.previousElementSibling.focus() } else { this.nextElementSibling.focus() }"
    >
    <input
      class="input-two-fa"
      :id="`n5`" type="number"
      v-model="i5"
      :disabled="disabled"
      min="0"
      max="9"
      autocomplete="off"
      autofocus
      oninput="if (this.value === '') { this.previousElementSibling.focus() } else { this.nextElementSibling.focus() }"
    >
    <input
      class="input-two-fa"
      :id="`n6`" type="number"
      v-model="i6"
      :disabled="disabled"
      min="0"
      max="9"
      autocomplete="off"
      autofocus
      oninput="if (this.value === '') { this.previousElementSibling.focus() } else { if (this.nextElementSibling) { this.nextElementSibling.focus() } }"
    >
  </div>
</template>

<script>
import { validate2fa } from "~/helpers/frontValidators";
export default {
  name: "InputTwoFa",
  props: ["twofa", "disabled", "onwhite"],
  watch: {
    // Error is somewhere here (at this.i1)
    i1() { this.i1 = validate2fa(this.i1); this.twofa[0] = this.i1; this.returnTwofa() },
    i2() { this.i2 = validate2fa(this.i2); this.twofa[1] = this.i2; this.returnTwofa() },
    i3() { this.i3 = validate2fa(this.i3); this.twofa[2] = this.i3; this.returnTwofa() },
    i4() { this.i4 = validate2fa(this.i4); this.twofa[3] = this.i4; this.returnTwofa() },
    i5() { this.i5 = validate2fa(this.i5); this.twofa[4] = this.i5; this.returnTwofa() },
    i6() { this.i6 = validate2fa(this.i6); this.twofa[5] = this.i6; this.returnTwofa() },
  },
  data() {
    return {
      i1: '', i2: '', i3: '', i4: '', i5: '', i6: '',
    }
  },
  methods: {
    returnTwofa() {
      this.$emit('returnTwofa', this.twofa)
    },
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/InputTwoFa";
</style>
