import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  Button,
  TextField,
  Stack,
  Chip,
  Typography,
} from "@mui/material";
import * as yup from "yup";
import { createAgencyAsync, updateAgencyByIdAsync } from "../AgencySlice";
import DynamicFormBuilder from "../../../components/FormBuilder/DynamicFormBuilder";
import { toast } from "react-toastify";

// Validation Schema
const agencySchema = yup.object({
  name: yup.string().required("Agency name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  contactPerson: yup.string().required("Contact person is required"),
  phone: yup.string().required("Phone is required"),
  address: yup.string(),
  maxAgents: yup
    .number()
    .positive("Must be positive")
    .integer("Must be an integer")
    .required("Max agents is required"),
  subscriptionPlan: yup.string(),
  licenseNumber: yup.string(),
  adminName: yup.string().required("Admin name is required"),
  adminEmail: yup
    .string()
    .email("Invalid email")
    .required("Admin email is required"),
  adminPassword: yup.string().when("$isEditMode", {
    is: false,
    then: (schema) =>
      schema
        .required("Password is required")
        .min(6, "Password must be at least 6 characters"),
    otherwise: (schema) => schema.notRequired(),
  }),
  adminUserType: yup.string(),
});

// Field Configuration
const getAgencyFields = (isEditMode) => [
  // Agency Details
  {
    name: "name",
    label: "Agency Name",
    type: "text",
    gridSize: { xs: 12 },
  },
  {
    name: "email",
    label: "Agency Email",
    type: "email",
    gridSize: { xs: 12 },
    disabled: isEditMode,
  },
  {
    name: "contactPerson",
    label: "Contact Person",
    type: "text",
    gridSize: { xs: 12 },
  },
  {
    name: "phone",
    label: "Phone",
    type: "text",
    gridSize: { xs: 12 },
  },
  {
    name: "address",
    label: "Address",
    type: "textarea",
    rows: 2,
    gridSize: { xs: 12 },
  },
  {
    name: "maxAgents",
    label: "Max Agents",
    type: "number",
    gridSize: { xs: 12 },
  },
  {
    name: "subscriptionPlan",
    label: "Subscription Plan",
    type: "select",
    gridSize: { xs: 12 },
    options: [
      { value: "basic", label: "Basic" },
      { value: "professional", label: "Professional" },
      { value: "enterprise", label: "Enterprise" },
    ],
  },
  {
    name: "licenseNumber",
    label: "License Number",
    type: "text",
    gridSize: { xs: 12 },
  },
  // Admin Details
  {
    name: "adminName",
    label: "Admin Name",
    type: "text",
    gridSize: { xs: 12 },
  },
  {
    name: "adminEmail",
    label: "Admin Email",
    type: "email",
    gridSize: { xs: 12 },
    disabled: isEditMode,
  },
  ...(isEditMode
    ? [
        {
          name: "adminPassword",
          label: "New Password (leave blank to keep current)",
          type: "password",
          gridSize: { xs: 12 },
          helperText: "Minimum 6 characters",
        },
      ]
    : [
        {
          name: "adminPassword",
          label: "Admin Password",
          type: "password",
          gridSize: { xs: 12 },
          helperText: "Minimum 6 characters",
        },
      ]),
  {
    name: "adminUserType",
    label: "Admin User Type",
    type: "select",
    gridSize: { xs: 12 },
    options: [
      { value: "", label: "None" },
      { value: "Crew", label: "Crew" },
      { value: "Crewing Agent", label: "Crewing Agent" },
      { value: "Vessel Owner", label: "Vessel Owner" },
      { value: "Vessel Manager", label: "Vessel Manager" },
    ],
  },
];

const AgencyForm = ({ formId, initialData = null, onClose }) => {
  const dispatch = useDispatch();
  const isEditMode = Boolean(initialData);
  const [domainInput, setDomainInput] = useState("");
  const [allowedDomains, setAllowedDomains] = useState(
    initialData?.allowedDomains || []
  );

  const defaultValues = {
    name: initialData?.name || "",
    email: initialData?.email || "",
    contactPerson: initialData?.contactPerson || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    maxAgents: initialData?.maxAgents || 10,
    subscriptionPlan: initialData?.subscriptionPlan || "enterprise",
    licenseNumber: initialData?.licenseNumber || "",
    adminName: initialData?.admin?.name || "",
    adminEmail: initialData?.admin?.email || "",
    adminPassword: "",
    adminUserType: initialData?.admin?.userType || "",
  };

  const handleAddDomain = () => {
    if (domainInput.trim()) {
      if (!allowedDomains.includes(domainInput.trim())) {
        setAllowedDomains([...allowedDomains, domainInput.trim()]);
        setDomainInput("");
      }
    }
  };

  const handleRemoveDomain = (domainToRemove) => {
    setAllowedDomains(allowedDomains.filter((d) => d !== domainToRemove));
  };

  const handleFormSubmit = async (formData) => {
    // Check if at least one domain is added
    if (allowedDomains.length === 0) {
      toast.error("At least one domain is required");
      return;
    }

    try {
      const agencyData = {
        name: formData.name,
        email: formData.email,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        address: formData.address,
        allowedDomains: allowedDomains,
        maxAgents: formData.maxAgents,
        subscriptionPlan: formData.subscriptionPlan,
        licenseNumber: formData.licenseNumber,
      };

      const adminData = {
        name: formData.adminName,
        email: formData.adminEmail,
        password: formData.adminPassword,
        userType: formData.adminUserType,
      };

      // Remove password field if in edit mode and it's empty
      if (isEditMode && !adminData.password) {
        delete adminData.password;
      }

      if (isEditMode) {
        await dispatch(
          updateAgencyByIdAsync({
            id: initialData._id,
            data: {
              agency: agencyData,
              admin: {
                _id: initialData.admin._id,
                ...adminData,
              },
            },
          })
        ).unwrap();
        toast.success("Agency updated successfully");
      } else {
        await dispatch(
          createAgencyAsync({
            agency: agencyData,
            admin: adminData,
          })
        ).unwrap();
        toast.success("Agency created successfully");
      }
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(error?.message || "Failed to save agency");
    }
  };

  return (
    <Box>
      {/* Allowed Domains Section */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="body2" gutterBottom fontWeight={500}>
          Allowed Domains *
        </Typography>
        <Stack direction="row" spacing={1} mb={1}>
          <TextField
            size="small"
            placeholder="e.g., example.com"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddDomain();
              }
            }}
            fullWidth
          />
          <Button onClick={handleAddDomain} variant="outlined" size="small">
            Add
          </Button>
        </Stack>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
          {allowedDomains.map((domain) => (
            <Chip
              key={domain}
              label={domain}
              onDelete={() => handleRemoveDomain(domain)}
              size="small"
            />
          ))}
        </Stack>
        {allowedDomains.length === 0 && (
          <Typography variant="caption" color="error" display="block" mt={0.5}>
            At least one domain is required
          </Typography>
        )}
      </Box>

      <DynamicFormBuilder
        formId={formId}
        fields={getAgencyFields(isEditMode)}
        validationSchema={agencySchema}
        defaultValues={defaultValues}
        onSubmit={handleFormSubmit}
        onCancel={onClose}
        isEditMode={isEditMode}
        context={{ isEditMode }}
      />
    </Box>
  );
};

export default AgencyForm;