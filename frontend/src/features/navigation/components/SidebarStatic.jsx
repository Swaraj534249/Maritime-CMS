import React from "react";
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import GroupsIcon from "@mui/icons-material/Groups";
import ArticleIcon from "@mui/icons-material/Article";
import WorkIcon from "@mui/icons-material/Work";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { selectUserRole } from "../../auth/AuthSlice";

const drawerWidth = 72;

export const SidebarStatic = () => {
  const userRole = useSelector(selectUserRole);
  const location = useLocation();

  // Define menu items based on roles
  const getMenuItems = () => {
    const baseItems = {
      SUPER_ADMIN: [
        {
          name: "Agencies",
          to: "/super-admin/agencies",
          icon: <AdminPanelSettingsIcon />,
          title: "Agency Management",
        },
      ],
      AGENCY_ADMIN: [
        {
          name: "Agents",
          to: "/agency/agents",
          icon: <PeopleIcon />,
          title: "Agent Management",
        },
        {
          name: "Vessel Owners",
          to: "/vessel-owners",
          icon: <BusinessIcon />,
          title: "Vessel Owners",
        },
        {
          name: "Crew Agents",
          to: "/crewing-agents",
          icon: <GroupsIcon />,
          title: "Crewing Agents",
        },
      ],
      AGENT: [
        {
          name: "Vessel Owners",
          to: "/vessel-owners",
          icon: <BusinessIcon />,
          title: "Vessel Owners",
        },
        {
          name: "Crew Agents",
          to: "/crewing-agents",
          icon: <GroupsIcon />,
          title: "Crewing Agents",
        },
      ],
    };

    return baseItems[userRole] || [];
  };

  // Common contract items (if needed for all roles)
  const contracts = [
    { name: "Proposed", to: "/propose", icon: <ArticleIcon />, title: "Proposed Contracts" },
    { name: "Selected", to: "/selecte", icon: <ArticleIcon />, title: "Selected Contracts" },
  ];

  const menuItems = getMenuItems();

  const isActive = (path) => location.pathname === path;

  return (
    <Box
      component="nav"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        display: "block",
      }}
      aria-label="sidebar"
    >
      <Box
        sx={{
          bgcolor: "#f5f7f6",
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "1px solid rgba(0,0,0,0.08)",
          position: "fixed",
          top: "64px",
          left: 0,
          height: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        <Divider sx={{ width: "100%" }} />
        
        {/* Main Menu Items */}
        <List sx={{ pt: 1, width: "100%" }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.name}
              component={Link}
              to={item.to}
              sx={{
                justifyContent: "center",
                py: 2,
                width: "100%",
                bgcolor: isActive(item.to) ? "rgba(25, 118, 210, 0.08)" : "transparent",
                borderLeft: isActive(item.to) ? "3px solid #1976d2" : "3px solid transparent",
                "&:hover": {
                  bgcolor: "rgba(25, 118, 210, 0.04)",
                },
              }}
              title={item.title}
            >
              <ListItemIcon 
                sx={{ 
                  minWidth: 0, 
                  justifyContent: "center",
                  color: isActive(item.to) ? "primary.main" : "inherit",
                }}
              >
                {item.icon}
              </ListItemIcon>
            </ListItemButton>
          ))}
        </List>

        {/* Contract Items - Show for AGENT and AGENCY_ADMIN */}
        {(userRole === "AGENT" || userRole === "AGENCY_ADMIN") && (
          <>
            <Divider sx={{ width: "100%" }} />
            <List sx={{ mt: 1, width: "100%" }}>
              {contracts.map((c) => (
                <ListItemButton
                  key={c.name}
                  component={Link}
                  to={c.to}
                  sx={{
                    justifyContent: "center",
                    py: 2,
                    width: "100%",
                    bgcolor: isActive(c.to) ? "rgba(25, 118, 210, 0.08)" : "transparent",
                    borderLeft: isActive(c.to) ? "3px solid #1976d2" : "3px solid transparent",
                    "&:hover": {
                      bgcolor: "rgba(25, 118, 210, 0.04)",
                    },
                  }}
                  title={c.title}
                >
                  <ListItemIcon 
                    sx={{ 
                      minWidth: 0, 
                      justifyContent: "center",
                      color: isActive(c.to) ? "primary.main" : "inherit",
                    }}
                  >
                    {c.icon}
                  </ListItemIcon>
                </ListItemButton>
              ))}
            </List>
          </>
        )}

        <Box sx={{ flexGrow: 1 }} />
      </Box>
    </Box>
  );
};