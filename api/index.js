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
    const { data } = await api.post(`/l`, payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const register = async (payload) => {
  try {
    const { data } =  await api.post(`/r`, payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const confirmRegistration = async (payload) => {
  try {
    const { data } = await api.post('/c-r', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const resetPassword = async (payload) => {
  try {
    const { data } = await api.post(`/r-p`, payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const sendVerificationCode = async (payload) => {
  try {
    const { data } = await api.post(`/v-c`, payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const getClientByToken = async (token) => {
  try {
    const { data } = await api.post('/c-b-t', token)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const set2fa = async (payload) => {
  try {
    const { data } = await api.post('/s-2fa', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const disable2fa = async (payload) => {
  try {
    const { data } = await api.post('/d-2fa', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const verify2fa = async (payload) => {
  try {
    const { data } = await api.post('/v-2fa', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const changePassword = async (payload) => {
  try {
    const { data } = await api.post('/c-p', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const closeAccount = async (payload) => {
  try {
    const { data } = await api.post('/c-a', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const freezeAccount = async (payload) => {
  try {
    const { data } = await api.post('/f-a', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const changeEmail = async (payload) => {
  try {
    const { data } = await api.post('/c-e', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const sendEmail = async (payload) => {
  try {
    const { data } = await api.post('/s-e', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const generateReferralLink = async (payload) => {
  try {
    const { data } = await api.post('/g-r-l', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const getReferralLink = async (payload) => {
  try {
    const { data } = await api.post(`/get-r-l`, payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const registrationFromReflink = async (reflink) => {
  try {
    const { data } = await api.get(`/r-f-r-l/${reflink}`)
    return data
  } catch (e) {
    return e.response.data
  }
}
