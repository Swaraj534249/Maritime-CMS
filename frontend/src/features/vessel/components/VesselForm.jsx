import React from "react";
import DynamicFormBuilder from "../../../components/FormBuilder/DynamicFormBuilder";
import * as yup from "yup";
import { createVesselAsync, updateVesselByIdAsync } from "../VesselSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

// Validation Schema
const vesselSchema = yup
  .object({
    vesselname: yup.string().required("Vessel name is required"),
    vessel_category: yup.string().required("Category is required"),
    vesseltype: yup.string().required("Type is required"),
    imo_Number: yup.string().required("IMO number is required"),
    flag: yup.string(),
    grt: yup.string(),
    bhp: yup.string(),
    bhp2: yup.string(),
    vesselOwner: yup.string().nullable(),
  })
  .required();

// Field Config
const vesselFields = [
  {
    name: "vesselname",
    label: "Vessel Name",
    type: "text",
    gridSize: { xs: 12 },
  },
  {
    name: "vessel_category",
    label: "Category",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "vesseltype",
    label: "Type",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "imo_Number",
    label: "IMO Number",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  { name: "flag", label: "Flag", type: "text", gridSize: { xs: 12, sm: 6 } },
  { name: "grt", label: "GRT", type: "text", gridSize: { xs: 12, sm: 6 } },
  { name: "bhp", label: "BHP", type: "text", gridSize: { xs: 12, sm: 6 } },
  { name: "bhp2", label: "BHP (file/url)", type: "text", gridSize: { xs: 12 } },

  // FILES
  {
    name: "vessel_image",
    label: "Upload Vessel Image",
    type: "file",
    gridSize: { xs: 12, sm: 6 },
    accept: "image/png,image/jpeg,image/jpg",
    multiple: false,
    helperText: "PNG, JPG, JPEG only (Max 10MB)",
  },
  {
    name: "vessel_documents",
    label: "Upload Vessel Documents",
    type: "file",
    gridSize: { xs: 12, sm: 6 },
    accept: ".pdf,.doc,.docx,.xls,.xlsx",
    multiple: false,
    helperText: "PDF, Word, Excel (Max 10MB)",
  },
];

const VesselForm = ({
  formId,
  initialData = {},
  vesselOwnerId,
  onClose = () => {},
}) => {
  const dispatch = useDispatch();
  const isEditMode = Boolean(initialData?._id);

  const defaultValues = {
    vesselname: initialData?.vesselname || "",
    vessel_category: initialData?.vessel_category || "",
    vesseltype: initialData?.vesseltype || "",
    imo_Number: initialData?.imo_Number || "",
    flag: initialData?.flag || "",
    grt: initialData?.grt || "",
    bhp: initialData?.bhp || "",
    bhp2: initialData?.bhp2 || "",
    vesselOwner: initialData?.vesselOwner._id || initialData?.vesselOwner || "",
  };

  // EXISTING FILES (edit mode preview)
  const existingFiles = {
    vessel_image: initialData?.vessel_image || null,
    vessel_documents: initialData?.vessel_documents || null,
  };

  const handleFormSubmit = async (formData, uploadedFiles) => {
    try {
      const data = new FormData();
      data.append("uploadFolder", "vessels");

      Object.entries(formData).forEach(([key, val]) => {
        if (val === undefined || val === null || val === "") return;
        data.append(key, val);
      });

      if (!isEditMode && vesselOwnerId) {
        data.append("vesselOwner", vesselOwnerId);
      }

      if (uploadedFiles?.vessel_image) {
        data.append("vessel_image", uploadedFiles.vessel_image);
      }

      if (uploadedFiles.vessel_documents) {
        data.append("vessel_documents", uploadedFiles.vessel_documents);
      }
      console.log("formData", formData, uploadedFiles);

      if (isEditMode) {
        data.append("_id", initialData._id);
        await dispatch(updateVesselByIdAsync(data)).unwrap();
        toast.success("Vessel updated successfully");
      } else {
        await dispatch(createVesselAsync(data)).unwrap();
        toast.success("Vessel created successfully");
      }

      onClose();
    } catch (error) {
      console.error("Vessel submit error:", error);
    }
  };

  return (
    <DynamicFormBuilder
      formId={formId}
      fields={vesselFields}
      validationSchema={vesselSchema}
      defaultValues={defaultValues}
      onSubmit={handleFormSubmit}
      onCancel={onClose}
      isEditMode={isEditMode}
      existingFiles={existingFiles}
    />
  );
};

export default VesselForm;
