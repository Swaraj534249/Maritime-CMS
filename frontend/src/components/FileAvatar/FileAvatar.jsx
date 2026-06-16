import { Avatar } from "@mui/material";
import { useFileDisplayUrl } from "../../hooks/useFileDisplayUrl";

/**
 * Avatar for S3/local files. Uses presigned URL from API when present; lazy-loads image.
 */
export default function FileAvatar({ file, label, sx, variant = "rounded" }) {
  const src = useFileDisplayUrl(file);
  const initials = (label || "?").charAt(0).toUpperCase();

  if (src) {
    return (
      <Avatar
        src={src}
        alt={label}
        sx={sx}
        variant={variant}
        imgProps={{ loading: "lazy", decoding: "async" }}
      />
    );
  }

  return (
    <Avatar sx={{ ...sx, bgcolor: "primary.main" }} variant={variant}>
      {initials}
    </Avatar>
  );
}
