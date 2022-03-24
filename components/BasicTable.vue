<template>
  <div class="basic-table">

    <div class="table-items">
      <div class="table-headers-item" v-for="header in headers">
        <p class="paragraph medium">{{ header }}</p>
      </div>
    </div>

    <div class="table-items" v-if="items.length === 0">
      <h3 class="no-records">No records found...</h3>
    </div>
    <div class="table-items" v-for="item in items" v-else>
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
      default: () => {}
    },
    items: {
      type: Array,
      default: () => { return [] }
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/BasicTable";
</style>
