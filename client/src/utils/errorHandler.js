export const handleServiceError = (error, defaultMessage) => {
  // Handle network/connection errors
  if (error.code === "ERR_NETWORK" || error.code === "ERR_CONNECTION_REFUSED") {
    throw new Error("Server is not available. Please try again later.");
  } else if (
    error.message &&
    error.message.includes("ERR_CONNECTION_REFUSED")
  ) {
    throw new Error("Server is not available. Please try again later.");
  } else if (error.message && error.message.includes("Network Error")) {
    throw new Error("Network error. Please check your internet connection.");
  }

  // Handle API errors
  if (error.response && error.response.data) {
    const { error: apiError } = error.response.data;

    // Handle validation errors with specific field errors
    if (
      apiError?.errors &&
      Array.isArray(apiError.errors) &&
      apiError.errors.length > 0
    ) {
      // Use the first validation error for user display
      throw new Error(apiError.errors[0].message || defaultMessage);
    }

    // Handle general API errors
    if (apiError?.message) {
      throw new Error(apiError.message);
    }
  }

  // Fallback error
  throw new Error(error.message || defaultMessage);
};
