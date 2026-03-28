const express = require("express");
const authRoute = require("./authRoutes");
const profileRoute = require("./profileRoutes");
const attendanceRoute = require("./attendanceRoutes");

const Router = express.Router();

// Auth Route
Router.use("/auth", authRoute);

Router.use("/profile", profileRoute);

Router.use("/attendance", attendanceRoute);

module.exports = Router;
