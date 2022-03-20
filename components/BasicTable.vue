<template>
  <div class="basic-table">

    <div class="table-headers">
      <div class="table-headers-item" v-for="header in headers">
        <p class="paragraph medium">{{ header.title }}</p>
      </div>
    </div>

    <div class="table-items" v-for="item in items">
      <div class="table-item" v-for="i in item">
        <p class="paragraph medium">{{ i }}</p>
      </div>
    </div>

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
