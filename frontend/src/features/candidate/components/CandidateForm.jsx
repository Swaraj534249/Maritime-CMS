import React, { useState } from "react";
import { useDispatch } from "react-redux";
import DynamicFormBuilder from "../../../components/FormBuilder/DynamicFormBuilder";
import * as yup from "yup";
import { toast } from "react-toastify";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { parseResume } from "../CandidateApi";
import {
  createCandidateAsync,
  updateCandidateByIdAsync,
} from "../../candidate/CandidateSlice";

// Validation Schema
const candidateSchema = yup.object({
  // Basic Information
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

  // Government IDs
  aadharNumber: yup.string(),
  panNumber: yup.string(),

  // Maritime Identification
  indosNumber: yup.string().required("Indos number is required"),
  cdcNumber: yup.string(),
  cdcIssueDate: yup.date().nullable(),
  cdcExpiryDate: yup.date().nullable(),
  passportNumber: yup.string().required("Passport number is required"),
  passportIssueDate: yup.date().nullable(),
  passportExpiryDate: yup.date().nullable(),
  passportPlaceOfIssue: yup.string(),
  seamanBookNumber: yup.string(),

  // Professional Information
  rank: yup.string().required("Rank is required"),
  vesselType: yup.string(),
  currentStatus: yup.string().required("Current status is required"),
  availableFrom: yup.date().nullable(),

  // Next of Kin
  nextOfKinName: yup.string(),
  nextOfKinRelationship: yup.string(),
  nextOfKinPhone: yup.string(),
  nextOfKinAddress: yup.string(),

  remarks: yup.string(),
}).required();

// Field Configuration
const candidateFields = [
  // Resume/CV Upload - First Position
  {
    name: "resume",
    label: "Resume/CV",
    type: "file",
    accept: ".pdf,.doc,.docx",
    gridSize: { xs: 12 },
    helperText:
      "Upload resume to auto-fill form fields below (PDF, DOC, DOCX)",
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
    gridSize: { xs: 12, sm: 3 },
  },
  {
    name: "passportExpiryDate",
    label: "Passport Expiry Date",
    type: "date",
    gridSize: { xs: 12, sm: 3 },
  },
  {
    name: "passportPlaceOfIssue",
    label: "Place of Issue",
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
    gridSize: { xs: 12, sm: 3 },
  },
  {
    name: "cdcExpiryDate",
    label: "CDC Expiry Date",
    type: "date",
    gridSize: { xs: 12, sm: 3 },
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
    options: [
      "Master",
      "Chief Officer",
      "Second Officer",
      "Third Officer",
      "Chief Engineer",
      "Second Engineer",
      "Third Engineer",
      "Fourth Engineer",
      "Bosun",
      "AB (Able Seaman)",
      "OS (Ordinary Seaman)",
      "Oiler",
      "Fitter",
      "Wiper",
      "Cook",
      "Steward",
      "Rating",
    ],
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "vesselType",
    label: "Vessel Type",
    type: "select",
    options: [
      "Bulk Carrier",
      "Container",
      "Tanker",
      "Chemical Tanker",
      "LNG Carrier",
      "LPG Carrier",
      "Offshore",
      "Cruise Ship",
      "RORO",
      "General Cargo",
      "Other",
    ],
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "currentStatus",
    label: "Current Status",
    type: "select",
    options: ["Available", "Onboard", "On Leave", "In Pool", "Not Available"],
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "availableFrom",
    label: "Available From",
    type: "date",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "signOffDate",
    label: "Last Sign Off Date",
    type: "date",
    gridSize: { xs: 12, sm: 6 },
  },

  {
    name: "photo",
    label: "Photograph",
    type: "file",
    accept: "image/png,image/jpeg,image/jpg",
    gridSize: { xs: 12, sm: 6 },
    helperText: "Upload passport size photo (PNG, JPG)",
  },
  {
    name: "passport",
    label: "Passport Copy",
    type: "file",
    accept: ".pdf,.jpg,.jpeg,.png",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "cdc",
    label: "CDC Document",
    type: "file",
    accept: ".pdf,.jpg,.jpeg,.png",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "indos",
    label: "INDOS Document",
    type: "file",
    accept: ".pdf,.jpg,.jpeg,.png",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "visa",
    label: "Visa Document",
    type: "file",
    accept: ".pdf,.jpg,.jpeg,.png",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "seamanBook",
    label: "Seaman Book",
    type: "file",
    accept: ".pdf,.jpg,.jpeg,.png",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "aadhar",
    label: "Aadhar Card",
    type: "file",
    accept: ".pdf,.jpg,.jpeg,.png",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "pan",
    label: "PAN Card",
    type: "file",
    accept: ".pdf,.jpg,.jpeg,.png",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "medicalCertificate",
    label: "Medical Certificate",
    type: "file",
    accept: ".pdf,.jpg,.jpeg,.png",
    gridSize: { xs: 12, sm: 6 },
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
    label: "Phone",
    type: "text",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "nextOfKinAddress",
    label: "Address",
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
  isSubmitting = false,
}) => {
  const dispatch = useDispatch();
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState(null);

  const defaultValues = {
    // Basic Information
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

    // Government IDs
    aadharNumber: initialData?.aadharNumber || "",
    panNumber: initialData?.panNumber || "",

    // Maritime Identification
    passportNumber: initialData?.passportNumber || "",
    passportIssueDate: initialData?.passportIssueDate || null,
    passportExpiryDate: initialData?.passportExpiryDate || null,
    passportPlaceOfIssue: initialData?.passportPlaceOfIssue || "",
    cdcNumber: initialData?.cdcNumber || "",
    cdcIssueDate: initialData?.cdcIssueDate || null,
    cdcExpiryDate: initialData?.cdcExpiryDate || null,
    indosNumber: initialData?.indosNumber || "",
    seamanBookNumber: initialData?.seamanBookNumber || "",

    // Professional
    rank: initialData?.rank || "",
    vesselType: initialData?.vesselType || "",
    currentStatus: initialData?.currentStatus || "Available",
    availableFrom: initialData?.availableFrom || null,
    signOffDate: initialData?.signOffDate || null,

    // Next of Kin (flattened structure)
    nextOfKinName: initialData?.nextOfKinName || "",
    nextOfKinRelationship: initialData?.nextOfKinRelationship || "",
    nextOfKinPhone: initialData?.nextOfKinPhone || "",
    nextOfKinAddress: initialData?.nextOfKinAddress || "",

    remarks: initialData?.remarks || "",
  };

  // Existing files (for edit mode preview)
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
    if (!file || isEditMode) {
      // Don't auto-parse in edit mode
      return;
    }

    setIsParsing(true);
    setParseMessage(null);

    try {
      const result = await parseResume(file);

      if (result.success && result.data) {
        const parsed = result.data;

        // Auto-fill form fields with parsed data
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

        // Government IDs
        if (parsed.aadharNumber)
          setFieldValue("aadharNumber", parsed.aadharNumber);
        if (parsed.panNumber) setFieldValue("panNumber", parsed.panNumber);

        // Maritime IDs
        if (parsed.cdcNumber) setFieldValue("cdcNumber", parsed.cdcNumber);
        if (parsed.indosNumber) setFieldValue("indosNumber", parsed.indosNumber);
        if (parsed.passportNumber)
          setFieldValue("passportNumber", parsed.passportNumber);
        if (parsed.passportPlaceOfIssue)
          setFieldValue("passportPlaceOfIssue", parsed.passportPlaceOfIssue);
        if (parsed.seamanBookNumber)
          setFieldValue("seamanBookNumber", parsed.seamanBookNumber);

        // Professional
        if (parsed.rank) setFieldValue("rank", parsed.rank);

        toast.success(
          `Resume parsed successfully! ${parsed._confidence || 0}% fields auto-filled`
        );
        setParseMessage({
          type: "success",
          text: "Form fields auto-filled from resume. Please review and complete any missing information.",
        });
      } else {
        toast.warning("Resume uploaded but auto-fill failed. Please fill manually.");
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

  const handleFormSubmit = async (formData, uploadedFiles) => {
    try {
      const data = new FormData();
      data.append("uploadFolder", "candidates");

      // Append text fields
      Object.keys(formData).forEach((key) => {
        const val = formData[key];
        if (val === undefined || val === null) return;
        const singleVal = Array.isArray(val) ? val[0] : val;
        data.append(key, singleVal);
      });

      // Append file uploads
      Object.keys(uploadedFiles).forEach((key) => {
        if (uploadedFiles[key]) {
          data.append(key, uploadedFiles[key]);
        }
      });

      if (isEditMode) {
        data.append("_id", initialData._id);
        await dispatch(updateCandidateByIdAsync(data)).unwrap();
        toast.success("Candidate updated successfully");
      } else {
        await dispatch(createCandidateAsync(data)).unwrap();
        toast.success("Candidate created successfully");
      }

      // Call the original onSubmit if provided
      if (onSubmit) {
        onSubmit(data);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(error?.message || "Failed to save candidate");
    }
  };

  return (
    <>
      {/* Parsing Status */}
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

      {/* Parse Result Message */}
      {parseMessage && !isParsing && (
        <Alert severity={parseMessage.type} sx={{ mb: 2 }}>
          {parseMessage.text}
        </Alert>
      )}

      <DynamicFormBuilder
        formId={formId}
        fields={candidateFields}
        validationSchema={candidateSchema}
        defaultValues={defaultValues}
        onSubmit={handleFormSubmit}
        onCancel={onCancel}
        isEditMode={isEditMode}
        existingFiles={existingFiles}
        showSubmitButton={false}
        // Pass the resume upload handler
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