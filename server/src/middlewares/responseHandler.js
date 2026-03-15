const { StatusCodes } = require("http-status-codes");

exports.responseFormatter = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    const statusCode = res.statusCode || StatusCodes.OK;
    const isError = statusCode >= 400;
    const success = !isError;

    const response = {
      success,
      statusCode,
    };

    if (isError) {
      response.error = {
        message:
          data?.message || data?.details || data?.error || "An error occurred",
        ...(data?.code && { code: data.code }),
        ...(process.env.NODE_ENV !== "production" &&
          data?.stack && { stack: data.stack }),
        ...(data?.errors && { errors: data.errors }),
      };
      response.data = null;
    } else {
      // Extract message if it exists
      const message = data?.message;

      // Handle pagination
      if (data?.pagination) {
        response.pagination = data.pagination;
        response.data = data.data || data.results || data.items;
      }
      // Handle filters
      else if (data?.filters) {
        response.filters = data.filters;
        response.data = data.data || data.results || data.items;
      }
      // Handle meta
      else if (data?.meta) {
        response.meta = data.meta;
        response.data = data.data || data.results || data.items;
      }
      // Handle summary
      else if (data?.summary) {
        response.summary = data.summary;
        response.data = data.data || data.results || data.items;
      }
      // If data has a message, extract it to top level and remove from data
      else if (message) {
        const { message: _, ...restData } = data;
        response.data =
          Object.keys(restData).length > 0 ? restData.data || restData : null;
        response.message = message;
      }
      // Otherwise, use data as is
      else {
        response.data = data?.data || data;
      }

      response.error = null;
    }

    return originalJson.call(this, response);
  };

  // success helper method
  res.success = function (data, message, statusCode = StatusCodes.OK) {
    this.status(statusCode).json({
      data,
      message,
    });
  };

  // error helper method
  res.error = function (
    message,
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR,
    details = null,
  ) {
    this.status(statusCode).json({
      message,
      details,
    });
  };

  next();
};

// 404 handler
exports.notFoundHandler = (req, res, next) => {
  const error = {
    message: "Resource not found",
    details: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
    code: "ENDPOINT_NOT_FOUND",
    suggestions: [
      "Check the URL spelling",
      "Verify the HTTP method",
      "Consult the API documentation",
    ],
  };

  res.status(StatusCodes.NOT_FOUND).json(error);
};

// error handling middleware
exports.errorHandler = (err, req, res, next) => {
  console.error(`Error ${err.status || 500} - ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    ...(req.user && { userId: req.user.id }),
    stack: err.stack,
  });

  let statusCode =
    err.statusCode || err.status || StatusCodes.INTERNAL_SERVER_ERROR;

  let errorResponse = {
    message: "Internal Server Error",
    code: "INTERNAL_ERROR",
  };

  switch (err.name) {
    case "ValidationError":
      statusCode = StatusCodes.BAD_REQUEST;
      errorResponse = {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        validation: Object.keys(err.errors).reduce((acc, key) => {
          acc[key] = err.errors[key].message;
          return acc;
        }, {}),
      };
      break;

    case "CastError":
      statusCode = StatusCodes.BAD_REQUEST;
      errorResponse = {
        message: "Invalid data format",
        code: "INVALID_FORMAT",
        details: `Invalid ${err.path}: ${err.value}`,
      };
      break;

    case "MongoServerError":
      if (err.code === 11000) {
        statusCode = StatusCodes.CONFLICT;
        const field = Object.keys(err.keyPattern)[0];
        errorResponse = {
          message: "Resource already exists",
          code: "DUPLICATE_ENTRY",
          details: `${field} already exists`,
        };
      }
      break;

    case "JsonWebTokenError":
      statusCode = StatusCodes.UNAUTHORIZED;
      errorResponse = {
        message: "Invalid token",
        code: "INVALID_TOKEN",
      };
      break;

    case "TokenExpiredError":
      statusCode = StatusCodes.UNAUTHORIZED;
      errorResponse = {
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      };
      break;

    case "MulterError":
      statusCode = StatusCodes.BAD_REQUEST;
      errorResponse = {
        message: "File upload error",
        code: "UPLOAD_ERROR",
        details: err.message,
      };
      break;

    default:
      if (err.message) {
        errorResponse.message = err.message;
      }
      if (err.code) {
        errorResponse.code = err.code;
      }
  }

  // stack trace in development
  if (process.env.NODE_ENV !== "production") {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Rate limit error handler
exports.rateLimitHandler = (req, res) => {
  res.status(StatusCodes.TOO_MANY_REQUESTS).json({
    message: "Too many requests",
    code: "RATE_LIMIT_EXCEEDED",
    details: "Rate limit exceeded. Please try again later.",
    retryAfter: Math.round(req.rateLimit.resetTime / 1000) || 60,
  });
};

// Async error wrapper utility
exports.asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
