<template>
  <div class="referral-container">
    <div class="referral-container-side">
      <div class="referral-container-side-title-box" v-if="reflink.status === -1">
        <h1>Oops... Something went wrong! :(</h1>
      </div>
      <div class="referral-container-side-title-box" v-else>
        <h1>Oh, you are probably from someone's referral program? It's nice to see you!</h1>
        <p class="paragraph medium">Lemme explain what is this and why it's cool.</p>
        <div class="referral-container-side-text-box">
          <p class="paragraph medium opacity">
            If you are on this page, it means you've got invitation by someone to become a part
            of referral program. But don't get mad, by participating in it, you will also get bonuses like:
          </p>
          <ul>
            <li>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</li>
            <li>Lorem ipsum dolor sit amet.</li>
            <li>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquam illo non officiis totam.</li>
            <li>Lorem ipsum dolor sit amet, consectetur adipisicing elit. A ea facere nulla.</li>
            <li>Lorem ipsum dolor sit amet.</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="referral-container-side">
      <div v-if="status !== 1" class="referral-container-card">
        <Input :additional-class="'basic-input-box'" :title="'Email'" :disabled="reflink.status === -1" :oneerror="email.emailError" :type="'text'" v-model="email.email" />
        <Input :additional-class="'basic-input-box'" :title="'Password'" :disabled="reflink.status === -1" :oneerror="passwordError.passwordMismatch || passwordError.passwordRequirement || passwordError.passwordRules" :type="'password'" v-model="password.password"  />
        <Input :additional-class="'basic-input-box'" :title="'Password repeat'" :disabled="reflink.status === -1" :oneerror="passwordError.passwordMismatch || passwordError.passwordRequirement || passwordError.passwordRules":type="'password'" v-model="password.passwordRepeat" />
        <p v-if="passwordError.passwordMismatch" class="paragraph error">Passwords have to match!</p>
        <p v-if="passwordError.passwordRequirement" class="paragraph error">Password are requirement!</p>

        <div v-if="passwordError.passwordRules" class="password-requirement">
          <div v-for="rule in passwordRulesList" class="flex">
            <div v-for="(item) in Object.entries(rule)">
              <p>
                <span class="paragraph" v-if="item[0] === 'text'">{{ item[1] }}</span>
                <span v-else>
                  <span class="paragraph success" v-if="item[1]">OK</span>
                  <span class="paragraph error" v-else>NOT OK</span>
                </span>
              </p>
            </div>
          </div>
        </div>

        <Checkbox v-model="tac" :label="`I have read and accepted <a href='/'>terms and conditions.</a>`" :disabled="reflink.status === -1" />
        <p v-if="status === -1" class="paragraph error">User with this email already exists!</p>
        <Button :clickon="register" :label="'Create account'" :disabled="reflink.status === -1 || !validFields()" />
        <p class="paragraph" id="referral-about">Read more about
          <span class="paragraph link">referral program</span>.
        </p>
      </div>
      <div v-else class="referral-container-card">
        <h1>Сonfirmation email has been sent.</h1>
        <p class="paragraph medium">Please, follow the instruction in the email to complete registration process.</p>
        <p class="paragraph medium">The link will be valid for 24 hours.</p>
        <p class="paragraph">Go to <span class="paragraph link" @click="redirect('/login')">login</span> page.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { registrationFromReflink } from "~/api";
import { registration } from "~/mixins/register";
export default {
  name: "reflink",
  mixins: [ registration ],
  data() {
    return {
      reflink: {}
    }
  },
  async mounted() {
    if (!this.$route.params.id) return this.redirect('/')
    await registrationFromReflink(this.$route.params.id)
    .then((res) => {
      if (res.status) this.$store.commit('setStatus', res.status)
      else this.reflink = res
    })
  },
  methods: {
    redirect(path) {
      this.$router.push({ path })
    },
  }
}
</script>

<style lang="scss">
@import "../../assets/css/referral";
</style>
