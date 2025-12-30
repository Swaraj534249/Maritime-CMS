import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  getAllVesselOwnersAsync,
  resetStatuses,
  selectTotalCount,
  selectUpdateStatus,
  selectVesselOwners,
  selectVesselOwnersAggregates,
    selectPaginationModel,
  selectSortModel,
  selectSearchValue,
  setPaginationModel,
  setSortModel,
  setSearchValue,
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
import { useRowActions } from '../../../hooks/useRowActions'
import { getFileURL } from '../../../utils/fileUtils'
import { getFileIcon } from '../../../utils/fileIconUtils'
import { useDocumentActions } from '../../../hooks/useDocumentActions'

export const VesselOwners = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
const vesselOwners = useSelector(selectVesselOwners)
const totalCount = useSelector(selectTotalCount)
const updateStatus = useSelector(selectUpdateStatus)
const aggregates = useSelector(selectVesselOwnersAggregates)
const vesselCountByOwner = aggregates?.vesselCountByOwner || {}
const paginationModel = useSelector(selectPaginationModel)
const sortModel = useSelector(selectSortModel)
const searchValue = useSelector(selectSearchValue)

  const [openModal, setOpenModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [openDocumentsDialog, setOpenDocumentsDialog] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState({ contract: null, license: null })
  const [refreshKey, setRefreshKey] = useState(0)

  const {
  anchorEl,
  open,
  selectedRowId,
  handleMenuOpen,
  handleMenuClose
} = useRowActions()

const { openDocument } = useDocumentActions()

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
  }, [paginationModel, sortModel, searchValue, refreshKey])

  useEffect(() => {
    if (updateStatus === 'fulfilled') {
      toast.success('Status updated')
      setOpenModal(false)
      setEditData(null)
      setRefreshKey(prev => prev + 1)
    } else if (updateStatus === 'rejected') {
      toast.error('Error updating vessel owner status')
    }
  }, [updateStatus])

  const isPDF = (file) => {
    return file?.mimetype === 'application/pdf' || 
           file?.filename?.toLowerCase().endsWith('.pdf') ||
           file?.originalName?.toLowerCase().endsWith('.pdf')
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
    dispatch(setPaginationModel({ page: 0, pageSize: model.pageSize }))
  } else {
    dispatch(setPaginationModel(model))
  }
  }

  const handleSortModelChange = (newModel) => {
    dispatch(setSortModel(newModel))
  dispatch(setPaginationModel({ ...paginationModel, page: 0 }))
  }

  const handleSearch = (text) => {
  if (text === searchValue) return
  dispatch(setSearchValue(text))
  dispatch(setPaginationModel({ ...paginationModel, page: 0 }))
  }

  const handleOpenDocuments = (vesselOwner) => {
    setSelectedDocuments({
      contract: vesselOwner.contract || null,
      license: vesselOwner.license || null,
    })
    setOpenDocumentsDialog(true)
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
  const count = vesselCountByOwner[id] ?? 0

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Chip
        label={count}
        size="small"
        icon={<DirectionsBoatFilledOutlinedIcon />}
        onClick={() => navigate(`/vessels/${id}`)}
        sx={{ cursor: 'pointer' }}
        color={count > 0 ? 'primary' : 'default'}
        variant={count > 0 ? 'filled' : 'outlined'}
      />
      <Tooltip title="More actions" arrow>
        <IconButton size="small" onClick={(event) => handleMenuOpen(event, id)}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
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
            onClick={() => openDocument(docData.main)}
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
            onClick={() => openDocument(docData.old)}
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

  // console.log("vesselOwners: ",vesselOwners);
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
        <Stack mb={1} direction="row" width="100%" justifyContent="space-between" alignItems="center" sx={{ px: 1 }}>
                <Typography variant="h6">Vessel Owners</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Search
            value={searchValue}
            onDebouncedChange={(val) => handleSearch(val)}
            delay={800}
            placeholder="Search vessel owners..."
            sx={{ width: { xs: '140px', sm: '220px', md: '320px' } }}
          />
                   <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{ textTransform: 'none' }}
          >
            Add Vessel Owner
          </Button>
                </Stack>
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

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>
            <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            Delete
          </MenuItem>
        </Menu>

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
            {renderDocumentSection('Contract', selectedDocuments.contract, <ArticleIcon color="primary" />)}
            
            {/* License Section */}
            {renderDocumentSection('License', selectedDocuments.license, <BadgeIcon color="secondary" />)}
            
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