// Sidebar.js
import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, Divider, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import ArticleIcon from '@mui/icons-material/Article';
import WorkIcon from '@mui/icons-material/Work';

const drawerWidth = 72;

// Left sidebar lists
const contracts = [
  { name: 'Proposed', to: '/propose', icon: <ArticleIcon /> },
  { name: 'Selected', to: '/selecte', icon: <ArticleIcon /> },
];

const manager_pages = [
  { name: 'Vessel Managers', to: '/vessel-managers', icon: <BusinessIcon /> },
  { name: 'Vessel Owners', to: '/vessel-owners', icon: <BusinessIcon /> },
  { name: 'Crew', to: '/crews', icon: <GroupsIcon /> },
  { name: 'Crew Agents', to: '/crewingAgents', icon: <PeopleIcon /> },
  { name: 'Ranks', to: '/rank', icon: <WorkIcon /> },
];

export const Sidebar = () => {
  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: '#f5f7f6',
          borderRight: '1px solid rgba(0,0,0,0.08)',
          top: '64px', // same as AppBar height
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <Divider />
      <List sx={{ pt: 1 }}>
        {manager_pages.map((p) => (
          <ListItemButton
            key={p.name}
            component={Link}
            to={p.to}
            sx={{ justifyContent: 'center', py: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
              {p.icon}
            </ListItemIcon>
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List sx={{ mt: 1 }}>
        {contracts.map((c) => (
          <ListItemButton
            key={c.name}
            component={Link}
            to={c.to}
            sx={{ justifyContent: 'center', py: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
              {c.icon}
            </ListItemIcon>
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
    </Drawer>
  );
};