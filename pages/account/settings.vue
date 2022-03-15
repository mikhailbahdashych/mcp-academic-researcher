<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container">

    </div>
    <Footer :bright="true" />
  </div>
</template>

<script>
import { getUserByToken } from "~/helpers/auth";
export default {
  name: "settings",
  async mounted() {
    await getUserByToken(this.$router, localStorage.getItem('token'))
  }
}
</script>

<style scoped>

</style>
