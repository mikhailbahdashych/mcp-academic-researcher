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
            :default-value="`${item.default}`"
            :show-content="item.show"
            :dropdown-items="['item1', 'item2', 'item3']"
            @show="item.show = !item.show"
            @close="item.show = false"
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
        { title: 'Language', text: 'Interface language', default: 'English', show: false },
        { title: 'Theme', text: 'Chose dark or light theme', default: 'Dark', show: false },
        { title: 'Default currency', text: 'Chose default currency for pages, etc.', default: 'EUR', show: false }
      ],
      showDropdown: false
    }
  },
  async mounted() {
    await getUserByToken(this.$router, localStorage.getItem('token'))
  },
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
