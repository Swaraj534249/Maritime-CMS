import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import DynamicFormBuilder from "../../../components/FormBuilder/DynamicFormBuilder";
import * as yup from "yup";
import { toast } from "react-toastify";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { parseResume } from "../CandidateApi";
import { fetchRanks } from "../../assets/rank/RankApi";
import { submitEntityWithFiles, EntitySubmitError } from "../../../utils/entitySubmitWithFiles";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { getFileSizeError } from "../../../utils/fileUtils";
import {
  createCandidateAsync,
  updateCandidateByIdAsync,
} from "../../candidate/CandidateSlice";

// Validation Schema
const candidateSchema = yup.object({
  firstName: yup.string().required("First name is required"),
  middleName: yup.string(),
  lastName: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup.string().required("Phone is required"),
  alternatePhone: yup.string(),
  dateOfBirth: yup.date().required("Date of birth is required"),
  gender: yup.string().required("Gender is required"),
  nationality: yup.string().required("Nationality is required"),
  address: yup.string().required("Address is required"),
  aadharNumber: yup.string(),
  panNumber: yup.string(),
  indosNumber: yup.string().required("Indos number is required"),
  cdcNumber: yup.string(),
  cdcIssueDate: yup.date().nullable(),
  cdcExpiryDate: yup.date().nullable(),
  passportNumber: yup.string().required("Passport number is required"),
  passportIssueDate: yup.date().nullable(),
  passportExpiryDate: yup.date().nullable(),
  passportPlaceOfIssue: yup.string(),
  seamanBookNumber: yup.string(),
  rank: yup.string().required("Rank is required"),
  vesselType: yup.string(),
  currentStatus: yup.string().required("Current status is required"),
  availableFrom: yup.date().nullable(),
  nextOfKinName: yup.string(),
  nextOfKinRelationship: yup.string(),
  nextOfKinPhone: yup.string(),
  nextOfKinAddress: yup.string(),
  remarks: yup.string(),
}).required();

const candidateFields = [
  {
    name: "resume",
    label: "Resume/CV",
    type: "file",
    accept: ".pdf,.doc,.docx",
    gridSize: { xs: 12 },
    helperText:
      "Upload resume to auto-fill form fields below (PDF, DOC, DOCX). Max 10MB.",
  },
  {
    name: "firstName",
    label: "First Name",
    type: "text",
    gridSize: { xs: 12, sm: 4 },
  },
  {
    name: "middleName",
    label: "Middle Name",
    type: "text",
    gridSize: { xs: 12, sm: 4 },
  },
  {
    name: "lastName",
    label: "Last Name",
    type: "text",
    gridSize: { xs: 12, sm: 4 },
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "phone",
    label: "Phone",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "alternatePhone",
    label: "Alternate Phone",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "dateOfBirth",
    label: "Date of Birth",
    type: "date",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "gender",
    label: "Gender",
    type: "select",
    options: ["Male", "Female", "Other"],
    gridSize: { xs: 12, sm: 4 },
  },
  {
    name: "nationality",
    label: "Nationality",
    type: "text",
    gridSize: { xs: 12, sm: 4 },
  },
  {
    name: "address",
    label: "Address",
    type: "textarea",
    gridSize: { xs: 12 },
    multiline: true,
    rows: 2,
  },
  {
    name: "aadharNumber",
    label: "Aadhar Number",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "panNumber",
    label: "PAN Number",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "passportNumber",
    label: "Passport Number",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "passportIssueDate",
    label: "Passport Issue Date",
    type: "date",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "passportExpiryDate",
    label: "Passport Expiry Date",
    type: "date",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "passportPlaceOfIssue",
    label: "Passport Place of Issue",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "cdcNumber",
    label: "CDC Number",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "cdcIssueDate",
    label: "CDC Issue Date",
    type: "date",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "cdcExpiryDate",
    label: "CDC Expiry Date",
    type: "date",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "indosNumber",
    label: "INDOS Number",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "seamanBookNumber",
    label: "Seaman Book Number",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "rank",
    label: "Rank/Position",
    type: "select",
    options: [],
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "vesselType",
    label: "Vessel Type",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "currentStatus",
    label: "Current Status",
    type: "select",
    options: [
      "Available",
      "On Board",
      "On Leave",
      "Not Available",
      "Blacklisted",
    ],
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "availableFrom",
    label: "Available From",
    type: "date",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "photo",
    label: "Photograph",
    type: "file",
    accept: "image/png,image/jpeg,image/jpg",
    gridSize: { xs: 12, sm: 6 },
    helperText: "PNG, JPG, JPEG only (Max 10MB)",
  },
  {
    name: "passport",
    label: "Passport Copy",
    type: "file",
    accept: ".pdf,.doc,.docx,image/png,image/jpeg",
    gridSize: { xs: 12, sm: 6 },
    helperText: "Max 10MB per file",
  },
  {
    name: "cdc",
    label: "CDC Document",
    type: "file",
    accept: ".pdf,.doc,.docx",
    gridSize: { xs: 12, sm: 6 },
    helperText: "Max 10MB per file",
  },
  {
    name: "indos",
    label: "INDOS Document",
    type: "file",
    accept: ".pdf,.doc,.docx,image/png,image/jpeg",
    gridSize: { xs: 12, sm: 6 },
    helperText: "Max 10MB per file",
  },
  {
    name: "visa",
    label: "Visa Document",
    type: "file",
    accept: ".pdf,.doc,.docx,image/png,image/jpeg",
    gridSize: { xs: 12, sm: 6 },
    helperText: "Max 10MB per file",
  },
  {
    name: "aadhar",
    label: "Aadhar Document",
    type: "file",
    accept: ".pdf,.doc,.docx,image/png,image/jpeg",
    gridSize: { xs: 12, sm: 6 },
    helperText: "Max 10MB per file",
  },
  {
    name: "pan",
    label: "PAN Document",
    type: "file",
    accept: ".pdf,.doc,.docx,image/png,image/jpeg",
    gridSize: { xs: 12, sm: 6 },
    helperText: "Max 10MB per file",
  },
  {
    name: "seamanBook",
    label: "Seaman Book",
    type: "file",
    accept: ".pdf,.doc,.docx,image/png,image/jpeg",
    gridSize: { xs: 12, sm: 6 },
    helperText: "Max 10MB per file",
  },
  {
    name: "medicalCertificate",
    label: "Medical Certificate",
    type: "file",
    accept: ".pdf,.doc,.docx,image/png,image/jpeg",
    gridSize: { xs: 12, sm: 6 },
    helperText: "Max 10MB per file",
  },
  {
    name: "nextOfKinName",
    label: "Next of Kin Name",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "nextOfKinRelationship",
    label: "Relationship",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "nextOfKinPhone",
    label: "Next of Kin Phone",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "nextOfKinAddress",
    label: "Next of Kin Address",
    type: "textarea",
    gridSize: { xs: 12 },
    multiline: true,
    rows: 2,
  },
  {
    name: "remarks",
    label: "Remarks/Notes",
    type: "textarea",
    gridSize: { xs: 12 },
    multiline: true,
    rows: 3,
  },
];

const CandidateForm = ({
  formId,
  initialData = {},
  onSubmit,
  onCancel,
  isEditMode = false,
}) => {
  const dispatch = useDispatch();
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState(null);
  const [rankOptions, setRankOptions] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await fetchRanks({ all: "true", activeOnly: "true" });
        if (active) setRankOptions((data || []).map((r) => r.rankName));
      } catch (err) {
        // Non-blocking: dropdown will stay empty if ranks fail to load
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const fields = useMemo(() => {
    const opts = [...rankOptions];
    const current = initialData?.rank;
    if (current && !opts.includes(current)) opts.unshift(current);
    return candidateFields.map((field) =>
      field.name === "rank" ? { ...field, options: opts } : field,
    );
  }, [rankOptions, initialData?.rank]);

  const defaultValues = {
    firstName: initialData?.firstName || "",
    middleName: initialData?.middleName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    alternatePhone: initialData?.alternatePhone || "",
    dateOfBirth: initialData?.dateOfBirth || null,
    gender: initialData?.gender || "Male",
    nationality: initialData?.nationality || "Indian",
    address: initialData?.address || "",
    aadharNumber: initialData?.aadharNumber || "",
    panNumber: initialData?.panNumber || "",
    passportNumber: initialData?.passportNumber || "",
    passportIssueDate: initialData?.passportIssueDate || null,
    passportExpiryDate: initialData?.passportExpiryDate || null,
    passportPlaceOfIssue: initialData?.passportPlaceOfIssue || "",
    cdcNumber: initialData?.cdcNumber || "",
    cdcIssueDate: initialData?.cdcIssueDate || null,
    cdcExpiryDate: initialData?.cdcExpiryDate || null,
    indosNumber: initialData?.indosNumber || "",
    seamanBookNumber: initialData?.seamanBookNumber || "",
    rank: initialData?.rank || "",
    vesselType: initialData?.vesselType || "",
    currentStatus: initialData?.currentStatus || "Available",
    availableFrom: initialData?.availableFrom || null,
    nextOfKinName: initialData?.nextOfKinName || "",
    nextOfKinRelationship: initialData?.nextOfKinRelationship || "",
    nextOfKinPhone: initialData?.nextOfKinPhone || "",
    nextOfKinAddress: initialData?.nextOfKinAddress || "",
    remarks: initialData?.remarks || "",
  };

  const existingFiles = {
    photo: initialData?.documents?.photo || null,
    passport: initialData?.documents?.passport || null,
    cdc: initialData?.documents?.cdc || null,
    indos: initialData?.documents?.indos || null,
    visa: initialData?.documents?.visa || null,
    aadhar: initialData?.documents?.aadhar || null,
    pan: initialData?.documents?.pan || null,
    seamanBook: initialData?.documents?.seamanBook || null,
    medicalCertificate: initialData?.documents?.medicalCertificate || null,
    resume: initialData?.documents?.resume || null,
  };

  const handleResumeUpload = async (file, setFieldValue) => {
    if (!file || isEditMode) return;

    const sizeError = getFileSizeError(file);
    if (sizeError) {
      toast.error(sizeError);
      return;
    }

    setIsParsing(true);
    setParseMessage(null);

    try {
      const result = await parseResume(file);

      if (result.success && result.data) {
        const parsed = result.data;
        if (parsed.firstName) setFieldValue("firstName", parsed.firstName);
        if (parsed.middleName) setFieldValue("middleName", parsed.middleName);
        if (parsed.lastName) setFieldValue("lastName", parsed.lastName);
        if (parsed.email) setFieldValue("email", parsed.email);
        if (parsed.phone) setFieldValue("phone", parsed.phone);
        if (parsed.alternatePhone)
          setFieldValue("alternatePhone", parsed.alternatePhone);
        if (parsed.address) setFieldValue("address", parsed.address);
        if (parsed.dateOfBirth) setFieldValue("dateOfBirth", parsed.dateOfBirth);
        if (parsed.gender) setFieldValue("gender", parsed.gender);
        if (parsed.nationality) setFieldValue("nationality", parsed.nationality);
        if (parsed.aadharNumber)
          setFieldValue("aadharNumber", parsed.aadharNumber);
        if (parsed.panNumber) setFieldValue("panNumber", parsed.panNumber);
        if (parsed.cdcNumber) setFieldValue("cdcNumber", parsed.cdcNumber);
        if (parsed.indosNumber) setFieldValue("indosNumber", parsed.indosNumber);
        if (parsed.passportNumber)
          setFieldValue("passportNumber", parsed.passportNumber);
        if (parsed.passportPlaceOfIssue)
          setFieldValue("passportPlaceOfIssue", parsed.passportPlaceOfIssue);
        if (parsed.seamanBookNumber)
          setFieldValue("seamanBookNumber", parsed.seamanBookNumber);
        if (parsed.rank) setFieldValue("rank", parsed.rank);

        toast.success(
          `Resume parsed successfully! ${parsed._confidence || 0}% fields auto-filled`,
        );
        setParseMessage({
          type: "success",
          text: "Form fields auto-filled from resume. Please review and complete any missing information.",
        });
      } else {
        toast.warning("Could not auto-fill from resume. Please fill manually.");
        setParseMessage({
          type: "warning",
          text: "Could not extract all data from resume. Please fill the form manually.",
        });
      }
    } catch (error) {
      console.error("Resume parsing error:", error);
      toast.error("Failed to parse resume. Please fill the form manually.");
      setParseMessage({
        type: "error",
        text: "Failed to parse resume. Please fill the form manually.",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const buildCandidateFormData = (formData) => {
    const data = new FormData();
    data.append("uploadFolder", "candidates");
    Object.keys(formData).forEach((key) => {
      const val = formData[key];
      if (val === undefined || val === null) return;
      const singleVal = Array.isArray(val) ? val[0] : val;
      data.append(key, singleVal);
    });
    return data;
  };

  const handleFormSubmit = async (formData, uploadedFiles) => {
    try {
      if (!formData.indosNumber?.trim()) {
        toast.error("INDOS number is required before saving files");
        return;
      }

      await submitEntityWithFiles({
        formData,
        uploadedFiles,
        uploadFolder: "candidates",
        uploadFormFields: { indosNumber: formData.indosNumber },
        isEditMode,
        entityId: initialData?._id,
        buildFormData: buildCandidateFormData,
        create: (data) => dispatch(createCandidateAsync(data)).unwrap(),
        update: (data) => dispatch(updateCandidateByIdAsync(data)).unwrap(),
      });

      toast.success(
        isEditMode
          ? "Candidate updated successfully"
          : "Candidate created successfully",
      );
      if (onSubmit) onSubmit();
    } catch (error) {
      console.error("Form submission error:", error);

      if (error instanceof EntitySubmitError && error.partialUpload) {
        toast.warning(
          `${error.savedFileCount} file(s) saved. Failed: ${error.message}`,
          { autoClose: 8000 },
        );
        if (onSubmit) onSubmit();
        return;
      }

      toast.error(getErrorMessage(error, "Failed to save candidate"));
    }
  };

  return (
    <>
      {isParsing && (
        <Alert
          severity="info"
          icon={<CircularProgress size={20} />}
          sx={{ mb: 2 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AutorenewIcon className="spinning" />
            <Typography>Parsing resume and auto-filling form...</Typography>
          </Box>
        </Alert>
      )}

      {parseMessage && !isParsing && (
        <Alert severity={parseMessage.type} sx={{ mb: 2 }}>
          {parseMessage.text}
        </Alert>
      )}

      <DynamicFormBuilder
        formId={formId}
        fields={fields}
        validationSchema={candidateSchema}
        defaultValues={defaultValues}
        onSubmit={handleFormSubmit}
        onCancel={onCancel}
        isEditMode={isEditMode}
        existingFiles={existingFiles}
        showSubmitButton={false}
        onResumeUpload={handleResumeUpload}
      />

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spinning {
            animation: spin 2s linear infinite;
          }
        `}
      </style>
    </>
  );
};

export default CandidateForm;
