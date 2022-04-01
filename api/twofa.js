import axios from "axios";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const apiUrl = process.server ? `${process.env.FRONT}api/` : '/api/';

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

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

export const checkFor2fa = async ({ token }) => {
  try {
    const { data } = await api.get('/v-2fa', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return data
  } catch (e) {
    return e.response.data
  }
}
