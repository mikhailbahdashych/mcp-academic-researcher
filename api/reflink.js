import axios from "axios";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const apiUrl = process.server ? `${process.env.FRONT}api/` : '/api/';

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const generateReferralLink = async (payload) => {
  try {
    const { data } = await api.post('/g-r-l', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const getReferralLink = async ({ token }) => {
  try {
    const { data } = await api.get(`/get-r-l`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
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
