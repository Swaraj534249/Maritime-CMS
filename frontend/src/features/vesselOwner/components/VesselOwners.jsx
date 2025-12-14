import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  getAllVesselOwnersAsync,
  resetVesselOwnerUpdateStatus,
  selectVesselOwnerUpdateStatus,
  selectVesselOwners,
  selectVesselOwnersTotalCount,
} from '../../vesselOwner/VesselOwnerSlice'
import { 
  Button, 
  IconButton, 
  Stack, 
  Tooltip, 
  Menu, 
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton as MuiIconButton,
  Chip,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography,
  Divider,
  Badge,
} from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DirectionsBoatFilledOutlinedIcon from '@mui/icons-material/DirectionsBoatFilledOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import DescriptionIcon from '@mui/icons-material/Description'
import DownloadIcon from '@mui/icons-material/Download'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ArticleIcon from '@mui/icons-material/Article'
import BadgeIcon from '@mui/icons-material/Badge'
import { toast } from 'react-toastify'
import DataTable from '../../../components/DataTable/DataTable'
import Search from '../../../components/Search/Search'
import VesselOwnerForm from './VesselOwnerForm'

export const VesselOwners = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const vesselOwners = useSelector(selectVesselOwners)
  const totalCount = useSelector(selectVesselOwnersTotalCount)
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedRowId, setSelectedRowId] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [openDocumentsDialog, setOpenDocumentsDialog] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState({ contract: null, license: null })
  const vesselOwnerUpdateStatus = useSelector(selectVesselOwnerUpdateStatus)

  // server-side pagination/sorting state
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sortModel, setSortModel] = useState([])
  const [searchValue, setSearchValue] = useState('')

  const sortFieldMap = useMemo(() => ({
    company: 'company_name',
    contact: 'contactperson',
    crewing: 'crewing_department1',
    id: '_id'
  }), [])

  const fetchPage = (pageOneBased, limit, sortField, sortOrder, searchValue, controller) => {
    const params = { page: pageOneBased, limit }
    if (sortField) params.sortField = sortField
    if (sortOrder) params.sortOrder = sortOrder
    if (searchValue) params.searchValue = searchValue
    dispatch(getAllVesselOwnersAsync({ params, signal: controller }))
  }

  useEffect(() => {
    const controller = new AbortController()
    const page1 = paginationModel.page + 1
    const limit = paginationModel.pageSize
    const sort = sortModel[0]
    const sortField = sort ? sortFieldMap[sort.field] || sort.field : undefined
    const sortOrder = sort ? sort.sort : undefined

    fetchPage(page1, limit, sortField, sortOrder, searchValue, controller.signal)

    return () => { controller.abort() }
  }, [dispatch, paginationModel, sortModel, sortFieldMap, searchValue])

  useEffect(() => {
    if (vesselOwnerUpdateStatus === 'fulfilled') {
      toast.success('Status updated')
      setOpenModal(false)
      setEditData(null)
      // Refresh data
      const page1 = paginationModel.page + 1
      const limit = paginationModel.pageSize
      fetchPage(page1, limit, undefined, undefined, searchValue, new AbortController().signal)
    } else if (vesselOwnerUpdateStatus === 'rejected') {
      toast.error('Error updating vessel owner status')
    }
  }, [vesselOwnerUpdateStatus])

  useEffect(() => {
    return () => {
      dispatch(resetVesselOwnerUpdateStatus())
    }
  }, [dispatch])

  // Helper function to get file URL
  const getFileURL = (filePath) => {
    if (!filePath) return null
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000'
    return `${baseURL}/${filePath.replace(/\\/g, '/')}`
  }

  // Helper function to determine if file is PDF
  const isPDF = (file) => {
    return file?.mimetype === 'application/pdf' || 
           file?.filename?.toLowerCase().endsWith('.pdf') ||
           file?.originalName?.toLowerCase().endsWith('.pdf')
  }

  // handlers
  const handleMenuOpen = (event, rowId) => {
    setAnchorEl(event.currentTarget)
    setSelectedRowId(rowId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedRowId(null)
  }

  const handleAddNew = () => {
    setEditData(null)
    setOpenModal(true)
  }

  const handleEdit = () => {
    const vessel = vesselOwners.find(v => v._id === selectedRowId)
    setEditData(vessel)
    setOpenModal(true)
    handleMenuClose()
  }

  const handleViewVessels = () => {
    navigate(`/vessels/${selectedRowId}`)
    handleMenuClose()
  }

  const handleDelete = () => {
    toast.info('Delete functionality not yet implemented')
    handleMenuClose()
  }

  const handleCloseModal = () => {
    setOpenModal(false)
    setEditData(null)
  }

  const handlePaginationModelChange = (model) => {
    if (model.pageSize !== paginationModel.pageSize) {
      setPaginationModel({ page: 0, pageSize: model.pageSize })
    } else {
      setPaginationModel(model)
    }
  }

  const handleSortModelChange = (newModel) => {
    setSortModel(newModel)
    setPaginationModel((prev) => ({ ...prev, page: 0 }))
  }

  const handleSearch = (text) => {
    setSearchValue(text)
    setPaginationModel((prev) => ({ ...prev, page: 0 }))
  }

  const handleOpenDocuments = (vesselOwner) => {
    setSelectedDocuments({
      contract: vesselOwner.contract || null,
      license: vesselOwner.license || null,
    })
    setOpenDocumentsDialog(true)
  }

  const handleDocumentClick = (document) => {
    const fileURL = getFileURL(document.path)
    
    if (isPDF(document)) {
      // Open PDF in new tab
      window.open(fileURL, '_blank')
    } else {
      // Download other file types
      const link = window.document.createElement('a')
      link.href = fileURL
      link.download = document.originalName || document.filename
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    }
  }

  // Get file icon based on type
  const getFileIcon = (document) => {
    if (isPDF(document)) {
      return <PictureAsPdfIcon color="error" />
    }
    const ext = document.filename?.split('.').pop()?.toLowerCase()
    if (['doc', 'docx'].includes(ext)) {
      return <DescriptionIcon color="primary" />
    }
    if (['xls', 'xlsx'].includes(ext)) {
      return <DescriptionIcon color="success" />
    }
    return <InsertDriveFileIcon />
  }

  // render cell functions
  const renderCompanyCell = (params) => {
    const fullName = `${params.row.company_shortname || ''} ${params.row.company_name || ''}`.trim()
    const rawData = params.row._raw
    const logoURL = rawData?.company_logo?.path ? getFileURL(rawData.company_logo.path) : null

    return (
      <Tooltip title={fullName} arrow>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {logoURL ? (
            <Avatar
              src={logoURL}
              alt={fullName}
              sx={{ width: 32, height: 32 }}
              variant="rounded"
            />
          ) : (
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
              variant="rounded"
            >
              {fullName.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <div style={{ 
            cursor: 'pointer', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            flex: 1
          }}>
            {fullName}
          </div>
        </Box>
      </Tooltip>
    )
  }

  const renderContactCell = (params) => {
    const { contact_person, contact_details } = params.row
    return (
      <Tooltip title={`${contact_person}\n${contact_details}`} arrow>
        <div>
          <div style={{ fontWeight: 500 }}>{contact_person}</div>
          <div style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {contact_details}
          </div>
        </div>
      </Tooltip>
    )
  }

  const renderCrewingCell = (params) => {
    const { crewing_team } = params.row
    return (
      <Tooltip title={crewing_team || 'No crewing team'} arrow>
        <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {crewing_team || '-'}
        </div>
      </Tooltip>
    )
  }

  const renderFilesCell = (params) => {
    const rawData = params.row._raw
    const hasContract = rawData?.contract?.main?.filename || rawData?.contract?.old?.filename
    const hasLicense = rawData?.license?.main?.filename || rawData?.license?.old?.filename
    const docsCount = (hasContract ? 1 : 0) + (hasLicense ? 1 : 0)

    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        {docsCount > 0 ? (
          <Chip
            icon={<InsertDriveFileIcon />}
            label={`${docsCount} Doc${docsCount > 1 ? 's' : ''}`}
            size="small"
            color="primary"
            onClick={() => handleOpenDocuments(rawData)}
            sx={{ cursor: 'pointer' }}
          />
        ) : (
          <span style={{ color: '#999', fontSize: 12 }}>No files</span>
        )}
      </Box>
    )
  }

  const renderActionsCell = (params) => {
    const id = params.row.id
    return (
      <Tooltip title="More actions" arrow>
        <IconButton size="small" onClick={(event) => handleMenuOpen(event, id)}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )
  }

  // Render document section in dialog
  const renderDocumentSection = (title, docData, icon) => {
    if (!docData?.main?.filename && !docData?.old?.filename) {
      return null
    }

    return (
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          {icon}
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
        </Stack>
        
        {/* Main File */}
        {docData.main?.filename && (
          <ListItemButton 
            onClick={() => handleDocumentClick(docData.main)}
            sx={{ 
              border: '1px solid #4caf50', 
              borderRadius: 1, 
              mb: 1,
              backgroundColor: '#f1f8f4',
              '&:hover': {
                backgroundColor: '#e8f5e9'
              }
            }}
          >
            <ListItemIcon>
              {getFileIcon(docData.main)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Badge badgeContent="Main" color="success" />
                  <Typography variant="body2">
                    {docData.main.originalName || docData.main.filename}
                  </Typography>
                </Stack>
              }
              secondary={`${(docData.main.size / 1024).toFixed(2)} KB • ${new Date(docData.main.uploadedAt).toLocaleDateString()}`}
            />
            {isPDF(docData.main) ? (
              <Tooltip title="Open in new tab">
                <IconButton edge="end" size="small">
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Download">
                <IconButton edge="end" size="small">
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </ListItemButton>
        )}
        
        {/* Old File */}
        {docData.old?.filename && (
          <ListItemButton 
            onClick={() => handleDocumentClick(docData.old)}
            sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <ListItemIcon>
              {getFileIcon(docData.old)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Badge badgeContent="Old" color="default" />
                  <Typography variant="body2">
                    {docData.old.originalName || docData.old.filename}
                  </Typography>
                </Stack>
              }
              secondary={`${(docData.old.size / 1024).toFixed(2)} KB • ${new Date(docData.old.uploadedAt).toLocaleDateString()}`}
            />
            {isPDF(docData.old) ? (
              <Tooltip title="Open in new tab">
                <IconButton edge="end" size="small">
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Download">
                <IconButton edge="end" size="small">
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </ListItemButton>
        )}
      </Box>
    )
  }

  // rows & columns
  const rows = vesselOwners.map((v) => ({
    id: v._id,
    company_shortname: v.company_shortname,
    company_name: v.company_name,
    contact_person: `${v.cperson_prefix ?? ''} ${v.contactperson ?? ''}`.trim(),
    contact_details: [v.phoneno, v.email, v.address].filter(Boolean).join(' | '),
    crewing_team: [v.crewing_department1, v.crewing_department11, v.phonecrewing_department1, v.crewemail1]
      .filter(Boolean)
      .join(' | '),
    _raw: v,
  }))

  const columns = [
    { field: 'id', headerName: 'Id', flex: 0.4, minWidth: 90, sortable: true },
    {
      field: 'company',
      headerName: 'Owner Name',
      flex: 2,
      minWidth: 220,
      sortable: true,
      valueGetter: (params) => `${params.row.company_shortname || ''} ${params.row.company_name || ''}`.trim(),
      renderCell: renderCompanyCell,
    },
    {
      field: 'contact',
      headerName: 'Contact Person',
      flex: 2.2,
      minWidth: 220,
      sortable: true,
      valueGetter: (params) => params.row.contact_person ?? '',
      renderCell: renderContactCell,
    },
    {
      field: 'crewing',
      headerName: 'Crewing Team',
      flex: 1.6,
      minWidth: 140,
      sortable: true,
      valueGetter: (params) => params.row.crewing_team ?? '',
      renderCell: renderCrewingCell,
    },
    {
      field: 'files',
      headerName: 'Documents',
      flex: 1,
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: renderFilesCell,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      minWidth: 100,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: renderActionsCell,
    },
  ]

  return (
    <Stack justifyContent={'center'} alignItems={'center'}>
      <Stack mt={0} mb={0} sx={{ width: '100%' }}>
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="center"
          sx={{ px: 1, mb: 1 }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{ textTransform: 'none' }}
          >
            Add Vessel Owner
          </Button>

          <Search
            value={searchValue}
            onDebouncedChange={(val) => handleSearch(val)}
            delay={800}
            placeholder="Search vessel owners..."
            sx={{ width: { xs: '140px', sm: '220px', md: '320px' } }}
          />
        </Stack>

        <DataTable
          rows={rows}
          columns={columns}
          sx={{ maxWidth: '100%' }}
          showToolbar={false}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          rowCount={totalCount}
          paginationMode="server"
          sortingMode="server"
          sortingModel={sortModel}
          onSortModelChange={handleSortModelChange}
        />

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>
            <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleViewVessels}>
            <DirectionsBoatFilledOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
            View Vessels
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            Delete
          </MenuItem>
        </Menu>

        {/* Documents Dialog */}
        <Dialog
          open={openDocumentsDialog}
          onClose={() => setOpenDocumentsDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Documents
            <MuiIconButton
              onClick={() => setOpenDocumentsDialog(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </MuiIconButton>
          </DialogTitle>
          <DialogContent>
            {/* Contract Section */}
            {renderDocumentSection('Contract', selectedDocuments.contract, <ArticleIcon color="primary" />)}
            
            {/* License Section */}
            {renderDocumentSection('License', selectedDocuments.license, <BadgeIcon color="secondary" />)}
            
            {/* No documents message */}
            {!selectedDocuments.contract?.main?.filename && 
             !selectedDocuments.contract?.old?.filename &&
             !selectedDocuments.license?.main?.filename &&
             !selectedDocuments.license?.old?.filename && (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                No documents available
              </Typography>
            )}
          </DialogContent>
        </Dialog>

        {/* Add/Edit Modal */}
        <Dialog
          open={openModal}
          onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editData ? 'Edit Vessel Owner' : 'Add New Vessel Owner'}
            <MuiIconButton
              onClick={handleCloseModal}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </MuiIconButton>
          </DialogTitle>
          <DialogContent dividers>
            <VesselOwnerForm
              initialData={editData} 
              onClose={handleCloseModal}
            />
          </DialogContent>
        </Dialog>
      </Stack>
    </Stack>
  )
}