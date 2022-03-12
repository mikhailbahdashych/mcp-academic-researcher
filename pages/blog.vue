<template>
  <div>
    <Header :dark="scrollPosition < 640" />

    <div class="home-base">
      <div class="home-text-box center">
        <div class="home-welcome">
          <h1 class="title large">Blog</h1>
          <h1 class="title small-title">Welcome to blog! Here you will found news about modern crypto world.</h1>
        </div>
      </div>
    </div>

    <div class="home-content">
      <div class="home-content-box">
      </div>
    </div>

  </div>
</template>

<script>
import { darkHeader } from "~/mixins/darkHeader";
export default {
  name: "blog",
  mixins: [darkHeader ]
}
</script>

<style lang="scss">
@import "../assets/css/home";
</style>
