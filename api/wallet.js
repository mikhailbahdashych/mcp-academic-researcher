import axios from "axios";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const apiUrl = process.server ? `${process.env.FRONT}api/` : '/api/';

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const checkWallets = async ({ token }) => {
  try {
    const { data } = await api.get('/c-w', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return data
  } catch (e) {
    return e.response.data
  }
}
