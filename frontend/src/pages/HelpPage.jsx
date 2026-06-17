import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { HELP_GUIDES } from "../features/help/helpGuides";

function StepList({ steps }) {
  return (
    <Stack spacing={1.25} sx={{ my: 1 }}>
      {steps.map((s, i) => (
        <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              flexShrink: 0,
              width: 24,
              height: 24,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {i + 1}
          </Box>
          <Typography variant="body2" sx={{ pt: 0.25 }}>
            {s}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function TipList({ tips }) {
  return (
    <Stack spacing={0.75} sx={{ my: 1 }}>
      {tips.map((t, i) => (
        <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
          <CheckCircleOutlineIcon
            color="success"
            fontSize="small"
            sx={{ mt: 0.2 }}
          />
          <Typography variant="body2" color="text.secondary">
            {t}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function GuideContent({ guide }) {
  if (!guide.ready || !guide.sections?.length) {
    return (
      <Stack
        alignItems="center"
        spacing={1}
        sx={{ py: 8, textAlign: "center", color: "text.secondary" }}
      >
        <MenuBookOutlinedIcon sx={{ fontSize: 48, opacity: 0.4 }} />
        <Typography variant="subtitle1" fontWeight={600}>
          Guide coming soon
        </Typography>
        <Typography variant="body2">
          The {guide.title} guide will be available here shortly.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3.5}>
      {guide.sections.map((section) => (
        <Box key={section.id}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {section.heading}
          </Typography>
          {section.body && (
            <Typography variant="body2" color="text.secondary">
              {section.body}
            </Typography>
          )}
          {section.steps?.length > 0 && <StepList steps={section.steps} />}
          {section.tips?.length > 0 && <TipList tips={section.tips} />}
          {section.note && (
            <Alert severity="info" sx={{ mt: 1 }}>
              {section.note}
            </Alert>
          )}
        </Box>
      ))}
    </Stack>
  );
}

export const HelpPage = () => {
  const [search, setSearch] = useState("");
  const [activeKey, setActiveKey] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return HELP_GUIDES;
    return HELP_GUIDES.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q),
    );
  }, [search]);

  const activeGuide = HELP_GUIDES.find((g) => g.key === activeKey) || null;

  // ---- Guide reading view (two-pane) ----
  if (activeGuide) {
    return (
      <Box sx={{ width: "100%", pb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => setActiveKey(null)}
          sx={{ textTransform: "none", mb: 2 }}
        >
          All guides
        </Button>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "240px 1fr" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <List
            dense
            sx={{
              position: { md: "sticky" },
              top: { md: 16 },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 1,
            }}
          >
            {HELP_GUIDES.map((g) => {
              const Icon = g.icon;
              const selected = g.key === activeKey;
              return (
                <ListItemButton
                  key={g.key}
                  selected={selected}
                  onClick={() => setActiveKey(g.key)}
                  sx={{ borderRadius: 1.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 34 }}>
                    <Icon
                      fontSize="small"
                      color={selected ? "primary" : "inherit"}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={g.title}
                    primaryTypographyProps={{
                      variant: "body2",
                      fontWeight: selected ? 700 : 500,
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>

          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "primary.50",
                  color: "primary.main",
                  border: "1px solid",
                  borderColor: "primary.100",
                }}
              >
                <activeGuide.icon />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {activeGuide.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeGuide.description}
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <GuideContent guide={activeGuide} />
          </Box>
        </Box>
      </Box>
    );
  }

  // ---- Landing: cards grid ----
  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Help &amp; Guides
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Step-by-step guides for each section. Click a card to open its
            guide.
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search guides..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: "100%", sm: 280 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Box
        sx={{
          mt: 2,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        {filtered.map((g) => {
          const Icon = g.icon;
          return (
            <Card key={g.key} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardActionArea
                onClick={() => setActiveKey(g.key)}
                sx={{ p: 2, height: "100%", alignItems: "flex-start" }}
              >
                <Stack spacing={1.25}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "primary.50",
                      color: "primary.main",
                      border: "1px solid",
                      borderColor: "primary.100",
                    }}
                  >
                    <Icon />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {g.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {g.description}
                  </Typography>
                  <Chip
                    size="small"
                    label={g.ready ? "Guide" : "Coming soon"}
                    color={g.ready ? "primary" : "default"}
                    variant="outlined"
                    sx={{ width: "fit-content" }}
                  />
                </Stack>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default HelpPage;
