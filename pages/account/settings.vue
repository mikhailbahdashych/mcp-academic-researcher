<template>
  <div>
    <Header />
    <AccountHeader />
    <div class="account-container">
      <Dropdown
        :default-value="'Test'"
        :show-content="showDropdown"
        :dropdown-items="['item1', 'item2', 'item3']"
        @show="showDropdownContent"
      />
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
<!--          <Button :label="``" />-->
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
        { title: 'Language', text: 'Interface language' },
        { title: 'Theme', text: 'Chose dark or light theme' },
        { title: 'Default currency', text: 'Chose default currency for pages, etc.' }
      ],
      showDropdown: false
    }
  },
  async mounted() {
    await getUserByToken(this.$router, localStorage.getItem('token'))
  },
  methods: {
    showDropdownContent() {
      this.showDropdown = !this.showDropdown
    }
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
