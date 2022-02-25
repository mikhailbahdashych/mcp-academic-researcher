<template>
  <div class="account-header">
    <div class="account-header-inner">
      <div v-for="item in accountHeaderItems" class="account-header-item-block">
        <h3 class="account-header-item" @click="redirect(item.route)">{{item.title}}</h3>
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
        { title: 'My account', route: '/account' },
        { title: 'Settings', route: '/account/settings' },
        { title: 'Security', route: '/account/security' },
      ]
    }
  },
  methods: {
    redirect(path) {
      this.$router.push({ path })
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/AccountHeader";
</style>
