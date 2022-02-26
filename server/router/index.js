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
    const data = await api.post('/login', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post(`/register`, async (req, res) => {
  try {
    const data = await api.post('/register', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post(`/reset-password`, async (req, res) => {
  try {
    const data = await api.post('/reset-password', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post(`/verification-code`, async (req, res) => {
  try {
    const data = await api.post('/verification-code', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/verify-token', async (req, res) => {
  try {
    const data = await api.post('/verify-token', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/set-2fa', async (req, res) => {
  try {
    const data = await api.post('/set-2fa', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/verify-2fa', async (req, res) => {
  try {
    const data = await api.post('/verify-2fa', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/change-password', async (req, res) => {
  try {
    const data = await api.post('/change-password', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/close-account', async (req, res) => {
  try {
    const data = await api.post('/close-account', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/change-email', async (req, res) => {
  try {
    const data = await api.post('/change-email', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

router.post('/send-email', async (req, res) => {
  try {
    const data = await api.post('/send-email', req.body)
    res.json(data.data)
  } catch (e) {
    res.status(e.response.status).json(e.response.data)
  }
})

module.exports = router
