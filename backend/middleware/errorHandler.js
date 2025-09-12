import { LOG_LEVELS } from "../errors/errorLevels.js";

export function errorHandler(error, req, res, next) {
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
    default:
        // nothing
        break;
    }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server error',
    errors: error.errors || undefined
  });
}