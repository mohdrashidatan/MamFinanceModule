const express = require("express");
const authRoute = require("./authRoutes");
const profileRoute = require("./profileRoutes");

const Router = express.Router();

// Auth Route
Router.use("/auth", authRoute);

Router.use("/profile", profileRoute);

module.exports = Router;
