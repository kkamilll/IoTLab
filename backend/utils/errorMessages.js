// takes error messages and converts to one or if none then sets 'Unknown error'
export function extractErrorMessages(error) {
  return error?.errors ? Object.values(error.errors).map(err => err.message) : [error.message || 'Unknown error'];
}