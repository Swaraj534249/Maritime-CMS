import React from "react";
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import { selectUserRole } from "../../auth/AuthSlice";

export const SidebarStatic = ({ expanded = false }) => {
  const userRole = useSelector(selectUserRole);
  const location = useLocation();

  const dashboardItem = {
    name: "Dashboard",
    to: "/dashboard",
    icon: <DashboardIcon />,
  };

  const getMenuItems = () => {
    const baseItems = {
      SUPER_ADMIN: [
        dashboardItem,
        {
          name: "Agencies",
          to: "/super-admin/agencies",
          icon: <AdminPanelSettingsIcon />,
        },
        {
          name: "Feedbacks",
          to: "/super-admin/feedbacks",
          icon: <FeedbackOutlinedIcon />,
        },
      ],
      AGENCY_ADMIN: [
        dashboardItem,
        { name: "Agents", to: "/agency/agents", icon: <PeopleIcon /> },
        { name: "Candidates", to: "/candidates", icon: <PersonIcon /> },
        { name: "Vessel Owners", to: "/vessel-owners", icon: <BusinessIcon /> },
        {
          name: "Vacancies",
          to: "/vacancies",
          icon: <WorkOutlineIcon />,
          dividerAbove: true,
        },
        { name: "Proposed", to: "/proposed", icon: <HowToRegOutlinedIcon /> },
      ],
      AGENT: [
        dashboardItem,
        { name: "Candidates", to: "/candidates", icon: <PersonIcon /> },
        { name: "Vessel Owners", to: "/vessel-owners", icon: <BusinessIcon /> },
        {
          name: "Vacancies",
          to: "/vacancies",
          icon: <WorkOutlineIcon />,
          dividerAbove: true,
        },
        { name: "Proposed", to: "/proposed", icon: <HowToRegOutlinedIcon /> },
      ],
    };
    return baseItems[userRole] || [dashboardItem];
  };

  const menuItems = getMenuItems();
  const isActive = (path) => location.pathname === path;

  const renderItem = (item) => {
    const button = (
      <ListItemButton
        component={Link}
        to={item.to}
        sx={{
          justifyContent: expanded ? "flex-start" : "center",
          py: 1.5,
          px: expanded ? 2 : 1,
          bgcolor: isActive(item.to)
            ? "rgba(25, 118, 210, 0.08)"
            : "transparent",
          borderLeft: isActive(item.to)
            ? "3px solid #1976d2"
            : "3px solid transparent",
          "&:hover": { bgcolor: "rgba(25, 118, 210, 0.04)" },
        }}
        title={!expanded ? item.name : undefined}
      >
        <ListItemIcon
          sx={{
            minWidth: expanded ? 40 : 0,
            justifyContent: "center",
            color: isActive(item.to) ? "primary.main" : "inherit",
          }}
        >
          {item.icon}
        </ListItemIcon>
        {expanded && (
          <ListItemText
            primary={item.name}
            primaryTypographyProps={{ variant: "body2", noWrap: true }}
          />
        )}
      </ListItemButton>
    );

    if (item.dividerAbove) {
      return (
        <React.Fragment key={item.name}>
          <Divider sx={{ my: 1 }} />
          {button}
        </React.Fragment>
      );
    }

    return <React.Fragment key={item.name}>{button}</React.Fragment>;
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        overflowX: "hidden",
        width: "100%",
      }}
    >
      <Divider />
      <List sx={{ pt: 1, width: "100%" }}>
        {menuItems.map(renderItem)}
      </List>

      <Box sx={{ flexGrow: 1 }} />
    </Box>
  );
};
