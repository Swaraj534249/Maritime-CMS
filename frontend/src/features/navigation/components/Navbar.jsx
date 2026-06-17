import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import { Link } from "react-router-dom";
import {
  Stack,
  ListItemIcon,
  ListItemText,
  Button,
  Box,
} from "@mui/material";
import { useSelector } from "react-redux";
import {
  selectLoggedInUser,
  selectUserRole,
} from "../../auth/AuthSlice";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import WorkIcon from "@mui/icons-material/Work";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";
import { FeedbackForm } from "../../feedback/components/FeedbackForm";

export const Navbar = ({ sidebarWidth, onMenuToggle }) => {
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const navigate = useNavigate();
  const loggedInUser = useSelector(selectLoggedInUser);
  const userRole = useSelector(selectUserRole);
  const canSubmitFeedback =
    userRole === "AGENCY_ADMIN" || userRole === "AGENT";
  const canManageAssets =
    userRole === "AGENCY_ADMIN" || userRole === "AGENT";

  const showOurFeedbacks =
    userRole === "AGENCY_ADMIN" || userRole === "AGENT";

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const settings = [
    {
      name: "Profile",
      to: "/profile",
      icon: <PersonOutlineIcon fontSize="small" />,
    },
    ...(showOurFeedbacks
      ? [
          {
            name: "Our Feedbacks",
            to: "/feedbacks",
            icon: <FeedbackOutlinedIcon fontSize="small" />,
          },
        ]
      : []),
    { name: "Logout", to: "/logout", icon: <WorkIcon fontSize="small" /> },
  ];

  const avatarLabel = loggedInUser?.name
    ? loggedInUser.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
    : "U";

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          left: sidebarWidth,
          width: `calc(100% - ${sidebarWidth}px)`,
          bgcolor: "#fff",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: 64, px: 2, position: "relative" }}>
          <Box sx={{ display: "flex", alignItems: "center", minWidth: 0, zIndex: 1 }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="toggle sidebar"
              onClick={onMenuToggle}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Stack direction="row" spacing={1} alignItems="center" sx={{ zIndex: 1 }}>
            {canManageAssets && (
              <Tooltip title="Manage ranks & vessel types">
                <Button
                  color="inherit"
                  startIcon={<CategoryOutlinedIcon />}
                  onClick={() => navigate("/assets")}
                  sx={{ textTransform: "none" }}
                >
                  Assets
                </Button>
              </Tooltip>
            )}

            {canManageAssets && (
              <Tooltip title="Help">
                <Button
                  color="inherit"
                  startIcon={<HelpOutlineIcon />}
                  onClick={() => navigate("/help")}
                  sx={{ textTransform: "none" }}
                >
                  Help
                </Button>
              </Tooltip>
            )}

            {canSubmitFeedback && (
              <Tooltip title="Submit feedback">
                <Button
                  color="inherit"
                  startIcon={<RateReviewOutlinedIcon />}
                  onClick={() => setFeedbackOpen(true)}
                  sx={{ textTransform: "none" }}
                >
                  Feedback
                </Button>
              </Tooltip>
            )}

            <Tooltip title="Account">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  alt={loggedInUser?.name}
                  sx={{ bgcolor: "#1976d2", width: 36, height: 36 }}
                >
                  {avatarLabel}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              anchorEl={anchorElUser}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((s) => (
                <MenuItem
                  key={s.name}
                  onClick={handleCloseUserMenu}
                  component={Link}
                  to={s.to}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>{s.icon}</ListItemIcon>
                  <ListItemText>{s.name}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      {canSubmitFeedback && (
        <FeedbackForm
          open={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
        />
      )}
    </>
  );
};
