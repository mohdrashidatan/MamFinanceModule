const express = require("express");
const { validateBody } = require("../middlewares/validateSchema");
const { registrationSchema, loginSchema } = require("../schemas/authSchema");
const { registerUser, loginUser } = require("../controllers/authController");
const { loginLimiter, registerLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.post("/login", loginLimiter, validateBody(loginSchema), loginUser);
router.post("/register", registerLimiter, validateBody(registrationSchema), registerUser);


module.exports = router;
