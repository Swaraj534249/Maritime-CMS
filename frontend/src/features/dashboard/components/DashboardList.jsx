import { Stack } from "@mui/material";
import { useEffect } from "react";

export const DashboardList = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <Stack>Dashboard</Stack>
  );
};
