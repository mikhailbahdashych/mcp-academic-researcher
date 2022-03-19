<template>
  <div class="login">

    <div class="login-content">
      <h1 @click="redirect('/')">Logo</h1>
    </div>

    <div class="login-header">
      <p class="paragraph right">Already have account?
        <span class="paragraph link" @click="redirect('/login')">Log in!</span>
      </p>
    </div>

    <div class="login-inputs">
      <div v-if="status !== 1" class="login-inputs-container">
        <h1>Sign up</h1>
        <Input :additional-class="'basic-input-wide'" :oneerror="email.emailError" :title="'Email'" :type="'text'" v-model="email.email" />
        <Input :additional-class="'basic-input-wide'" :oneerror="passwordError.passwordMismatch || passwordError.passwordRequirement || passwordError.passwordRules" :title="'Password'" :type="'password'" v-model="password.password" />
        <Input :additional-class="'basic-input-wide margin-bottom-10'" :oneerror="passwordError.passwordMismatch || passwordError.passwordRequirement || passwordError.passwordRules" :title="'Repeat password'" :type="'password'" v-model="password.passwordRepeat" />
        <p v-if="passwordError.passwordMismatch" class="paragraph error">Passwords have to match!</p>
        <p v-if="passwordError.passwordRequirement" class="paragraph error">Password are requirement!</p>
        <div v-if="passwordError.passwordRules" class="password-requirement">

          <div v-for="rule in passwordRulesList" style="display: flex;">
            <div v-for="(item) in Object.entries(rule)">
              <p>
                <span v-if="item[0] === 'text'">{{ item[1] }}</span>
                <span v-else>
                  <span class="paragraph medium success" v-if="item[1]">OK</span>
                  <span class="paragraph medium error" v-else>NOT OK</span>
                </span>
              </p>
            </div>
          </div>
        </div>

        <Checkbox v-model="tac" :label="`I have read and accepted <a href='/'>terms and conditions.</a>`" />
        <p v-if="status === -1" class="paragraph error">User with this email already exists!</p>
        <Button :label="'Sign up'" :clickon="register" :disabled="!validFields()" />
      </div>
      <div class="login-inputs-container" v-else>
        <h1>Conformation email has been sent.</h1>
        <p class="paragraph medium">Please, follow the instruction in the email to complete registration process.</p>
        <p class="paragraph medium">The link will be valid for 24 hours.</p>
      </div>
    </div>

  </div>
</template>

<script>
import { registration } from "~/mixins/register";
export default {
  name: "register",
  mixins: [ registration ]
}
</script>

<style lang="scss">
@import "../assets/css/login";
</style>
