<template>
  <div>
    <Header :dark="scrollPosition < 640" />

    <div class="home-base">
      <div class="home-text-box center">
        <div class="home-welcome">
          <h1 class="title large">Contact</h1>
          <h1 class="title small-title">Wanna become a partner? Found a bug? Have a question? Or just wanna have a small talk?</h1>
          <h1 class="title small-title">Here you go!</h1>
        </div>
      </div>
    </div>

    <div class="home-content">
      <div class="home-content-box">

        <Input :title="'Message title'" />
        <Textarea />

      </div>
    </div>

    <Footer />
  </div>
</template>

<script>
import { darkHeader } from "~/mixins/darkHeader";
export default {
  name: "contact",
  mixins: [ darkHeader ],
}
</script>

<style lang="scss">
@import "../assets/css/home";
</style>
