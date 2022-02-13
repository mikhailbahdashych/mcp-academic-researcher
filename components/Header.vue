<template>
  <div class="header">
    <div class="header-side">
      <div class="header-logo">
        LOGO
      </div>
      <div class="header-nav">
        <div class="header-nav-menu">Nav menu 1</div>
        <div class="header-nav-menu">Nav menu 2</div>
        <div class="header-nav-menu">Nav menu 3</div>
      </div>
    </div>
    <div class="header-side">
      <div class="user-nav">
        <div class="user-nav-button">
          Log in
        </div>
      </div>
      <div class="user-nav">
        <div class="user-nav-button filled">
          Sign up
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Header",
  data() {
    return {

    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/Header";
</style>
