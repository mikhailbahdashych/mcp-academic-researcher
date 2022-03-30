<template>
  <div :class="dark ? 'header' : 'header dark'">
    <div class="header-logo" @click="redirect('/')">

    </div>
    <div class="inner-header">
      <div class="inner-header-small">


        <div class="dropdown">

          <div class="header-nav-menu">
            <span>More <i class="arrow arrow-down" /></span>
          </div>
          <div class="dropdown-content">
            <div class="dropdown-item" v-for="item in moreNav">
              <span class="item" @click="redirect(item.route)">{{ item.title }}</span>
            </div>
          </div>

        </div>

        <div class="dropdown">
          <div class="header-nav-menu">
            <span>More <i class="arrow arrow-down" /></span>
          </div>
          <div class="dropdown-content">
            <div class="dropdown-item">
              <span class="item">asd</span>
              <span class="item">asd</span>
              <span class="item">asd</span>
            </div>
          </div>
        </div>

      </div>
      <div class="inner-header-big">
        <Input @keyup.enter.native="() => {}" :additional-class="'search-bar'" />
      </div>
      <div class="inner-header-small buttons" v-if="!token">
        <Button @show="redirect('/login')" :label="'Log in'" :additional-class="'transparent'" class="inner-header-button" />
        <Button @show="redirect('/register')" :label="'Sign up'" :additional-class="'transparent'" class="inner-header-button" />
      </div>
      <div class="inner-header-small buttons" v-else>
        <Button @show="redirect('/account')" :label="'My account'" :additional-class="'transparent'" class="inner-header-button" />
        <Button @show="logout" :label="'Log out'" class="inner-header-button" />
      </div>
    </div>
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
