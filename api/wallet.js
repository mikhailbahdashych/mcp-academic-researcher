import axios from "axios";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const apiUrl = process.server ? `${process.env.FRONT}api/` : '/api/';

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const checkWallets = async (payload) => {
  try {
    const { data } = await api.post('/c-w', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}
