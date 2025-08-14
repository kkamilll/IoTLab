import { ValidationError } from '../errors/CustomErrors.js';

// checks for schema if all fields that are required are defined
export function validateRequiredFields(model, data) {
  const requiredFields = Object.entries(model.schema.paths)
    .filter(([key, path]) => path.isRequired)
    .map(([key]) => key);

  const errors = {};
  requiredFields.forEach(field => {
    if (!data[field]) {
      errors[field] = { message: `'${field}' is required.` };
    }
  });

  if (Object.keys(errors).length > 0) {
    throw new ValidationError({ errors });
  }
}