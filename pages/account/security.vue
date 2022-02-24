<template>
  <div>
    <Header />
    <AccountHeader />
    <div style="padding: 50px; width: 600px; margin: 0 auto">
      <h1>Here is security subpage</h1>
      <img :src="token.qr" alt="2fa">
      <Button :label="'Click to generate 2FA'" :clickon="generate2fa" />
      <Input :title="'Code'" :type="'text'" v-model="code" />
      <Button :label="'Set 2FA'" :clickon="set2fa" />
      <p v-if="twofaStatus.status === 1">2fa setted</p>
      <p v-else>2fa not setted</p>
    </div>
  </div>
</template>

<script>
import { set2fa, verify2fa } from "~/api";
import { verifyUserToken } from "~/helpers/auth";
import Input from "~/components/Input";
import Button from "~/components/Button";
import AccountHeader from "~/components/AccountHeader";
import * as node2fa from "node-2fa";
export default {
  name: "security",
  components: {
    Input,
    Button,
    AccountHeader
  },
  data() {
    return {
      code: null,
      token: {},
      twofaStatus: {}
    }
  },
  async mounted() {
    await verifyUserToken(this.$router)
    await this.check2fa()
  },
  methods: {
    async set2fa() {
      await set2fa({
        code: this.code,
        token: this.token,
        jwt: localStorage.getItem('token')
      })
    },
    generate2fa() {
      this.token = node2fa.generateSecret({name: 'test', account: 'dupa@dupa.com'})
    },
    async check2fa() {
      this.twofaStatus = await verify2fa({token: localStorage.getItem('token')})
    }
  }
}
</script>

<style lang="scss">
@import "../../assets/css/account";
</style>
