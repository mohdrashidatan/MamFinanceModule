const { verifyAuthToken } = require("../utils/tokenUtils");

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = verifyAuthToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(403).json({
      success: false,
      message: "Invalid access token",
      code: "INVALID_TOKEN",
    });
  }
};

// const checkPermission = (resource, action) => {
//   return async (req, res, next) => {
//     try {
//       const permissions = await roleModel.getPermissionsByRoleId(req.user.role);

//       const hasPermission = permissions.some(
//         (p) => p.resource_code === resource && p.action === action,
//       );

//       if (!hasPermission) {
//         return res.status(403).json({ error: "Forbidden" });
//       }

//       next();
//     } catch (error) {
//       return res.status(500).json({ error: "Permission check failed" });
//     }
//   };
// };

module.exports = {
  authenticateToken,
};
