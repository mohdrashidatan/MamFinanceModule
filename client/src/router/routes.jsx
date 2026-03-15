import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { NotFoundPage } from "../components/ErrorPage";
import { PublicRoute } from "@/components/layout/PublicRoute";
import LoginPage from "@/pages/LoginPage";
import Layout from "@/components/layout/Layout";
import DashboardPage from "@/pages/DashboardPage";
import ProfilePage from "@/pages/ProfilePage";

const privateRoutes = {
  path: "/",
  element: (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: <DashboardPage /> },
    { path: "dashboard", element: <DashboardPage /> },
    { path: "profile", element: <ProfilePage /> },
  ],
};

const publicRoutes = [
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
];

export const routes = [
  ...publicRoutes,
  privateRoutes,
  { path: "*", element: <NotFoundPage /> },
];
