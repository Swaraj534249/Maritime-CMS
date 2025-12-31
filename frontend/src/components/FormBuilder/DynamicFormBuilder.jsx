import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  TextField,
  Button,
  Grid,
  Stack,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormLabel,
  Autocomplete,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";

/**
 * Dynamic Form Builder Component with File Upload Support
 */
const DynamicFormBuilder = ({
  formId,
  fields = [],
  validationSchema,
  defaultValues = {},
  onSubmit,
  onCancel,
  isEditMode = false,
  submitButtonText,
  cancelButtonText = "Cancel",
  existingFiles = {}, // For edit mode: { company_logo: {...}, contract: {main, old}, license: {main, old} }
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: validationSchema ? yupResolver(validationSchema) : undefined,
    defaultValues,
  });

  // Local state for file uploads
  const [uploadedFiles, setUploadedFiles] = useState({});

  const handleFileChange = (fieldName, files, multiple = false) => {
    if (multiple) {
      const existingFiles = uploadedFiles[fieldName] || [];
      setUploadedFiles((prev) => ({
        ...prev,
        [fieldName]: [...existingFiles, ...Array.from(files)],
      }));
    } else {
      setUploadedFiles((prev) => ({
        ...prev,
        [fieldName]: files[0] || null,
      }));
    }
  };

  const removeFile = (fieldName, index = null) => {
    if (index !== null) {
      // Remove specific file from array
      setUploadedFiles((prev) => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((_, i) => i !== index),
      }));
    } else {
      // Remove single file
      setUploadedFiles((prev) => ({
        ...prev,
        [fieldName]: null,
      }));
    }
  };

  const handleFormSubmit = (data) => {
    onSubmit(data, uploadedFiles);
  };

  const renderFileUpload = (field) => {
    const { name, label, accept = "*", multiple = false, helperText } = field;
    const files = uploadedFiles[name];
    const existingFileData = existingFiles[name];

    return (
      <Box>
        <input
          accept={accept}
          style={{ display: "none" }}
          id={`file-upload-${name}`}
          type="file"
          multiple={multiple}
          onChange={(e) => handleFileChange(name, e.target.files, multiple)}
        />
        <label htmlFor={`file-upload-${name}`}>
          <Button
            variant="outlined"
            component="span"
            startIcon={
              accept.includes("image") ? <ImageIcon /> : <CloudUploadIcon />
            }
            fullWidth
            size="small"
          >
            {label}
          </Button>
        </label>

        {helperText && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 0.5 }}
          >
            {helperText}
          </Typography>
        )}

        {errors[name] && (
          <Typography
            variant="caption"
            color="error"
            display="block"
            sx={{ mt: 0.5 }}
          >
            {errors[name]?.message}
          </Typography>
        )}

        {/* Display newly selected files */}
        {files && (
          <Stack spacing={1} sx={{ mt: 1 }}>
            {(multiple ? files : [files]).map((file, idx) => (
              <Chip
                key={idx}
                icon={
                  accept.includes("image") ? (
                    <ImageIcon />
                  ) : (
                    <InsertDriveFileIcon />
                  )
                }
                label={`${file.name} (${(file.size / 1024).toFixed(2)} KB)`}
                onDelete={() => removeFile(name, multiple ? idx : null)}
                size="small"
                color="primary"
              />
            ))}
          </Stack>
        )}

        {/* Display existing files in edit mode */}
        {isEditMode && existingFileData && (
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Existing Files:
            </Typography>
            <Stack spacing={1} sx={{ mt: 0.5 }}>
              {/* Check if it's contract/license with main/old structure */}
              {existingFileData.main || existingFileData.old ? (
                <>
                  {/* Main file */}
                  {existingFileData.main?.filename && (
                    <Chip
                      icon={<InsertDriveFileIcon />}
                      label={`Main: ${
                        existingFileData.main.originalName ||
                        existingFileData.main.filename
                      }`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                  {/* Old file */}
                  {existingFileData.old?.filename && (
                    <Chip
                      icon={<InsertDriveFileIcon />}
                      label={`Old: ${
                        existingFileData.old.originalName ||
                        existingFileData.old.filename
                      }`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </>
              ) : (
                /* Regular file (like company_logo) */
                existingFileData.filename && (
                  <Chip
                    icon={
                      accept.includes("image") ? (
                        <ImageIcon />
                      ) : (
                        <InsertDriveFileIcon />
                      )
                    }
                    label={
                      existingFileData.originalName || existingFileData.filename
                    }
                    size="small"
                    variant="outlined"
                  />
                )
              )}
            </Stack>
          </Box>
        )}
      </Box>
    );
  };

  const renderField = (field) => {
    const {
      name,
      label,
      type = "text",
      gridSize = { xs: 12, sm: 6 },
      options = [],
      multiline = false,
      rows = 3,
      disabled = false,
      placeholder,
      helperText,
    } = field;

    // Handle file upload type
    if (type === "file") {
      return (
        <Grid item {...gridSize} key={name}>
          {renderFileUpload(field)}
        </Grid>
      );
    }

    const commonProps = {
      label,
      fullWidth: true,
      size: "small",
      error: !!errors[name],
      helperText: errors[name]?.message || helperText,
      disabled,
      placeholder,
    };

    return (
      <Grid item {...gridSize} key={name}>
        <Controller
          name={name}
          control={control}
          render={({ field: controllerField }) => {
            switch (type) {
              case "select":
                return (
                  <TextField {...controllerField} {...commonProps} select>
                    {options.map((option) => (
                      <MenuItem
                        key={typeof option === "object" ? option.value : option}
                        value={
                          typeof option === "object" ? option.value : option
                        }
                      >
                        {typeof option === "object" ? option.label : option}
                      </MenuItem>
                    ))}
                  </TextField>
                );

              case "checkbox":
                return (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...controllerField}
                        checked={controllerField.value || false}
                        disabled={disabled}
                      />
                    }
                    label={label}
                  />
                );

              case "radio":
                return (
                  <>
                    <FormLabel component="legend">{label}</FormLabel>
                    <RadioGroup {...controllerField}>
                      {options.map((option) => (
                        <FormControlLabel
                          key={
                            typeof option === "object" ? option.value : option
                          }
                          value={
                            typeof option === "object" ? option.value : option
                          }
                          control={<Radio />}
                          label={
                            typeof option === "object" ? option.label : option
                          }
                          disabled={disabled}
                        />
                      ))}
                    </RadioGroup>
                  </>
                );

              case "autocomplete":
                return (
                  <Autocomplete
                    {...controllerField}
                    options={options}
                    getOptionLabel={(option) =>
                      typeof option === "object" ? option.label : option
                    }
                    onChange={(_, data) => controllerField.onChange(data)}
                    renderInput={(params) => (
                      <TextField {...params} {...commonProps} />
                    )}
                    disabled={disabled}
                  />
                );

              case "textarea":
                return (
                  <TextField
                    {...controllerField}
                    {...commonProps}
                    multiline
                    rows={rows}
                  />
                );

              default:
                return (
                  <TextField
                    {...controllerField}
                    {...commonProps}
                    type={type}
                    multiline={multiline}
                    rows={multiline ? rows : undefined}
                  />
                );
            }
          }}
        />
      </Grid>
    );
  };

  return (
    <form id={formId} onSubmit={handleSubmit(handleFormSubmit)}>
      <Grid container spacing={2.5}>
        {fields.map((field) => renderField(field))}

        {/* <Grid item xs={12}>
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelButtonText}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : submitButtonText || (isEditMode ? 'Update' : 'Create')}
            </Button>
          </Stack>
        </Grid> */}
      </Grid>
    </form>
  );
};

export default DynamicFormBuilder;
