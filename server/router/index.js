process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const { Router } = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
dotenv.config()

const api = axios.create({
  baseURL: process.env.NODE_ENV === "development" ? '' : ''
})

const router = Router()

router.post(``, async (req, res) => {
  try {
    //
  } catch (e) {
    console.log(e)
  }
})

router.post(``, async (req, res) => {
  try {
    //
  } catch (e) {
    console.log(e)
  }
})

module.exports = router
