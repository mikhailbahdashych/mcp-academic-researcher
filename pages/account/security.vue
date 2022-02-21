<template>
  <div style="padding: 50px; width: 600px; margin: 0 auto">
    <h1>Here is security subpage</h1>
    {{token}}
    <img :src="token.qr" alt="">
    <Button :label="'Click to generate 2FA'" :clickon="generate2fa" />
    <Input :title="'Code'" :type="'text'" v-model="code" />
    <Button :label="'Set 2FA'" :clickon="set2fa" />
  </div>
</template>

<script>
import { set2fa } from "~/api";
import Input from "~/components/Input";
import Button from "~/components/Button";
import * as node2fa from "node-2fa";
export default {
  name: "security",
  components: {
    Input,
    Button
  },
  data() {
    return {
      code: null,
      token: {}
    }
  },
  methods: {
    async set2fa() {
      await set2fa({
        code: this.code,
        token: this.token
      })
    },
    generate2fa() {
      this.token = node2fa.generateSecret()
    }
  }
}
</script>

<style scoped>

</style>
