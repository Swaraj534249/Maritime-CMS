import React from "react";
import { Box, Stack, Typography, Divider } from "@mui/material";
import DocumentSection from "../../../components/Documents/DocumentSection";
import { formatStatusLabel } from "../feedbackFiles";

function formatWhen(value) {
  if (!value) return "—";
  const d = new Date(value);
  return `${d.toISOString().slice(0, 10)} • ${d.toTimeString().slice(0, 5)}`;
}

/** Ticket thread — status updates with notes and files. */
export function FeedbackThreadView({ feedback }) {
  if (!feedback) return null;

  return (
    <Stack spacing={2} divider={<Divider flexItem />}>
      {(feedback.updates || []).map((update, idx) => {
        const fileSections = (update.attachments || []).map((file, i) => ({
          key: `${idx}-${i}`,
          title: "Attachment",
          icon: null,
          documents: {
            main: {
              ...file,
              path: file.path || file.key,
              uploadedAt: file.uploadedAt || update.createdAt,
            },
          },
        }));

        return (
          <Box key={update._id || idx}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="subtitle2">
                {formatStatusLabel(update.status)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatWhen(update.createdAt)}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              {update.createdBy?.name} ({update.createdBy?.email})
            </Typography>
            {update.note ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
                {update.note}
              </Typography>
            ) : null}
            {fileSections.map((section) => (
              <DocumentSection key={section.key} {...section} />
            ))}
          </Box>
        );
      })}
    </Stack>
  );
}
