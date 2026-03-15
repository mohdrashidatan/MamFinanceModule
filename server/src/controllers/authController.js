const authService = require("../services/authService");

const registerUser = async (req, res) => {
  try {
    const userData = req.body;
    const user = await authService.registerUser(userData);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.message === "Email already registered") {
      return res.status(409).json({
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;
    const result = await authService.loginUser(emailAddress, password);

    res.status(200).json({
      message: "Login successful",
      token: result.token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error.message.includes("Invalid email or password")) {
      return res.status(401).json({
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
