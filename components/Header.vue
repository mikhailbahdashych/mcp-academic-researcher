<template>
  <div :class="dark ? 'header' : 'header dark'">

    <div class="header-side">
      <div class="header-logo" @click="redirect('/')">
        CTD
      </div>
      <div class="header-nav">

        <div class="dropdown">

          <div class="header-nav-menu">
            <p class="nav-menu">Markets <i class="arrow arrow-down" /></p>
          </div>

          <div class="dropdown-content">
            <div class="dropdown-item">
              <span class="item">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusantium adipisci corporis cupiditate deserunt dolores illo neque possimus quos veritatis voluptates.</span>
            </div>
            <div class="dropdown-item">
              <span class="item">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eum, quasi?</span>
            </div>
            <div class="dropdown-item">
              <span class="item">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequatur itaque maxime nihil possimus quam quis.</span>
            </div>
          </div>

        </div>

        <div class="dropdown">

          <div class="header-nav-menu">
            <span>asd <i class="arrow arrow-down" /></span>
          </div>

          <div class="dropdown-content">
            <div class="dropdown-item">
              <span class="item">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusantium adipisci corporis cupiditate deserunt dolores illo neque possimus quos veritatis voluptates.</span>
            </div>
            <div class="dropdown-item">
              <span class="item">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eum, quasi?</span>
            </div>
            <div class="dropdown-item">
              <span class="item">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequatur itaque maxime nihil possimus quam quis.</span>
            </div>
          </div>
        </div>

        <div class="dropdown">

          <div class="header-nav-menu">
            <span>asd <i class="arrow arrow-down" /></span>
          </div>

          <div class="dropdown-content">
            <div class="dropdown-item">
              <span class="item">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusantium adipisci corporis cupiditate deserunt dolores illo neque possimus quos veritatis voluptates.</span>
            </div>
            <div class="dropdown-item">
              <span class="item">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eum, quasi?</span>
            </div>
            <div class="dropdown-item">
              <span class="item">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequatur itaque maxime nihil possimus quam quis.</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div class="header-middle">
      <Input @keyup.enter.native="() => {}" :additional-class="'search-bar'" />
    </div>

    <div class="header-side" v-if="!token">
      <div class="user-nav" @click="redirect('/login')">
        <div class="user-nav-button">
          Log in
        </div>
      </div>
      <div class="user-nav" @click="redirect('/register')">
        <div class="user-nav-button filled">
          Sign up
        </div>
      </div>
    </div>

    <div class="header-side" v-else>
      <div class="user-nav" @click="redirect('/account')">
        <div class="user-nav-button filled">
          My account
        </div>
      </div>
      <div class="user-nav" @click="logout">
        <div class="user-nav-button filled">
          Log out
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: "Header",
  props: ['dark'],
  data() {
    return {
      token: null
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
      this.$store.commit('setToken', -1)
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
