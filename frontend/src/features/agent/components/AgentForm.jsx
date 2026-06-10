import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import * as yup from "yup";
import { createAgentAsync, updateAgentByIdAsync } from "../AgentSlice";
import { fetchAgentTypes } from "../AgentApi";
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

const getAgentFields = (isEditMode, typeOptions) => [
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
    options: typeOptions,
  },
];

const AgentForm = ({ formId, initialData: initialDataProp = null, onClose }) => {
  const dispatch = useDispatch();
  const initialData = initialDataProp ?? {};
  const isEditMode = Boolean(initialData?._id);

  const [agentTypes, setAgentTypes] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const types = await fetchAgentTypes();
        if (active) setAgentTypes(Array.isArray(types) ? types : []);
      } catch (err) {
        // Non-blocking: dropdown stays empty if types fail to load
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Keep the current value selectable even if it's no longer in the list.
  const typeOptions = (() => {
    const opts = [...agentTypes];
    if (initialData?.userType && !opts.includes(initialData.userType)) {
      opts.unshift(initialData.userType);
    }
    return opts;
  })();

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
      fields={getAgentFields(isEditMode, typeOptions)}
      validationSchema={agentSchema}
      defaultValues={defaultValues}
      onSubmit={handleFormSubmit}
      onCancel={onClose}
      isEditMode={isEditMode}
    />
  );
};

export default AgentForm;
