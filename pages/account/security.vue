<template>
  <div>
    <h1>Here is security subpage</h1>
    <Input />
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
    }
  }
}
</script>

<style scoped>

</style>
