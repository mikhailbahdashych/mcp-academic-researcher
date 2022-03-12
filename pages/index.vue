<template>
  <div>
    <Header :dark="scrollPosition < 640" />

    <div class="home-base">
      <img src="../assets/img/ai.svg" alt="AI">
      <div class="home-text-box">
        <div class="home-welcome">
          <h1 class="title">THE FUTURE IS HERE. THE FUTURE IS NOW.</h1>
          <h1 class="title small-title">Improve your trading strategy with personal AI</h1>
          <h1 class="title small-content">Let your personal Artificial Intelligence collect and analyze trading data to improve your personal strategy</h1>
        </div>
        <div class="home-start-box">
          <h1 class="title small-title">Start now</h1>
          <Button :label="'Start now'" :onhover="true" />
        </div>
      </div>
    </div>

    <div class="home-content">
    </div>
    <Footer/>

  </div>
</template>

<script>
import { darkHeader } from "~/mixins/darkHeader";
export default {
  name: 'IndexPage',
  mixins: [ darkHeader ]
}
</script>

<style lang="scss">
@import "../assets/css/home";
</style>
