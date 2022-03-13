<template>
  <div class="account-header">
    <div class="account-header-inner">
      <div v-for="item in accountHeaderItems" class="account-header-item-block" :class="[item.active ? 'active' : '']">
        <p :class="[item.active ? 'active' : '']" class="account-header-item" @click="redirect(item.route)">
          {{item.title}}
        </p>
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
        { title: 'User profile', route: '/account', active: false },
        { title: 'Security Settings', route: '/account/security', active: false },
        { title: 'Settings', route: '/account/settings', active: false },
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
