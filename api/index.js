import axios from "axios";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const apiUrl = process.server ? `${process.env.FRONT}api/` : '/api/';

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const login = async (payload) => {
  try {
    const { data } = await api.post(`/login`, payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const register = async (payload) => {
  try {
    const { data } =  await api.post(`/register`, payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const confirmRegistration = async (payload) => {
  try {
    const { data } = await api.post('/confirm-registration', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const resetPassword = async (payload) => {
  try {
    const { data } = await api.post(`/reset-password`, payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const sendVerificationCode = async (payload) => {
  try {
    const { data } = await api.post(`/verification-code`, payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const verifyToken = async (payload) => {
  try {
    const { data } = await api.post('/verify-token', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const set2fa = async (payload) => {
  try {
    const { data } = await api.post('/set-2fa', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const disable2fa = async (payload) => {
  try {
    const { data } = await api.post('/disable-2fa', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const verify2fa = async (payload) => {
  try {
    const { data } = await api.post('/verify-2fa', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const changePassword = async (payload) => {
  try {
    const { data } = await api.post('/change-password', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const closeAccount = async (payload) => {
  try {
    const { data } = await api.post('/close-account', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const changeEmail = async (payload) => {
  try {
    const { data } = await api.post('/change-email', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const sendEmail = async (payload) => {
  try {
    const { data } = await api.post('/send-email', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}
