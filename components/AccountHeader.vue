<template>
  <div class="account-header">
    <div class="account-header-inner">
      <div v-for="item in accountHeaderItems">
        <h3>{{item.title}}</h3>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AccountHeader",
  data() {
    return {
      accountHeaderItems: [
        { title: 'My account' },
        { title: 'Settings' },
        { title: 'Security' },
      ]
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/AccountHeader";
</style>
