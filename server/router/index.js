process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const { Router } = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
dotenv.config()

const api = axios.create({
  baseURL: process.env.NODE_ENV === "development" ? process.env.API_DEV : process.env.API_PROD
})

const router = Router()

router.post(`/l`, async (req, res) => {
  try {
    const data = await api.post('/login', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post(`/r`, async (req, res) => {
  try {
    const data = await api.post('/register', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/c-r', async (req, res) => {
  try {
    const data = await api.post('/confirm-registration', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.get('/c-b-t', async (req, res) => {
  try {
    const data = await api.get('/client-by-token', {
      headers: { 'Authorization': req.headers.authorization, }
    })
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/s-2fa', async (req, res) => {
  try {
    const data = await api.post('/set-2fa', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/d-2fa', async (req, res) => {
  try {
    const data = await api.post('/disable-2fa', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/v-2fa', async (req, res) => {
  try {
    const data = await api.post('/verify-2fa', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/c-p', async (req, res) => {
  try {
    const data = await api.post('/change-password', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/f-o-c-a', async (req, res) => {
  try {
    const data = await api.post('/freeze-or-close-account', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/c-e', async (req, res) => {
  try {
    const data = await api.post('/change-email', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/s-e', async (req, res) => {
  try {
    const data = await api.post('/send-email', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/g-r-l', async (req, res) => {
  try {
    const data = await api.post('/generate-referral-link', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.get('/get-r-l', async (req, res) => {
  try {
    const data = await api.get('/get-referral-link', {
      headers: { 'Authorization': req.headers.authorization, }
    })
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.get('/r-f-r-l/:reflink', async (req, res) => {
  try {
    const data = await api.get(`/registration-from-reflink/${req.params.reflink}`)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

module.exports = router
