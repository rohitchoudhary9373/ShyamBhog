import { Navigate, Outlet } from "react-router-dom";

export default function AdminRoute() {
  const user = JSON.parse(localStorage.getItem("userInfo"));

  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}