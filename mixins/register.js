import { register, sendEmail } from "~/api";
import { verifyClientByToken } from "~/helpers/auth";
import { mapActions } from "vuex";
import { validateEmail, validatePassword, validatePasswordRules } from "~/helpers/frontValidators";

export const registration = {
  watch: {
    ...mapActions([
      'fetchTac',
      'fetchError',
      'fetchStatus',
      'fetchPassword',
      'fetchEmail',
      'fetchPasswordError',
      'fetchPasswordRulesList'
    ]),
    'password.password': {
      handler: function () {
        if (this.password.password === this.password.passwordRepeat) { this.passwordError.passwordMismatch = false }
        this.validPassword()
      }
    },
    'password.passwordRepeat': {
      handler: function () {
        if (this.password.password === this.password.passwordRepeat) { this.passwordError.passwordMismatch = false }
        this.validPassword()
      }
    },
    'email.email': {
      handler: function () {
        if (!validateEmail(this.email.email)) this.email.emailError = true
        else if (validateEmail(this.email.email) === 1) this.email.emailError = false
        else this.email.emailError = false
      }
    },
  },
  computed: {
    error: {
      get() { return this.$store.getters.getError },
      set(value) { this.$store.commit('setError', value) }
    },
    email: {
      get() { return this.$store.getters.getEmail },
      set(value) { this.$store.commit('setEmail', value) }
    },
    password: {
      get() { return this.$store.getters.getPassword },
      set(value) { this.$store.commit('setPassword', value) }
    },
    status: {
      get() { return this.$store.getters.getStatus },
      set(value) { this.$store.commit('setStatus', value) }
    },
    tac: {
      get() { return this.$store.getters.getTac },
      set(value) { this.$store.commit('setTac', value) }
    },
    passwordError: {
      get() { return this.$store.getters.getPasswordError },
      set(value) { this.$store.commit('setPasswordError', value) }
    },
    passwordRulesList: {
      get() { return this.$store.getters.getPasswordRulesList },
      set(value) { this.$store.commit('setPasswordRulesList', value) }
    }
  },
  destroyed() {
    this.$store.commit('setDefaultValues')
  },
  async mounted() {
    await verifyClientByToken(this.$router, localStorage.getItem('token'), false, true)
  },
  methods: {
    async redirect(path) {
      await this.$router.push({ path })
    },
    validFields() {
      return this.tac &&
        !this.email.emailError &&
        this.email.email && this.password.password && this.password.passwordRepeat &&
        (!this.passwordError.passwordMismatch && !this.passwordError.passwordRequirement && !this.passwordError.passwordRules)
    },
    validPassword() {
      this.$store.commit('setPasswordRulesList', validatePasswordRules(this.password.password))
      this.passwordError.passwordMismatch = !!((this.password.password && this.password.passwordRepeat) && (this.password.password !== this.password.passwordRepeat));
      this.passwordError.passwordRequirement = !this.password.password || !this.password.passwordRepeat;
      this.passwordError.passwordRules = !!(!validatePassword(this.password.password) || !validatePassword(this.password.passwordRepeat));
      if (!this.password.password && !this.password.passwordRepeat) {
        this.passwordError.passwordMismatch = false
        this.passwordError.passwordRequirement = false
        this.passwordError.passwordRules = false
      }
    },
    async register() {
      if (this.validFields()) {
        await register({
          email: this.email.email,
          password: this.password.password
        }).then(async (res) => {
          if (res.status === -1) return this.$store.commit('setStatus', res.status)
          await sendEmail({ type: 'reg', to: this.email.email }).then((res) => {
            if (res.status === 1) this.$store.commit('setStatus', res.status)
          })
        }).catch(() => {
          this.$store.commit('setStatus', -1)
        })
      }
    }
  }
}
