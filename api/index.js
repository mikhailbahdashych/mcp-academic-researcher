import axios from "axios";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const apiUrl = process.server ? `${process.env.FRONT}api/` : '/api/';

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(function (config) {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.common['Authorization'] = 'Bearer ' + token
  }
  return config;
}, function (error) {
  return Promise.reject(error);
});


export const login = async (payload) => {
  const { data } = await api.post(`/login`, payload)
  return data
}

export const register = async (payload) => {
  const { data } =  await api.post(`/register`, payload)
  return data
}

export const resetPassword = async (payload) => {
  const { data } = await api.post(`/reset-password`, payload)
  return data
}

export const sendVerificationCode = async (payload) => {
  const { data } = await api.post(`/verification-code`, payload)
  return data
}

export const verifyToken = async (payload) => {
  const { data } = await api.post('/verify-token', payload)
  return data
}

export const set2fa = async (payload) => {
  try {
    const { data } = await api.post('/set-2fa', payload)
    return data
  } catch (e) {
    return e.response.data
  }
}

export const verify2fa = async (payload) => {
  const { data } = await api.post('/verify-2fa', payload)
  return data
}

export const changePassword = async (payload) => {
  const { data } = await api.post('/change-password', payload)
  return data
}

export const closeAccount = async (payload) => {
  const { data } = await api.post('/close-account', payload)
  return data
}

export const changeEmail = async (payload) => {
  const { data } = await api.post('/change-email', payload)
  return data
}
