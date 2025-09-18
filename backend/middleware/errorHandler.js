import { LOG_LEVELS } from "../errors/errorLevels.js";
import { MongoServerError } from 'mongodb';
import { DuplicateKeyError } from '../errors/CustomErrors.js'

export function errorHandler(error, req, res, next) {
  if (error instanceof MongoServerError && error.code === 11000) {
    const [field, value] = Object.entries(error.keyValue)[0];
    error = new DuplicateKeyError({ field, value });
  }

  switch (error.logLevel) {
    case LOG_LEVELS.ERROR:
        console.error(`ERROR: [${error.name}]`, error.message);
        break;
    case LOG_LEVELS.WARN:
        console.warn(`WARNING: [${error.name}]`, error.message);
        break;
    case LOG_LEVELS.INFO:
        console.info(`INFO: [${error.name}]`, error.message);
        break;
    case LOG_LEVELS.SILENT:
        break;
    default:
        break;
    }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server error',
    errors: error.errors || undefined
  });
}