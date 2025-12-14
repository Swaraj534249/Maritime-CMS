import React from 'react'
import { useDispatch } from 'react-redux'
import * as yup from 'yup'
import { createVesselOwnerAsync, updateVesselOwnerByIdAsync } from '../../vesselOwner/VesselOwnerSlice'
import DynamicFormBuilder from '../../../components/FormBuilder/DynamicFormBuilder'
import { toast } from 'react-toastify'

// Validation Schema
const vesselOwnerSchema = yup.object({
  company_shortname: yup.string().required('Company short name is required'),
  company_name: yup.string().required('Company name is required'),
  cperson_prefix: yup.string(),
  contactperson: yup.string().required('Contact person is required'),
  phoneno: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  address: yup.string(),
  crewing_department1: yup.string(),
  crewing_department11: yup.string(),
  phonecrewing_department1: yup.string(),
  crewemail1: yup.string().email('Invalid email'),
}).required()

// Field Configuration
const vesselOwnerFields = [
  {
    name: 'company_shortname',
    label: 'Company Short Name',
    type: 'text',
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: 'company_name',
    label: 'Company Name',
    type: 'text',
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: 'cperson_prefix',
    label: 'Prefix',
    type: 'select',
    gridSize: { xs: 12, sm: 3 },
    options: ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Capt.'],
  },
  {
    name: 'contactperson',
    label: 'Contact Person',
    type: 'text',
    gridSize: { xs: 12, sm: 9 },
  },
  {
    name: 'phoneno',
    label: 'Phone Number',
    type: 'text',
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: 'address',
    label: 'Address',
    type: 'textarea',
    rows: 2,
    gridSize: { xs: 12 },
  },
  {
    name: 'crewing_department1',
    label: 'Crewing Department 1',
    type: 'text',
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: 'crewing_department11',
    label: 'Crewing Department 2',
    type: 'text',
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: 'phonecrewing_department1',
    label: 'Crewing Phone',
    type: 'text',
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: 'crewemail1',
    label: 'Crewing Email',
    type: 'email',
    gridSize: { xs: 12, sm: 6 },
  },
  // FILE UPLOAD FIELDS
  {
    name: 'company_logo',
    label: 'Upload Company Logo',
    type: 'file',
    gridSize: { xs: 12, sm: 6 },
    accept: 'image/png,image/jpeg,image/jpg',
    multiple: false,
    helperText: 'PNG, JPG, JPEG only (Max 10MB)',
  },
  {
    name: 'contract',
    label: 'Upload Contract Document',
    type: 'file',
    gridSize: { xs: 12, sm: 6 },
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    multiple: false,
    helperText: 'PDF, Word, Excel (Max 10MB)',
  },
  {
    name: 'license',
    label: 'Upload License Document',
    type: 'file',
    gridSize: { xs: 12, sm: 6 },
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    multiple: false,
    helperText: 'PDF, Word, Excel (Max 10MB)',
  },
]

const VesselOwnerForm = ({ initialData = null, onClose }) => {
  const dispatch = useDispatch()
  const isEditMode = Boolean(initialData)

  const defaultValues = {
    company_shortname: initialData?.company_shortname || '',
    company_name: initialData?.company_name || '',
    cperson_prefix: initialData?.cperson_prefix || '',
    contactperson: initialData?.contactperson || '',
    phoneno: initialData?.phoneno || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    crewing_department1: initialData?.crewing_department1 || '',
    crewing_department11: initialData?.crewing_department11 || '',
    phonecrewing_department1: initialData?.phonecrewing_department1 || '',
    crewemail1: initialData?.crewemail1 || '',
  }

  // Prepare existing files for edit mode
  const existingFiles = {
    company_logo: initialData?.company_logo || null,
    contract: initialData?.contract || null,
    license: initialData?.license || null,
  }

  const handleFormSubmit = async (formData, uploadedFiles) => {
    try {
      // Create FormData for file upload
      const data = new FormData()
      
      // Add uploadFolder to specify where files should be saved
      data.append('uploadFolder', 'vesselOwners')
      
      // Coerce company_shortname/company_name to single string (use first value if array)
      const companyShort = Array.isArray(formData.company_shortname) ? formData.company_shortname[0] : formData.company_shortname
      const companyName = Array.isArray(formData.company_name) ? formData.company_name[0] : formData.company_name
      if (companyShort) data.append('company_shortname', companyShort)
      if (companyName) data.append('company_name', companyName)
      
      // Append other text fields (ensure single values)
      Object.keys(formData).forEach(key => {
        if (key === 'company_shortname' || key === 'company_name') return
        const val = formData[key]
        if (val === undefined || val === null) return
        const singleVal = Array.isArray(val) ? val[0] : val
        data.append(key, singleVal)
      })
      
      // Append company logo if uploaded
      if (uploadedFiles.company_logo) {
        data.append('company_logo', uploadedFiles.company_logo)
      }
      
      // Append contract if uploaded
      if (uploadedFiles.contract) {
        data.append('contract', uploadedFiles.contract)
      }
      
      // Append license if uploaded
      if (uploadedFiles.license) {
        data.append('license', uploadedFiles.license)
      }
      console.log("formData", formData, data);

      if (isEditMode) {
        data.append('_id', initialData._id)
        await dispatch(updateVesselOwnerByIdAsync(data)).unwrap()
        toast.success('Vessel owner updated successfully')
      } else {
        await dispatch(createVesselOwnerAsync(data)).unwrap()
        toast.success('Vessel owner created successfully')
      }
      
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error(error?.message || 'Failed to save vessel owner')
    }
  }

  return (
    <DynamicFormBuilder
      fields={vesselOwnerFields}
      validationSchema={vesselOwnerSchema}
      defaultValues={defaultValues}
      onSubmit={handleFormSubmit}
      onCancel={onClose}
      isEditMode={isEditMode}
      existingFiles={existingFiles}
    />
  )
}

export default VesselOwnerForm