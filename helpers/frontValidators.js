export const validateEmail = (email) => {
  const regex = new RegExp('[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?')
  return regex.test(email);
}

export const validatePassword = (password) => {
  // at least one upper case, one lower case, one digit, one spec. char., min 8 length
  const regex = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$")
  return regex.test(password)
}

export const validatePasswordLength = (password) => {
  if (password) return password.length >= 8
}
