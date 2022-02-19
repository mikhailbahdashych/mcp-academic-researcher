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
