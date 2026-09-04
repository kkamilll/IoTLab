import { LOG_LEVELS } from './errorLevels.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, logLevel = LOG_LEVELS.ERROR) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.logLevel = logLevel;
  }
}

export class ValidationError extends AppError {
  constructor( message = 'Validation failed', errors = null) {
    super(message || 'Validation failed', 422, LOG_LEVELS.WARN);
    if (errors) this.errors = errors;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400, LOG_LEVELS.WARN);
  }
}

export class DuplicateKeyError extends AppError {
  constructor({ field, value }) {
    super(`Duplicate ${field}: "${value}"`, 409, LOG_LEVELS.WARN);
    this.field = field;
    this.value = value;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You need to be authorized to perform this action") {
    super(message, 401, LOG_LEVELS.WARN);
  }
}

export class PermissionError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, LOG_LEVELS.WARN);
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource = 'Resource', withDefaultEnd = true) {
    super(`${resource}${withDefaultEnd ? " not found" : ""}`, 404, LOG_LEVELS.WARN);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Request could not be completed due to a conflict with existing data") {
    super(message, 409, LOG_LEVELS.WARN);
  }
}

export class ServerError extends AppError {
  constructor({ message, statusCode = 500, logLevel = LOG_LEVELS.ERROR }) {
    super(message || 'Server error', statusCode, logLevel);
  }
}