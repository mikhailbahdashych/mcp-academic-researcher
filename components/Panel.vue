<template>
  <div class="panel">
    <div class="panel-content">
      <div class="panel-icon">
        <img :src="require(`~/assets/img/${img}.svg`)" alt="img" class="svg-white">
      </div>
      <div class="panel-texts">
        <div class="panel-texts">
          <p class="paragraph large">{{ title }}</p>
        </div>
        <div class="panel-texts">
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
    },
    img: {
      type: String,
      default: 'email'
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Panel";
</style>
