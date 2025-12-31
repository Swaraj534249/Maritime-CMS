import React from "react";
import { Outlet } from "react-router-dom";
import { Box, Toolbar } from "@mui/material";
import { Navbar } from "../features/navigation/components/Navbar";
import { SidebarStatic } from "../features/navigation/components/SidebarStatic";

export const RootLayout = () => {
  return (
    <Box sx={{ display: "flex" }}>
      <Navbar />
      <SidebarStatic />
      <Box component="main" sx={{ flexGrow: 1, p: 2 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};
