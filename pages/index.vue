<template>
  <div>
    <Header />
    <div class="home">
      <p class="paragraph-small medium">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus adipisci et iste minima mollitia possimus soluta suscipit unde? Iste, modi.
      </p>
    </div>
  </div>
</template>

<script>
import Header from "~/components/Header";
export default {
  name: 'IndexPage',
  components: {
    Header
  }
}
</script>

<style lang="scss">
@import "../assets/css/home";
</style>
