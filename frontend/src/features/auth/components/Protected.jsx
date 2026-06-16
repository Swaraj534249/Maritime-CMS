import { useSelector } from "react-redux";
import { selectLoggedInUser } from "../AuthSlice";
import { Navigate } from "react-router-dom";

export const Protected = ({ children }) => {
  const loggedInUser = useSelector(selectLoggedInUser);

  if (!loggedInUser) {
    return <Navigate to="/login" replace />;
  }

  const canAccess =
    loggedInUser.role === "SUPER_ADMIN" ||
    loggedInUser.status === "active" ||
    loggedInUser.status === "verified";

  if (!canAccess) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
