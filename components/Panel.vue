<template>
  <div class="panel">
    <div class="panel-content">
      <div class="panel-icon"></div>
      <div class="panel-texts">
        <div class="panel-texts">
          <p class="paragraph large">{{ title }}</p>
        </div>
        <div class="panel-texts text">
          <p class="paragraph opacity">{{ text }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Panel",
  props: {
    title: {
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Panel";
</style>
