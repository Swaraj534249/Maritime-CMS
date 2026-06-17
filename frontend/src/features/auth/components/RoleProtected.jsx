import { useSelector } from "react-redux";
import { selectLoggedInUser } from "../AuthSlice";
import { Navigate } from "react-router-dom";
import { Box, Typography, Stack, Button } from "@mui/material";
import { Link } from "react-router-dom";

export const RoleProtected = ({ children, allowedRoles = [] }) => {
  const loggedInUser = useSelector(selectLoggedInUser);

  if (!loggedInUser) {
    return <Navigate to="/login" replace />;
  }

  if (
    loggedInUser.role === "AGENT" &&
    loggedInUser.status === "verified"
  ) {
    return <Navigate to="/agent/onboarding" replace />;
  }

  if (loggedInUser.status !== "active") {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(loggedInUser.role)) {
    return (
      <Stack
        width="100vw"
        height="100vh"
        justifyContent="center"
        alignItems="center"
        spacing={3}
      >
        <Typography variant="h3" fontWeight={600}>
          403
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Access Denied
        </Typography>
        <Typography color="text.secondary">
          You don't have permission to access this page
        </Typography>
        <Button variant="contained" component={Link} to="/dashboard">
          Go to Dashboard
        </Button>
      </Stack>
    );
  }

  return children;
};

export const AgencyAdminProtected = ({ children }) => {
  return (
    <RoleProtected allowedRoles={["AGENCY_ADMIN", "SUPER_ADMIN"]}>
      {children}
    </RoleProtected>
  );
};

export const AgentProtected = ({ children }) => {
  return (
    <RoleProtected allowedRoles={["AGENT", "AGENCY_ADMIN", "SUPER_ADMIN"]}>
      {children}
    </RoleProtected>
  );
};

export const SuperAdminProtected = ({ children }) => {
  return (
    <RoleProtected allowedRoles={["SUPER_ADMIN"]}>{children}</RoleProtected>
  );
};
