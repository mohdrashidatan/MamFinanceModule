const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const Router = require("./routes/index");
const cookieParser = require("cookie-parser");
const {
  responseFormatter,
  notFoundHandler,
  errorHandler,
} = require("./middlewares/responseHandler");
// const { publicLimiter, apiLimiter } = require("./middlewares/rateLimiter");

const app = express();

app.set("trust proxy", 1);

let allowedOrigins;
try {
  allowedOrigins =
    process.env.FRONTEND_URL ?
      JSON.parse(process.env.FRONTEND_URL)
    : ["http://localhost:5173"];
} catch (e) {
  allowedOrigins = process.env.FRONTEND_URL || "http://localhost:5173";
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// Security & Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(morgan("common"));
app.use(responseFormatter);

// app.get("/debug/trust-proxy-test", createTrustProxyDebugger());
// app.get("/debug/ip", createIPInfoEndpoint());

// app.use(publicLimiter);
// app.use("/api", apiLimiter);

// Routes
app.get("/", (req, res) => {
  res.send(`<h1>SERVER IS RUNNING! 🚀</h1>`);
});
app.use("/api", Router);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
