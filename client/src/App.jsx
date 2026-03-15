import { BrowserRouter, useRoutes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { routes } from "./router/routes";
import AuthProvider from "./providers/AuthProvider";

function AppRoutes() {
  const routeElements = useRoutes(routes);
  return routeElements;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          // position="top-center"
          toastOptions={{
            success: {
              style: {
                border: "1px solid green",
              },
            },
            error: {
              style: {
                border: "1px solid red",
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
