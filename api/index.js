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
  const { data } = await api.post(`login`, payload)
  return data
}

export const register = async (payload) => {
  const { data } =  await api.post(`register`, payload)
  return data
}

export const resetPassword = async (payload) => {
  const { data } = await api.post(`reset-password`, payload)
}
