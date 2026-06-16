import React from "react";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";

export function BrandBox() {
  return (
    <Box
      component={Link}
      to="/"
      sx={{
        height: 64,
        width: "100%",
        flexShrink: 0,
        bgcolor: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
        flexShrink: 0,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          letterSpacing: "0.12em",
          fontSize: "0.7rem",
          lineHeight: 1.1,
          textAlign: "center",
        }}
      >
        BSM
      </Typography>
    </Box>
  );
}
