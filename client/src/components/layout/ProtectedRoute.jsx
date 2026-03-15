import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { UnauthorizedPage } from "../ErrorPage";

export const ProtectedRoute = ({
  children,
  resource = null,
  action = null,
  roles = [],
}) => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <UnauthorizedPage
        title="Restricted"
        message="Insuffiecient Role or Permissions, you do not have access to this area."
        code="403"
      />
    );
  }

  if (resource && action && !hasPermission(resource, action)) {
    return (
      <UnauthorizedPage
        title="Restricted"
        message="Insuffiecient Role or Permissions, you do not have access to this area."
        code="403"
      />
    );
  }

  return children;
};
