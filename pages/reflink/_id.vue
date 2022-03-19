<template>
  <div></div>
</template>

<script>
import { registrationFromReflink } from "~/api";
export default {
  name: "reflink",
  async mounted() {
    if (!this.$route.params.id) return this.redirect('/')
    await registrationFromReflink(this.$route.params.id)
  },
  methods: {
    redirect(path) {
      this.$router.push({ path })
    },
  }
}
</script>

<style scoped>

</style>
