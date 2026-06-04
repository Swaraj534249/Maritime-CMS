import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import { Navbar } from "../features/navigation/components/Navbar";
import { SidebarStatic } from "../features/navigation/components/SidebarStatic";
import { BrandBox } from "../features/navigation/components/BrandBox";
import { AgencyBox } from "../features/navigation/components/AgencyBox";
import { PageTitleProvider } from "../features/navigation/PageTitleContext";

const NAVBAR_HEIGHT = 64;
const SIDEBAR_COLLAPSED = 72;
const SIDEBAR_EXPANDED = 240;

export const RootLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarWidth = sidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  return (
    <PageTitleProvider>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Box
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: (theme) => theme.zIndex.drawer,
            display: "flex",
            flexDirection: "column",
            bgcolor: "#f5f7f6",
            borderRight: "1px solid rgba(0,0,0,0.08)",
            transition: "width 0.2s ease",
          }}
        >
          <AgencyBox expanded={sidebarOpen} />
          <SidebarStatic expanded={sidebarOpen} />
          <BrandBox />
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            ml: `${sidebarWidth}px`,
            transition: "margin-left 0.2s ease",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <Navbar
            sidebarWidth={sidebarWidth}
            onMenuToggle={() => setSidebarOpen((o) => !o)}
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 2,
              pt: `${NAVBAR_HEIGHT + 16}px`,
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </PageTitleProvider>
  );
};
