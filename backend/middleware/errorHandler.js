import { LOG_LEVELS } from "../errors/errorLevels.js";

export function errorHandler(err, req, res, next) {
  switch (err.logLevel) {
    case LOG_LEVELS.ERROR:
        console.error(`ERROR: [${err.name}]`, err.message);
        break;
    case LOG_LEVELS.WARN:
        console.warn(`WARNING: [${err.name}]`, err.message);
        break;
    case LOG_LEVELS.INFO:
        console.info(`INFO: [${err.name}]`, err.message);
        break;
    case LOG_LEVELS.SILENT:
    default:
        // nothing
        break;
    }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error',
    errors: err.errors || undefined
  });
}