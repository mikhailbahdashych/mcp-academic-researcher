const dotenv = require('dotenv')
dotenv.config()

const express = require('express');
const consola = require('consola')
const bodyParser = require('body-parser');
const { Nuxt } = require('nuxt')
const app = express()

const config = require('../nuxt.config.js')

app.use(bodyParser.json({limit: '1mb'}))

const routes = require('./router')
app.use('/api', routes)

async function start() {
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  app.use(nuxt.render)

  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}
start()
