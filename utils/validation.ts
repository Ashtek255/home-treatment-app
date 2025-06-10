export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" }
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: "Password must contain at least one special character" }
  }
  return { valid: true, message: "" }
}

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024
}

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type)
}

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, "")
}
