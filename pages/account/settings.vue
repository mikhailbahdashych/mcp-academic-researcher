<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container">
      <div class="account-container-item" v-for="item in settingsOptions">
        <div class="account-container-item-icon"></div>
        <div class="account-container-item-icon-texts">
          <div class="account-container-item-icon-texts text">
            <p class="paragraph large bold">{{ item.title }}</p>
          </div>
          <div class="account-container-item-icon-texts text">
            <p class="paragraph opacity">{{ item.text }}</p>
          </div>
        </div>

        <div class="account-container-item-button">
          <Dropdown
            :show-content="item.show"
            :dropdown-items="item.dropdowndata"
            @show="item.show = !item.show"
            @close="item.show = false"
            @pick="pick($event)"
          />
        </div>

      </div>
    </div>
    <Footer :bright="true" />
  </div>
</template>

<script>
import { getUserByToken } from "~/helpers/auth";
export default {
  name: "settings",
  data() {
    return {
      settingsOptions: [
        { title: 'Language', text: 'Interface language', show: false, dropdowndata: {
          default: 'English', items: ['English', 'Russian', 'Polish']
        } },
        { title: 'Theme', text: 'Chose dark or light theme', show: false, dropdowndata: {
          default: 'Dark', items: ['Dark', 'Light']
        } },
        { title: 'Default currency', text: 'Chose default currency for pages, etc.', show: false, dropdowndata: {
          default: 'EUR', items: ['EUR', 'USD']
        } }
      ],
    }
  },
  async mounted() {
    await getUserByToken(this.$router, localStorage.getItem('token'))
  },
  methods: {
    pick({ item, items }) {
      items.default = item
    }
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
