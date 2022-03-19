<template>
  <div>
    <p class="paragraph">{{reflink}}</p>
    <p class="paragraph" v-if="reflink">{{ reflink.reflink }}</p>
    <p class="paragraph" v-else-if="reflink.status === -1">Oops... Something went wrong!</p>
  </div>
</template>

<script>
import { registrationFromReflink } from "~/api";
export default {
  name: "reflink",
  data() {
    return {
      reflink: {}
    }
  },
  async mounted() {
    if (!this.$route.params.id) return this.redirect('/')
    this.reflink = await registrationFromReflink(this.$route.params.id)
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
