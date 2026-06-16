import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectLoggedInUser,
  selectUserRole,
} from "../../auth/AuthSlice";

/** Agency / tenant mark at top of sidebar — same visual weight as BSM (no inner logo box). */
export function AgencyBox({ expanded = false }) {
  const loggedInUser = useSelector(selectLoggedInUser);
  const userRole = useSelector(selectUserRole);

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const shortLabel = isSuperAdmin
    ? "SA"
    : (
        loggedInUser?.agencyShortName ||
        loggedInUser?.agencyName ||
        "Agency"
      ).slice(0, 4).toUpperCase();

  const fullLabel = isSuperAdmin
    ? "Super Admin"
    : loggedInUser?.agencyShortName || loggedInUser?.agencyName || "Agency";

  return (
    <Tooltip title={fullLabel} placement="right">
      <Box
        component={Link}
        to={isSuperAdmin ? "/super-admin/agencies" : "/candidates"}
        sx={{
          height: 64,
          width: "100%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: expanded ? "flex-start" : "center",
          px: expanded ? 2 : 1,
          gap: 1,
          textDecoration: "none",
          bgcolor: "#000",
          color: "#fff",
          borderBottom: "1px solid",
          borderColor: "divider",
          "&:hover": { opacity: 0.92 },
        }}
      >
        <Typography
          variant="caption"
          noWrap
          sx={{
            fontWeight: 800,
            letterSpacing: "0.12em",
            fontSize: expanded ? "0.7rem" : "0.65rem",
            lineHeight: 1.1,
            textAlign: expanded ? "left" : "center",
          }}
        >
          {expanded ? fullLabel : shortLabel}
        </Typography>
      </Box>
    </Tooltip>
  );
}
