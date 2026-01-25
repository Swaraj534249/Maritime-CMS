import { useSelector } from "react-redux";
import { selectLoggedInUser } from "../AuthSlice";
import { Navigate } from "react-router";
import { Box, Typography, Stack, Button } from "@mui/material";
import { Link } from "react-router-dom";

/**
 * Basic authentication protection
 * Checks if user is logged in and verified
 */
export const Protected = ({ children }) => {
  const loggedInUser = useSelector(selectLoggedInUser);

  if (!loggedInUser) {
    return <Navigate to="/login" replace={true} />;
  }

  if (!loggedInUser?.isVerified) {
    return <Navigate to="/verify-otp" replace={true} />;
  }

  return children;
};

/**
 * Role-based protection
 * Checks if user has required role(s)
 * Usage: <RoleProtected allowedRoles={['AGENCY_ADMIN', 'SUPER_ADMIN']}><Component /></RoleProtected>
 */
export const RoleProtected = ({ children, allowedRoles = [] }) => {
  const loggedInUser = useSelector(selectLoggedInUser);

  // First check basic authentication
  if (!loggedInUser) {
    return <Navigate to="/login" replace={true} />;
  }

  if (!loggedInUser?.isVerified) {
    return <Navigate to="/verify-otp" replace={true} />;
  }

  // Check if user's role is in allowed roles
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
        <Button variant="contained" component={Link} to="/">
          Go to Home
        </Button>
      </Stack>
    );
  }

  return children;
};

/**
 * Agency admin specific protection
 */
export const AgencyAdminProtected = ({ children }) => {
  return (
    <RoleProtected allowedRoles={["AGENCY_ADMIN", "SUPER_ADMIN"]}>
      {children}
    </RoleProtected>
  );
};
export const AgentProtected = ({ children }) => {
  return (
    <RoleProtected allowedRoles={["AGENT"]}>
      {children}
    </RoleProtected>
  );
};

/**
 * Super admin only protection
 */
export const SuperAdminProtected = ({ children }) => {
  return (
    <RoleProtected allowedRoles={["SUPER_ADMIN"]}>{children}</RoleProtected>
  );
};
