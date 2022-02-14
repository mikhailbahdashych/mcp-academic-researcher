process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const { Router } = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
dotenv.config()

const api = axios.create({
  baseURL: process.env.NODE_ENV === "development" ? process.env.API_DEV : process.env.API_PROD
})

const router = Router()

router.post(`/login`, async (req, res) => {
  try {
    console.log('req.body', req.body)
    const data = await api.post('/register', req.body)
    res.json(data.data)
  } catch (e) {
    console.log(e)
  }
})

router.post(`/register`, async (req, res) => {
  try {
    const data = await api.post('/register', req.body)
    res.json(data.data)
  } catch (e) {
    console.log(e)
  }
})

module.exports = router
