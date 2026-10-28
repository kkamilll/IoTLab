export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Validates password complexity:
 * - Minimum 8 characters
 * - At least one digit (0-9)
 * - At least one uppercase letter (A-Z)
 * @param {string} password
 * @returns {boolean}
 */
export const isStrongPassword = (password) => {
  if (typeof password !== "string") return false;
  return PASSWORD_REGEX.test(password);
};

export const PASSWORD_COMPLEXITY_ERROR =
  "Hasło musi mieć co najmniej 8 znaków, zawierać co najmniej jedną cyfrę oraz jedną wielką literę.";
