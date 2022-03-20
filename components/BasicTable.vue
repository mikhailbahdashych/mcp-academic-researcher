<template>
  <div class="basic-table">
    <div class="table-headers">
      <div class="table-item" v-for="header in headers">
        <p class="paragraph medium">{{ header }}</p>
      </div>
    </div>
    <div class="table-items"></div>
  </div>
</template>

<script>
export default {
  name: "BasicTable",
  props: {
    headers: {
      type: Array,
      default: []
    },
    items: {
      type: Array,
      default: []
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/BasicTable";
</style>
