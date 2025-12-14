import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { Link } from 'react-router-dom';
import { Button, Stack, ListItemIcon, ListItemText, useTheme, useMediaQuery } from '@mui/material';
import { useSelector } from 'react-redux';
import { selectUserInfo } from '../../user/UserSlice';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import HomeIcon from '@mui/icons-material/Home';
import ArticleIcon from '@mui/icons-material/Article';
import WorkIcon from '@mui/icons-material/Work';
import { Sidebar } from './Sidebar';

export const Navbar = ({ isProductList = false }) => {
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const userInfo = useSelector(selectUserInfo);
  const loggedInUser = useSelector(selectLoggedInUser);
  const theme = useTheme();
  const is480 = useMediaQuery(theme.breakpoints.down(480));

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const settings = [
    { name: 'Home', to: '/', icon: <HomeIcon fontSize="small" /> },
    { name: 'Profile', to: loggedInUser?.isAdmin ? '/admin/profile' : '/profile', icon: <HomeIcon fontSize="small" /> },
    {
      name: loggedInUser?.isAdmin ? 'Orders' : 'My orders',
      to: loggedInUser?.isAdmin ? '/admin/orders' : '/orders',
      icon: <ArticleIcon fontSize="small" />,
    },
    { name: 'Logout', to: '/logout', icon: <WorkIcon fontSize="small" /> },
  ];

  const avatarLabel = userInfo?.name
    ? userInfo.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
    : 'SD';

  return (
    // AppBar only — layout (sidebar + main) will be composed at a higher level
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: 'black',
        color: 'white',
        boxShadow: 'none',
        zIndex: (theme) => theme.zIndex.drawer + 1, // keep above sidebar
      }}
    >
      <Toolbar sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          noWrap
          component={Link}
          to="/"
          sx={{
            mr: 2,
            fontWeight: 700,
            letterSpacing: '.3rem',
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          BSM
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          {loggedInUser?.isAdmin && (
            <Button
              variant="contained"
              color="inherit"
              sx={{
                bgcolor: 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              Admin
            </Button>
          )}
          <Tooltip title="Open Settings">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar alt={userInfo?.name} sx={{ bgcolor: '#1976d2' }}>
                {avatarLabel}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            sx={{ mt: '45px' }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            {settings.map((s) => (
              <MenuItem key={s.name} onClick={handleCloseUserMenu} component={Link} to={s.to}>
                <ListItemIcon sx={{ minWidth: 32 }}>{s.icon}</ListItemIcon>
                <ListItemText>{s.name}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
