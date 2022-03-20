<template>
  <div :class="dark ? 'header' : 'header dark'">

  </div>
</template>

<script>
export default {
  name: "Header",
  props: {
    dark: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      token: null,
      moreNav: [
        { title: 'Contact', route: '/contact' },
        { title: 'About', route: '/about' },
        { title: 'Forum', route: '/forum' },
        { title: 'Blog', route: '/blog' },
        { title: 'FAQ', route: '/faq' },
        { title: 'Terms and Conditions', route: '/tac' },
      ]
    }
  },
  mounted() {
    this.checkToken()
  },
  methods: {
    redirect(path) {
      this.$router.push({ path })
    },
    logout() {
      localStorage.removeItem('token')
      this.$router.push({ path: '/' })
      window.location.reload()
    },
    checkToken() {
      this.token = !!localStorage.getItem('token');
    }
  }
}
</script>

<style lang="scss">
@import "../assets/css/components/Header";
</style>
