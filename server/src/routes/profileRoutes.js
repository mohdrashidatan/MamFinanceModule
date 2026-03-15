const express = require("express");
const { authenticateToken } = require("../middlewares/authMiddleware");
const router = express.Router();

// Protected route example
router.get("/", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "This is a protected route",
    user: req.user,
  });
});

module.exports = router;
