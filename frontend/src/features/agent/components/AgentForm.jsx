import React from "react";
import { useDispatch } from "react-redux";
import * as yup from "yup";
import { createAgentAsync, updateAgentByIdAsync } from "../AgentSlice";
import DynamicFormBuilder from "../../../components/FormBuilder/DynamicFormBuilder";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { toast } from "react-toastify";

const agentSchema = yup
  .object({
    name: yup.string().required("Name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    userType: yup.string(),
  })
  .required();

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
    disabled: isEditMode,
  },
  {
    name: "userType",
    label: "User Type",
    type: "select",
    gridSize: { xs: 12 },
    options: ["Sourcing", "Documentation", "Accounts"],
  },
];

const AgentForm = ({ formId, initialData: initialDataProp = null, onClose }) => {
  const dispatch = useDispatch();
  const initialData = initialDataProp ?? {};
  const isEditMode = Boolean(initialData?._id);

  const defaultValues = {
    name: initialData?.name || "",
    email: initialData?.email || "",
    userType: initialData?.userType || "",
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (isEditMode) {
        await dispatch(
          updateAgentByIdAsync({
            id: initialData._id,
            data: formData,
          }),
        ).unwrap();
        toast.success("Agent updated successfully");
      } else {
        await dispatch(createAgentAsync(formData)).unwrap();
        toast.success(
          "Agent created. They will receive an email to set their password.",
        );
      }
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(getErrorMessage(error, "Failed to save agent"));
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
    />
  );
};

export default AgentForm;
