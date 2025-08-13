import { LOG_LEVELS } from './errorLevels.js';

export class ValidationError extends Error {
  constructor({ message, errors } = {}) {
    super(message || 'Validation failed');
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.logLevel = LOG_LEVELS.WARN;
    if (errors) {
      this.errors = errors;
    }
  }
}

export class BadRequestError extends Error {
  constructor(message = 'Bad Request') {
    super(message);
    this.name = 'BadRequestError';
    this.statusCode = 400;
    this.logLevel = 'warn'; // optional, if you have logging
  }
}

export class DuplicateKeyError extends Error {
  constructor({ field, value }) {
    super(`${field} "${value}" already exists`);
    this.name = 'DuplicateKeyError';
    this.statusCode = 400;
    this.logLevel = LOG_LEVELS.WARN;
    this.field = field;
    this.value = value;
  }
}
// return res.status(400).json({ success: false, message: 'Duplicate key error', errors: [`Email "${error.keyValue.email}" already exists`] });

export class UnauthorizedActionError extends Error {
  constructor(message = "You do not have permission to perform this action") {
    super(message);
    this.name = "UnauthorizedActionError";
    this.statusCode = 403;
  }
}

export class ResourceNotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'ResourceNotFoundError';
    this.statusCode = 404;
    this.logLevel = 'warn';
  }
}

export class ServerError extends Error {
  constructor({ message, statusCode = 500, logLevel = LOG_LEVELS.ERROR  }) {
    super(message || 'Server error');
    this.name = 'ServerError';
    this.statusCode = statusCode;
    this.logLevel = logLevel;
  }
}