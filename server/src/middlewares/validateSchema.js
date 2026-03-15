const { ZodError, z } = require("zod");

const validate = (schema, target = "body") => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[target];
      const validatedData = schema.parse(dataToValidate);

      req[target] = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = (error.issues || []).map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          errors: formattedErrors,
          message: "Validation failed",
        });
      }

      console.error("Unexpected validation error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};

const validateBody = (schema) => validate(schema, "body");

const validateQuery = (schema) => validate(schema, "query");

const validateParams = (schema) => validate(schema, "params");

const validateMultiple = (schemas) => {
  return (req, res, next) => {
    try {
      const errors = [];

      if (schemas.body) {
        try {
          req.body = schemas.body.parse(req.body);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(
              ...error.issues.map((err) => ({
                target: "body",
                field: err.path.join("."),
                message: err.message,
                code: err.code,
              })),
            );
          }
        }
      }

      if (schemas.query) {
        try {
          req.query = schemas.query.parse(req.query);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(
              ...error.issues.map((err) => ({
                target: "query",
                field: err.path.join("."),
                message: err.message,
                code: err.code,
              })),
            );
          }
        }
      }

      if (schemas.params) {
        try {
          req.params = schemas.params.parse(req.params);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(
              ...error.issues.map((err) => ({
                target: "params",
                field: err.path.join("."),
                message: err.message,
                code: err.code,
              })),
            );
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors || "Invalid request",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateMultiple,
};
