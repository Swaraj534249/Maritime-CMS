import React from "react";
import { useDispatch } from "react-redux";
import * as yup from "yup";
import { createAgencyAsync, updateAgencyByIdAsync } from "../AgencySlice";
import DynamicFormBuilder from "../../../components/FormBuilder/DynamicFormBuilder";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { toast } from "react-toastify";

const agencySchema = yup.object({
  name: yup.string().required("Agency name is required"),
  shortName: yup
    .string()
    .trim()
    .max(32, "Short name must be at most 32 characters"),
  contactPerson: yup.string().required("Administrator name is required"),
  email: yup
    .string()
    .email("Invalid email")
    .required("Administrator email is required"),
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
});

const getAgencyFields = (isEditMode) => [
  {
    name: "_section_agency",
    type: "section",
    title: "Agency details",
    description:
      "Business information for this tenant. Agents and records are scoped to this agency.",
  },
  {
    name: "name",
    label: "Agency Name",
    type: "text",
    gridSize: { xs: 12 },
  },
  {
    name: "shortName",
    label: "Agency Short Name",
    type: "text",
    gridSize: { xs: 12 },
    helperText:
      "Used in the navbar and S3 folder prefix. If empty, the full agency name is used.",
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
      : "Primary industry this agency operates in",
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
  {
    name: "_section_admin",
    type: "section",
    title: "Agency administrator",
    description: isEditMode
      ? "The person who manages this agency (role: Agency Admin)."
      : "Creates one Agency Admin account. They will receive an email to set their password — no password needed here.",
  },
  {
    name: "contactPerson",
    label: "Administrator Name",
    type: "text",
    gridSize: { xs: 12 },
  },
  {
    name: "email",
    label: "Administrator Email",
    type: "email",
    gridSize: { xs: 12 },
    disabled: isEditMode,
    helperText: isEditMode
      ? "Email cannot be changed after creation"
      : "Login email; also stored on the agency record",
  },
];

const AgencyForm = ({ formId, initialData = null, onClose }) => {
  const dispatch = useDispatch();
  const isEditMode = Boolean(initialData?._id);

  const defaultValues = {
    name: initialData?.name || "",
    shortName: initialData?.shortName || "",
    email: initialData?.email || "",
    contactPerson: initialData?.contactPerson || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    industryType: initialData?.industryType || "maritime",
    maxAgents: initialData?.maxAgents || 10,
    subscriptionPlan: initialData?.subscriptionPlan || "enterprise",
    licenseNumber: initialData?.licenseNumber || "",
  };

  const handleFormSubmit = async (formData) => {
    try {
      const data = { ...formData };
      delete data._section_agency;
      delete data._section_admin;

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
          "Agency created. The administrator will receive an email to set their password.",
        );
      }
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(getErrorMessage(error, "Failed to save agency"));
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
    />
  );
};

export default AgencyForm;
