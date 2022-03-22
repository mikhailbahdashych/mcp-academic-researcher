export const validateEmail = (email) => {
  if (email) {
    const regex = new RegExp('[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?')
    return regex.test(email);
  } else if (email === '') {
    return 1
  } else {
    return null
  }
}

export const validatePassword = (password) => {
  if (password) {
    const regex = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$")
    return regex.test(password)
  } else {
    return null
  }
}

export const validatePasswordLength = (password) => {
  if (password) {
    return password.length >= 8
  } else {
    return null
  }
}

export const validatePasswordRules = (password) => {
  let legitPassword = {
    eightChars: false,
    uppCase: false,
    lowCase: false,
    specChar: false,
    digitChar: false
  }
  if (password) {
    if (password.length >= 8) {
      legitPassword.eightChars = true
    }
    if (/[a-z]/.test(password)) {
      legitPassword.lowCase = true
    }
    if (/[#?!@$%^&*-]/.test(password)) {
      legitPassword.specChar = true
    }
    if (/\d/.test(password)) {
      legitPassword.digitChar = true
    }
    if (/[A-Z]/.test(password)) {
      legitPassword.uppCase = true
    }
  }
  return legitPassword
}

export const setParser = (state, statename, value) => {
  Object.entries(value).forEach(item => {
    Object.entries(state[statename]).forEach(modal => {
      if (item[0] === modal[0]) state[statename][item[0]] = item[1]
    })
  })
}

export const validate2fa = (i) => {
  if (i.length > 1) { i = i.slice(0, 1) }
  return i
}
