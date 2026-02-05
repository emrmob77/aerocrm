export const MIN_AUTH_PASSWORD_LENGTH = 6

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ValidationResult =
  | { ok: true; normalizedEmail: string }
  | { ok: false; reason: 'invalid_email' | 'invalid_password' | 'invalid_name' }

export const normalizeAuthEmail = (email: string) => email.trim().toLowerCase()

export const isValidAuthEmail = (email: string) => EMAIL_PATTERN.test(normalizeAuthEmail(email))

const isValidAuthPassword = (password: string) =>
  password.length >= MIN_AUTH_PASSWORD_LENGTH && password.trim().length > 0

export const validateSignInCredentials = (email: string, password: string): ValidationResult => {
  const normalizedEmail = normalizeAuthEmail(email)
  if (!isValidAuthEmail(normalizedEmail)) {
    return { ok: false, reason: 'invalid_email' }
  }
  if (!isValidAuthPassword(password)) {
    return { ok: false, reason: 'invalid_password' }
  }
  return { ok: true, normalizedEmail }
}

export const validateSignUpCredentials = (email: string, password: string, fullName: string): ValidationResult => {
  const signInValidation = validateSignInCredentials(email, password)
  if (!signInValidation.ok) {
    return signInValidation
  }
  if (fullName.trim().length < 2) {
    return { ok: false, reason: 'invalid_name' }
  }
  return signInValidation
}
