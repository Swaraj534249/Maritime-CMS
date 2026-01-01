import React from "react";
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
} from "@mui/material";
import { Link } from "react-router-dom";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import GroupsIcon from "@mui/icons-material/Groups";
import ArticleIcon from "@mui/icons-material/Article";
import WorkIcon from "@mui/icons-material/Work";

const drawerWidth = 72;

const contracts = [
  { name: "Proposed", to: "/propose", icon: <ArticleIcon /> },
  { name: "Selected", to: "/selecte", icon: <ArticleIcon /> },
];

const manager_pages = [
  {
    name: "Vessel Managers",
    to: "/vessel-managers",
    icon: <BusinessIcon />,
    title: "Vessel Managers",
  },
  {
    name: "Vessel Owners",
    to: "/vessel-owners",
    icon: <BusinessIcon />,
    title: "Vessel Owners",
  },
  { name: "Crew", to: "/crews", icon: <GroupsIcon />, title: "Crew" },
  {
    name: "Crew Agents",
    to: "/crewingAgents",
    icon: <PeopleIcon />,
    title: "Crew Agents",
  },
  { name: "Ranks", to: "/rank", icon: <WorkIcon />, title: "Ranks" },
];

export const SidebarStatic = () => {
  return (
    // This Box is a flex sibling — it occupies width and doesn't overlay content
    <Box
      component="nav"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        display: "block", // ensure visible (change to { xs: 'none', sm: 'block' } later for responsive)
      }}
      aria-label="sidebar"
    >
      <Box
        sx={{
          bgcolor: "#f5f7f6",
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "1px solid rgba(0,0,0,0.08)",
          mt: "64px", // start below AppBar
          height: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Divider />
        <List sx={{ pt: 1 }}>
          {manager_pages.map((p) => (
            <ListItemButton
              key={p.name}
              component={Link}
              to={p.to}
              sx={{ justifyContent: "center", py: 2, width: "100%" }}
              title={p.title}
            >
              <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}>
                {p.icon}
              </ListItemIcon>
            </ListItemButton>
          ))}
        </List>
        <Divider sx={{ width: "100%" }} />
        <List sx={{ mt: 1 }}>
          {contracts.map((c) => (
            <ListItemButton
              key={c.name}
              component={Link}
              to={c.to}
              sx={{ justifyContent: "center", py: 2, width: "100%" }}
            >
              <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}>
                {c.icon}
              </ListItemIcon>
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ flexGrow: 1 }} />
      </Box>
    </Box>
  );
};
