import React from "react";
import { useDispatch } from "react-redux";
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
  industryType: yup.string().required("Industry type is required"),
  maxAgents: yup
    .number()
    .positive("Must be positive")
    .integer("Must be an integer")
    .required("Max agents is required"),
  subscriptionPlan: yup.string(),
  licenseNumber: yup.string(),
  password: yup.string().when("$isEditMode", {
    is: false,
    then: (schema) =>
      schema
        .required("Password is required")
        .min(6, "Password must be at least 6 characters"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

// Field Configuration
const getAgencyFields = (isEditMode) => [
  {
    name: "name",
    label: "Agency Name",
    type: "text",
    gridSize: { xs: 12 },
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    gridSize: { xs: 12 },
    disabled: isEditMode,
    helperText: isEditMode
      ? undefined
      : "This email will be used for the agency admin account",
  },
  {
    name: "contactPerson",
    label: "Contact Person",
    type: "text",
    gridSize: { xs: 12 },
    helperText: isEditMode
      ? undefined
      : "This person will be the Agency Manager (AGENCY_ADMIN)",
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
    name: "industryType",
    label: "Industry Type",
    type: "select",
    gridSize: { xs: 12 },
    options: [
      { value: "maritime", label: "Maritime" },
      { value: "healthcare", label: "Healthcare" },
      { value: "construction", label: "Construction" },
      { value: "hospitality", label: "Hospitality" },
      { value: "other", label: "Other" },
    ],
    helperText: isEditMode
      ? "Changing industry type will update all users in this agency"
      : "Select the primary industry this agency operates in",
  },
  ...(isEditMode
    ? [
        {
          name: "password",
          label: "New Password (leave blank to keep current)",
          type: "password",
          gridSize: { xs: 12 },
          helperText: "Minimum 6 characters - updates admin password",
        },
      ]
    : [
        {
          name: "password",
          label: "Password",
          type: "password",
          gridSize: { xs: 12 },
          helperText: "Minimum 6 characters for Agency Manager login",
        },
      ]),
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
      { value: "premium", label: "Premium" },
      { value: "enterprise", label: "Enterprise" },
    ],
  },
  {
    name: "licenseNumber",
    label: "License Number",
    type: "text",
    gridSize: { xs: 12 },
  },
];

const AgencyForm = ({ formId, initialData = null, onClose }) => {
  const dispatch = useDispatch();
  const isEditMode = Boolean(initialData);

  const defaultValues = {
    name: initialData?.name || "",
    email: initialData?.email || "",
    contactPerson: initialData?.contactPerson || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    industryType: initialData?.industryType || "maritime",
    maxAgents: initialData?.maxAgents || 10,
    subscriptionPlan: initialData?.subscriptionPlan || "enterprise",
    licenseNumber: initialData?.licenseNumber || "",
    password: "",
  };

  const handleFormSubmit = async (formData) => {
    try {
      const data = { ...formData };

      // Remove password field if in edit mode and it's empty
      if (isEditMode && !data.password) {
        delete data.password;
      }

      if (isEditMode) {
        await dispatch(
          updateAgencyByIdAsync({
            id: initialData._id,
            data,
          }),
        ).unwrap();
        toast.success("Agency updated successfully");
      } else {
        await dispatch(createAgencyAsync(data)).unwrap();
        toast.success(
          "Agency created successfully! Manager account created with userType: 'manager'",
        );
      }
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(error?.message || "Failed to save agency");
    }
  };

  return (
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
  );
};

export default AgencyForm;
