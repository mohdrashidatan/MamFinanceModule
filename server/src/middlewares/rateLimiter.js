const rateLimit = require("express-rate-limit");

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || "unknown";
};

const getLoginIdentifier = (req) => {
  const email =
    typeof req.body?.emailAdress === "string" ?
      req.body.emailAddress.toLowerCase().trim()
    : "unknown";

  const ip = getClientIp(req);

  return { email, ip };
};

const createRateLimiter = ({
  windowMs,
  limit,
  message,
  keyPrefix,
  skipSuccess = false,
  skipFailed = false,
  skip,
  keyGenerator,
}) => {
  const limiterConfig = {
    windowMs,
    limit,
    message: {
      success: false,
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: skipSuccess,
    skipFailedRequests: skipFailed,
    keyGenerator:
      keyGenerator ||
      ((req) => {
        const ip = getClientIp(req);
        return keyPrefix ? `${keyPrefix}:${ip}` : ip;
      }),
  };

  if (skip) {
    limiterConfig.skip = skip;
  }

  return rateLimit(limiterConfig);
};

const publicLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  limit: 30,
  message: "Too many requests. Please wait a moment and try again",
  keyPrefix: "public",
});

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message:
    "You've made too many requests. Please wait a few minutes and try again.",
  keyPrefix: "api",
});

const loginLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  message:
    "Too many login attempts by IP Address, please try again after 10 minutes.",
  skipSuccess: true,
  keyPrefix: "login",
  keyGenerator: (req) => {
    const { email, ip } = getLoginIdentifier(req);
    return `login:${email}:${ip}`;
  },
});

const registerLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  message:
    "Too many registration attempts by IP Address, please try again after 10 minutes.",
  keyPrefix: "register",
  skipSuccess: true,
});

const forgotPasswordLimiter = createRateLimiter({
  windowMs: 30 * 60 * 1000,
  limit: 3,
  message: "Too many password reset requests. Please try again later.",
  keyPrefix: "forgot-password",
  keyGenerator: (req) => {
    const email =
      typeof req.body?.emailAddress === "string" ?
        req.body.emailAddress.toLowerCase().trim()
      : "unknown";

    const ip = getClientIp(req);
    return `forgot:${email}:${ip}`;
  },
});

const resetPasswordLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 3,
  message:
    "Too many password reset attempts by IP Address, please try again after 10 minutes.",
  keyPrefix: "reset-password",
  skipSuccess: true,
});

module.exports = {
  publicLimiter,
  apiLimiter,
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  createRateLimiter,
};
