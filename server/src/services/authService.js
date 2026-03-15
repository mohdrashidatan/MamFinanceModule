const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const { generateAuthToken } = require("../utils/tokenUtils");

const authService = {
  async registerUser(userData) {
    const { name, emailAddress, password } = userData;
    const existingUser = await User.findUserByEmail(emailAddress);
    if (existingUser) {
      throw new Error("Email already registered");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userId = await User.createUser({
      name,
      emailAddress,
      password: hashedPassword,
    });

    return {
      userId,
      name,
      emailAddress,
    };
  },
  async loginUser(email, password) {
    const user = await User.findUserByEmail(email);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT token
    const token = generateAuthToken({
      userId: user.user_id,
      userName: user.name,
      email: user.email,
    });

    return {
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
      },
    };
  },
};

module.exports = authService;
