import {
  Box,
  Stack,
  Typography,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { getFileIcon, formatFileSize } from "../../utils/fileUtils";
import { useDocumentActions } from "../../hooks/useDocumentActions";
import { normalizeDocSection, hasStoredFile } from "../../utils/documentSections";

const FileItem = ({ file, label, borderColor, bgColor }) => {
  const { openDocument } = useDocumentActions();

  if (!hasStoredFile(file)) return null;

  return (
    <ListItemButton
      onClick={() => openDocument(file)}
      sx={{
        border: `1px solid ${borderColor}`,
        borderRadius: 1,
        mb: 1,
        backgroundColor: bgColor,
        "&:hover": { backgroundColor: "action.hover" },
      }}
    >
      <ListItemIcon>{getFileIcon(file)}</ListItemIcon>

      <ListItemText
        primary={
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            {label ? (
              <Chip
                label={label}
                size="small"
                color={label === "Main" ? "success" : "default"}
                sx={{ height: 22 }}
              />
            ) : null}
            <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
              {file.originalName || file.filename}
            </Typography>
          </Stack>
        }
        secondary={`${formatFileSize(file.size)} • ${new Date(
          file.uploadedAt,
        ).toLocaleDateString()}`}
      />

      <Tooltip title="Open in new tab">
        <IconButton edge="end" size="small">
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </ListItemButton>
  );
};

const DocumentSection = ({ title, icon, documents }) => {
  const normalized = normalizeDocSection(documents);
  if (!normalized) return null;

  const showMain = hasStoredFile(normalized.main);
  const showOld = hasStoredFile(normalized.old);

  if (!showMain && !showOld) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        {icon}
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
      </Stack>

      {showMain && (
        <FileItem
          file={normalized.main}
          label="Main"
          borderColor="#4caf50"
          bgColor="#f1f8f4"
        />
      )}

      {showOld && (
        <FileItem
          file={normalized.old}
          label="Old"
          borderColor="#e0e0e0"
          bgColor="transparent"
        />
      )}
    </Box>
  );
};

export default DocumentSection;
