<template>
  <div class="basic-table">
    <div class="table-headers"></div>
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
