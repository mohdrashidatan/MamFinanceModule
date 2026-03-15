const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const EXP_TIME = process.env.JWT_EXP_TIME || "1h";

/**
 * Generate JWT token for authentication
 * @param {Object} payload User data to include in token
 * @returns {string} JWT token
 */
exports.generateAuthToken = (payload) => {
  const enhancedPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomBytes(16).toString("hex"),
  };

  return jwt.sign(enhancedPayload, JWT_SECRET, {
    expiresIn: EXP_TIME,
    algorithm: "HS512",
    audience: process.env.JWT_AUDIENCE || "api",
    issuer: process.env.JWT_ISSUER || "auth",
  });
};

/**
 * Verify JWT token
 * @param {string} token JWT token to verify
 * @returns {Object} Decoded token payload
 */
exports.verifyAuthToken = (token) => {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ["HS512"],
    audience: process.env.JWT_AUDIENCE || "api",
    issuer: process.env.JWT_ISSUER || "auth",
  });
};
