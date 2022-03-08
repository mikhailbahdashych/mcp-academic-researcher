<template>
  <div>
    <Header />
    <div class="main-background" />
    <div class="main-texts-box">
      <div class="main-welcome">
        <h1 class="title">THE FUTURE IS HERE. THE FUTURE IS NOW.</h1>
        <h1 class="title small-title">Improve your trading strategy with personal AI</h1>
        <h1 class="title small-content">Let your personal Artificial Intelligence collect and analyze trading data to improve your personal strategy</h1>
      </div>
      <div class="main-start-box">
        <h1 class="title small-title">Start now</h1>
        <Button :label="'Start now'" />
      </div>
    </div>
    <div class="main-content">
    </div>
  </div>
</template>

<script>
export default {
  name: 'IndexPage',
}
</script>

<style lang="scss">
@import "../assets/css/home";
</style>
