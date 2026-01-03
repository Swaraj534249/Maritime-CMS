import React from "react";
import { useDispatch } from "react-redux";
import * as yup from "yup";
import {
  createAgentAsync,
  updateAgentByIdAsync,
} from "../AgentSlice";
import DynamicFormBuilder from "../../../components/FormBuilder/DynamicFormBuilder";
import { toast } from "react-toastify";

// Validation Schema
const agentSchema = yup
  .object({
    name: yup.string().required("Name is required"),
    email: yup
      .string()
      .email("Invalid email")
      .required("Email is required"),
    password: yup.string().when("$isEditMode", {
      is: false,
      then: (schema) =>
        schema
          .required("Password is required")
          .min(6, "Password must be at least 6 characters"),
      otherwise: (schema) => schema.notRequired(),
    }),
    userType: yup.string(),
  })
  .required();

// Field Configuration
const getAgentFields = (isEditMode) => [
  {
    name: "name",
    label: "Name",
    type: "text",
    gridSize: { xs: 12 },
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    gridSize: { xs: 12 },
    disabled: isEditMode, // Disable email editing
  },
  ...(isEditMode
    ? [] // Don't show password field in edit mode
    : [
        {
          name: "password",
          label: "Password",
          type: "password",
          gridSize: { xs: 12 },
          helperText: "Minimum 6 characters",
        },
      ]),
  {
    name: "userType",
    label: "User Type",
    type: "select",
    gridSize: { xs: 12 },
    options: ["Crew", "Crewing Agent", "Vessel Owner", "Vessel Manager"],
  },
];

const AgentForm = ({ formId, initialData = null, onClose }) => {
  const dispatch = useDispatch();
  const isEditMode = Boolean(initialData);

  const defaultValues = {
    name: initialData?.name || "",
    email: initialData?.email || "",
    password: "",
    userType: initialData?.userType || "",
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
          updateAgentByIdAsync({
            id: initialData._id,
            data,
          })
        ).unwrap();
        toast.success("Agent updated successfully");
      } else {
        await dispatch(createAgentAsync(data)).unwrap();
        toast.success("Agent created successfully");
      }
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(error?.message || "Failed to save agent");
    }
  };

  return (
    <DynamicFormBuilder
      formId={formId}
      fields={getAgentFields(isEditMode)}
      validationSchema={agentSchema}
      defaultValues={defaultValues}
      onSubmit={handleFormSubmit}
      onCancel={onClose}
      isEditMode={isEditMode}
      context={{ isEditMode }} // Pass context for conditional validation
    />
  );
};

export default AgentForm;