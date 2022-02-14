// eslint-disable-next-line nuxt/no-cjs-in-config
const dotenv = require('dotenv');
dotenv.config()

// eslint-disable-next-line nuxt/no-cjs-in-config
module.exports = {
  // Global page headers: https://go.nuxtjs.dev/config-head
  privateRuntimeConfig: {
    nodeEnv: process.env.NODE_ENV
  },
  mode: 'universal',
  telemetry: false,
  server: {
    port: process.env.ENV_PORT,
    host: process.env.ENV_HOST
  },
  head: {
    title: 'botcryptotrader-front',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    '@nuxtjs/google-fonts'
  ],

  googleFonts: {
    families: {
      Lato: [100, 300, 500],
      Inter: [100, 300, 500]
    }
  },

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {},

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
  }
}
