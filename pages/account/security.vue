<template>
  <div style="padding: 50px; width: 600px; margin: 0 auto">
    <h1>Here is security subpage</h1>
    <Button :label="'Click to generate 2FA'" :clickon="generate2fa" />
    <Input :title="'Code'" :type="'text'" />
    <Button :label="'Set 2FA'" :clickon="set2fa" />
  </div>
</template>

<script>
import { set2fa } from "~/api";
import Input from "~/components/Input";
import Button from "~/components/Button";
export default {
  name: "security",
  components: {
    Input,
    Button
  },
  methods: {
    async set2fa() {
      await set2fa()
    },
    generate2fa() {

    }
  }
}
</script>

<style scoped>

</style>
