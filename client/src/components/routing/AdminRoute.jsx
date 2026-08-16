import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function AdminRoute() {
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default AdminRoute;
