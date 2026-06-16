import { Typography, Box, Stack } from "@mui/material";
import { useLocation } from "react-router-dom";
import { getPageTitleFromPath } from "../pageTitles";
import { usePageTitleContext } from "../PageTitleContext";

/** Page title + toolbar actions on one row (above list tables). */
export function ListPageHeader({ title, subtitle, actions }) {
  const location = useLocation();
  const { pageTitle: dynamicTitle } = usePageTitleContext();
  const resolved =
    title || dynamicTitle || getPageTitleFromPath(location.pathname);

  if (!resolved && !actions) return null;

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={1.5}
      sx={{ px: 1, mb: 2 }}
    >
      {resolved ? (
        <Box sx={{ minWidth: 0, flexShrink: 0 }}>
          <Typography variant="h5" fontWeight={600} noWrap>
            {resolved}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      ) : (
        <Box />
      )}
      {actions ? (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          justifyContent="flex-end"
          sx={{ flex: 1, minWidth: 0 }}
        >
          {actions}
        </Stack>
      ) : null}
    </Stack>
  );
}
