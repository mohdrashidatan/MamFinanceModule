import { useEffect } from "react";

export const usePageTitle = (pageTitle) => {
  useEffect(() => {
    const appName = import.meta.env.VITE_APP_NAME || "Client Exam";
    document.title = pageTitle ? `${pageTitle} - ${appName}` : appName;
  }, [pageTitle]);
};
