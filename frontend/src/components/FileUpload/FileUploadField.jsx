import { useState } from "react";
import { getFileSizeError, formatFileSize } from "../../utils/fileUtils";
import { toast } from "react-toastify";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";

/**
 * File picker matching DynamicFormBuilder upload UI.
 */
export default function FileUploadField({
  label = "Add attachment (optional)",
  accept = "*",
  multiple = true,
  helperText,
  disabled = false,
  value = [],
  onChange,
}) {
  const files = Array.isArray(value) ? value : value ? [value] : [];
  const [inputKey, setInputKey] = useState(0);

  const handleChange = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    const accepted = [];
    for (const file of picked) {
      const sizeError = getFileSizeError(file);
      if (sizeError) {
        toast.error(sizeError);
        continue;
      }
      accepted.push(file);
    }
    if (!accepted.length) return;

    if (multiple) {
      onChange([...files, ...accepted]);
    } else {
      onChange([accepted[0]]);
    }
    setInputKey((k) => k + 1);
  };

  const removeAt = (idx) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  const isImageAccept = accept.includes("image");

  return (
    <Box>
      <input
        key={`file-upload-${inputKey}`}
        accept={accept}
        style={{ display: "none" }}
        id="file-upload-field-input"
        type="file"
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
      />
      <label htmlFor="file-upload-field-input">
        <Button
          variant="outlined"
          component="span"
          startIcon={isImageAccept ? <ImageIcon /> : <CloudUploadIcon />}
          fullWidth
          size="small"
          disabled={disabled}
        >
          {label}
        </Button>
      </label>
      {helperText && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {helperText}
        </Typography>
      )}
      {files.length > 0 && (
        <Stack spacing={1} sx={{ mt: 1 }}>
          {files.map((file, idx) => (
            <Chip
              key={`${file.name}-${idx}`}
              icon={isImageAccept ? <ImageIcon /> : <InsertDriveFileIcon />}
              label={`${file.name} (${formatFileSize(file.size)})`}
              onDelete={disabled ? undefined : () => removeAt(idx)}
              size="small"
              color="primary"
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
