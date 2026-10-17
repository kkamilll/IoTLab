import { ValidationError } from '../errors/CustomErrors.js';

const TREAT_EMPTY_ARRAY_AS_MISSING = true;
const TREAT_EMPTY_OBJECT_AS_MISSING = true;

// checks for schema if all fields that are required are defined
function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

function getRequiredPaths(schema, prefix = '') {
  let requiredPaths = [];

  for (const [key, path] of Object.entries(schema.paths)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;

    if (path.options && path.options.required && path.options.default === undefined) {
      requiredPaths.push(fullPath);
    }

    // If path is a nested schema (Subdocument), recurse
    if (path.schema) {
      requiredPaths = requiredPaths.concat(getRequiredPaths(path.schema, fullPath));
    }
  }

  return requiredPaths;
}

export function validateRequiredFields(model, data) {
  const requiredFields = getRequiredPaths(model.schema);
  

  const errors = {};

  requiredFields.forEach(field => {
    const value = getNestedValue(data, field);

    let isMissing = value === null || value === undefined || value === '';
    if (TREAT_EMPTY_ARRAY_AS_MISSING && Array.isArray(value) && value.length === 0) {
      isMissing = true;
    }
    if (TREAT_EMPTY_OBJECT_AS_MISSING && typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
      isMissing = true;
    }

    if (isMissing) { // null or undefined
      errors[field] = { message: `'${field}' is required.` };
    }
  });

  if (Object.keys(errors).length > 0) {
    const errorsString = Object.keys(errors)
    .map(field => `${field}: Path \`${field}\` is required.`)
    .join(', ');

    throw new ValidationError(`${model.modelName} validation failed: ${errorsString}`, { errors });
  }
}