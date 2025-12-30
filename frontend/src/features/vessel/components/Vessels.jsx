import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchVesselByVesselOwnerIdAsync,
  createVesselAsync,
  updateVesselByIdAsync,
  getAllVesselsAsync,
  resetVesselUpdateStatus,
  selectVessels,
  selectVesselUpdateStatus,
  selectVesselsTotalCount,
} from '../../vessel/VesselSlice'
import {
  Stack,
  Button,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Chip,
  IconButton as MuiIconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CloseIcon from '@mui/icons-material/Close'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import DescriptionIcon from '@mui/icons-material/Description'
import DownloadIcon from '@mui/icons-material/Download'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ArticleIcon from '@mui/icons-material/Article'
import BadgeIcon from '@mui/icons-material/Badge'
import DataTable from '../../../components/DataTable/DataTable'
import Search from '../../../components/Search/Search'
import VesselForm from './VesselForm'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

export const Vessels = () => {
  const { id: vesselOwnerId } = useParams()
  const dispatch = useDispatch()
  const vessels = useSelector(selectVessels)
  const totalCount = useSelector(selectVesselsTotalCount)
  const vesselUpdateStatus = useSelector(selectVesselUpdateStatus)

  const [openModal, setOpenModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sortModel, setSortModel] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedRowId, setSelectedRowId] = useState(null)
   const [openDocumentsDialog, setOpenDocumentsDialog] = useState(false)
    const [selectedDocuments, setSelectedDocuments] = useState({ vessel_documents: null })

  const sortFieldMap = useMemo(() => ({
    vessel: 'vesselname',
    category: 'vessel_category',
    specs: 'imo_Number',
    id: '_id'
  }), [])

useEffect(() => {
  const controller = new AbortController()

  const page1 = paginationModel.page + 1
  const limit = paginationModel.pageSize
  const sort = sortModel[0]

  const params = {
    page: page1,
    limit,
    ...(sort && {
      sortField: sortFieldMap[sort.field] || sort.field,
      sortOrder: sort.sort,
    }),
    ...(searchValue && { searchValue }),
    ...(vesselOwnerId && { vesselOwnerId }),
  }

  dispatch(getAllVesselsAsync({ params, signal: controller.signal }))

  return () => controller.abort()
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [paginationModel, sortModel, searchValue, vesselOwnerId])

  useEffect(() => {
    return () => {
      dispatch(resetVesselUpdateStatus())
    }
  }, [dispatch])

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

  const handleAdd = () => {
    setEditData(null)
    setOpenModal(true)
  }

  const handleEdit = () => {
    const vessel = vessels.find(v => v._id === selectedRowId)
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

  const handleSubmit = async (formValues) => {
    try {
      if (editData) {
        const payload = { ...formValues, _id: editData._id }
        await dispatch(updateVesselByIdAsync(payload)).unwrap()
      } else {
        const payload = { ...formValues }
        if (vesselOwnerId) payload.vesselOwner = vesselOwnerId
        await dispatch(createVesselAsync(payload)).unwrap()
      }
    } catch (err) {
      toast.error(err?.message || 'Save failed')
    }
  }

    const handleOpenDocuments = (vessel) => {
    setSelectedDocuments({
      vessel_documents: vessel.vessel_documents || null,
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

  const getFileURL = (filePath) => {
    if (!filePath) return null
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000'
    return `${baseURL}/${filePath.replace(/\\/g, '/')}`
  }

  // render cell functions
  const renderVesselCell = (params) => {
    const fullName = `${params.row.vesselname || ''}`.trim()
    const rawData = params.row._raw
    const imageURL = rawData?.vessel_image?.path ? getFileURL(rawData.vessel_image.path) : null

    return (
      <Tooltip title={fullName} arrow>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {imageURL ? (
                      <Avatar
                        src={imageURL}
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

  const renderFilesCell = (params) => {
      const rawData = params.row._raw
      const hasVessel_documents = rawData?.vessel_documents?.main?.filename || rawData?.vessel_documents?.old?.filename
      const docsCount = (hasVessel_documents ? 1 : 0)
  
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
  const rows = vessels.map((v) => ({
    id: v._id,
    vesselname: v.vesselname,
    vessel_category: v.vessel_category,
    vesseltype: v.vesseltype,
    imo_Number: v.imo_Number,
    grt: v.grt,
    bhp: v.bhp,
    bhp2: v.bhp2,
    flag: v.flag,
    vesselOwnerName: v.vesselOwner?.company_name ?? '',
    _raw: v,
  }))

  const columns = [
    {
      field: 'vessel',
      headerName: 'Vessel',
      flex: 2,
      minWidth: 220,
      sortable: true,
      valueGetter: (params) => params.row.vesselname,
      renderCell: renderVesselCell,
    },
    {
      field: 'category',
      headerName: 'Category / Type',
      flex: 1.6,
      minWidth: 160,
      sortable: true,
      valueGetter: (params) => `${params.row.vessel_category || ''} ${params.row.vesseltype ? ' / ' + params.row.vesseltype : ''}`.trim(),
    },
    {
      field: 'specs',
      headerName: 'IMO / GRT / BHP',
      flex: 1.6,
      minWidth: 160,
      sortable: true,
      valueGetter: (params) => `${params.row.imo_Number || ''} ${params.row.grt ? ' / ' + params.row.grt : ''} ${params.row.bhp ? ' / ' + params.row.bhp : ''}`.trim(),
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
      minWidth: 120,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: renderActionsCell,
    },
  ]

  // const handlePaginationModelChange = (model) => {
  //   if (model.pageSize !== paginationModel.pageSize) {
  //     setPaginationModel({ page: 0, pageSize: model.pageSize })
  //   } else {
  //     setPaginationModel(model)
  //   }
  // }

  const handlePaginationModelChange = (model) => {
  setPaginationModel((prev) => {
    if (prev.page === model.page && prev.pageSize === model.pageSize) {
      return prev // ⛔ NO STATE UPDATE
    }
    return model
  })
}

  const handleSortModelChange = (newModel) => {
    setSortModel(newModel)
    setPaginationModel((prev) => ({ ...prev, page: 0 }))
  }

  const handleSearch = (text) => {
    if (text === searchValue) return
    setSearchValue(text)
    setPaginationModel((prev) => ({ ...prev, page: 0 }))
  }

  return (
    <Stack justifyContent="center" alignItems="center">
      <Stack mb={1} direction="row" width="100%" justifyContent="space-between" alignItems="center" sx={{ px: 1 }}>
        <Typography variant="h6">Vessels</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Search
            value={searchValue}
            onDebouncedChange={(v) => handleSearch(v)}
            delay={800}
            placeholder="Search vessels..."
            sx={{ width: { xs: 140, sm: 220, md: 320 } }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ textTransform: 'none' }}>
            Add Vessel
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

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />
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
            {renderDocumentSection('Vessel_documents', selectedDocuments.vessel_documents, <ArticleIcon color="primary" />)}
            
            {/* License Section */}
            {renderDocumentSection('License', selectedDocuments.license, <BadgeIcon color="secondary" />)}
            
            {/* No documents message */}
            {!selectedDocuments.vessel_documents?.main?.filename && 
             !selectedDocuments.vessel_documents?.old?.filename && (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                No documents available
              </Typography>
            )}
          </DialogContent>
        </Dialog>

      {/* Add/Edit Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {editData ? 'Edit Vessel' : 'Add New Vessel'}
          <IconButton onClick={handleCloseModal} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <VesselForm
            initialData={editData}
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </Stack>
  )
}

export default Vessels
