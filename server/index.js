const app = require("./src/app");
const pool = require("./src/config/db");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

async function checkDatabaseConnection(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log("Database connection successful!");
      connection.release();
      return true;
    } catch (error) {
      console.error(
        `Database connection attempt ${i + 1} failed:`,
        error.message
      );
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

async function startServer() {
  try {
    // Check database connection first
    const isDatabaseConnected = await checkDatabaseConnection();

    if (!isDatabaseConnected) {
      console.error(
        "Server startup aborted due to database connection failure"
      );
      process.exit(1);
    }

    // Start the Express server if database connection is successful
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();
