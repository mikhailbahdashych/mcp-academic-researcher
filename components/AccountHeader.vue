<template>
  <div class="account-header">
    <div class="account-header-inner">
      <div v-for="item in accountHeaderItems" class="account-header-item-block" :class="[item.active ? 'active' : '']">
        <h4 :class="[item.active ? 'active' : '']" class="account-header-item" @click="redirect(item.route)">
          {{item.title}}
        </h4>
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
        { title: 'My account', route: '/account', active: false },
        { title: 'Settings', route: '/account/settings', active: false },
        { title: 'Security', route: '/account/security', active: false },
        { title: 'Referral panel', route: '/account/referral', active: false }
      ]
    }
  },
  watch: {
    '$route.path': {
      handler: function(path) {
        this.accountHeaderItems.map(i => {
          if (i.route === path) i.active = true
        })
      },
      deep: true,
      immediate: true
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
