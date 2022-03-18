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
            v-if="item.dropdowndata"
            :show-content="item.dropdowndata.show"
            :dropdown-items="item.dropdowndata"
            @show="item.dropdowndata.show = !item.dropdowndata.show"
            @close="item.dropdowndata.show = false"
            @pick="pick($event)"
          />
          <div class="account-container-item-button" v-else>
            <TougleSwitch :check="item" @changeSwitch="changeSwitch($event)" />
          </div>
        </div>

      </div>

    </div>
    <Footer :bright="true" />
  </div>
</template>

<script>
import { verifyClientByToken } from "~/helpers/auth";
export default {
  name: "settings",
  data() {
    return {
      settingsOptions: [
        { title: 'Language', text: 'Interface language', dropdowndata: {
          default: 'English', items: ['English', 'Russian', 'Polish'], show: false
        } },
        { title: 'Theme', text: 'Chose dark or light theme', dropdowndata: {
          default: 'Dark', items: ['Dark', 'Light'], show: false
        } },
        { title: 'Default currency', text: 'Chose default currency for pages, etc.', dropdowndata: {
          default: 'EUR', items: ['EUR', 'USD'], show: false
        } },
        { title: 'Email notifications', text: 'Turn on email notifications to get promotions, news, etc.', switch: false }
      ],
    }
  },
  async mounted() {
    await verifyClientByToken(this.$router, localStorage.getItem('token'))
  },
  methods: {
    pick({ item, items }) {
      items.default = item
      items.show = false
    },
    changeSwitch({ item, items }) {
      items.switch = item
    }
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
