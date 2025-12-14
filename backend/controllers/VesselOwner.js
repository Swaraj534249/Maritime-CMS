const { Schema, default: mongoose } = require("mongoose")
const VesselOwner = require("../models/VesselOwner")
const { deleteFile } = require("../middleware/upload")

// Helper function to process uploaded files with main/old logic
const processUploadedFiles = (files, existingData = null) => {
  const result = {}
  
  // Process company logo (single file - just replace)
  if (files.company_logo && files.company_logo[0]) {
    const file = files.company_logo[0]
    result.company_logo = {
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date()
    }
  }
  
  // Process contract document (main/old logic)
  if (files.contract && files.contract[0]) {
    const file = files.contract[0]
    const newFile = {
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date()
    }
    
    result.contract = {
      main: newFile,
      old: existingData?.contract?.main || null  // Current main becomes old
    }
  }
  
  // Process license document (main/old logic)
  if (files.license && files.license[0]) {
    const file = files.license[0]
    const newFile = {
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date()
    }
    
    result.license = {
      main: newFile,
      old: existingData?.license?.main || null  // Current main becomes old
    }
  }
  
  return result
}

exports.create = async (req, res) => {
  try {
    const data = { ...req.body }
    
    // Add uploaded files to data
    if (req.files) {
      const uploadedFiles = processUploadedFiles(req.files)
      Object.assign(data, uploadedFiles)
    }
    
    const created = new VesselOwner(data)
    await created.save()
    res.status(201).json(created)
  } catch (error) {
    console.log(error)
    // Clean up uploaded files if save fails
    if (req.files) {
      if (req.files.company_logo) {
        req.files.company_logo.forEach(file => deleteFile(file.path))
      }
      if (req.files.contract) {
        req.files.contract.forEach(file => deleteFile(file.path))
      }
      if (req.files.license) {
        req.files.license.forEach(file => deleteFile(file.path))
      }
    }
    return res.status(500).json({ message: 'Error adding Vessel Owner, please trying again later' })
  }
}

exports.getAll = async (req, res) => {
  try {
    const filter = {}
    let skip = 0
    let limit = 0

    const page = req.query.page ? parseInt(req.query.page, 10) : null
    const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : null

    if (page && pageSize) {
      limit = pageSize
      skip = pageSize * (page - 1)
    }

    // server-side search q
    const searchValue = req.query.searchValue ? String(req.query.searchValue).trim() : null
    if (searchValue) {
      const re = new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [
        { company_name: re },
        { company_shortname: re },
        { contactperson: re },
        { phoneno: re },
        { email: re },
        { address: re },
        { crewing_department1: re },
        { crewing_department11: re }
      ]
    }

    // other possible filters
    if (req.query.user) {
      filter['isDeleted'] = false
    }

    const sortField = req.query.sortField
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1
    const sortObj = {}
    if (sortField) {
      sortObj[sortField] = sortOrder
    }

    const totalDocs = await VesselOwner.countDocuments(filter).exec()

    let query = VesselOwner.find(filter)
    if (Object.keys(sortObj).length) query = query.sort(sortObj)
    if (skip) query = query.skip(skip)
    if (limit) query = query.limit(limit)

    const results = await query.exec()

    res.set("X-Total-Count", totalDocs)
    res.status(200).json(results)

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error fetching Vessel Owner, please try again later' })
  }
}

exports.getById = async (req, res) => {
  try {
    const { id } = req.params
    const result = await VesselOwner.findById(id)
    res.status(200).json(result)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error getting Vessel Owner details, please try again later' })
  }
}

exports.updateById = async (req, res) => {
  try {
    const { id } = req.params
    const data = { ...req.body }

    console.log("data; ",data);
    
    
    // Get existing record
    const existing = await VesselOwner.findById(id)
    if (!existing) {
      return res.status(404).json({ message: 'Vessel Owner not found' })
    }
    
    // Add uploaded files to update data with main/old logic
    if (req.files) {
      const uploadedFiles = processUploadedFiles(req.files, existing)
      
      // If updating company logo, delete old file
      if (uploadedFiles.company_logo) {
        if (existing.company_logo?.path) {
          deleteFile(existing.company_logo.path)
        }
        data.company_logo = uploadedFiles.company_logo
      }
      
      // If updating contract, delete the old file (not the current main)
      if (uploadedFiles.contract) {
        if (existing.contract?.old?.path) {
          deleteFile(existing.contract.old.path)
        }
        data.contract = uploadedFiles.contract
      }
      
      // If updating license, delete the old file (not the current main)
      if (uploadedFiles.license) {
        if (existing.license?.old?.path) {
          deleteFile(existing.license.old.path)
        }
        data.license = uploadedFiles.license
      }
    }
    
    const updated = await VesselOwner.findByIdAndUpdate(id, data, { new: true })
    res.status(200).json(updated)
  } catch (error) {
    console.log(error)
    // Clean up uploaded files if update fails
    if (req.files) {
      if (req.files.company_logo) {
        req.files.company_logo.forEach(file => deleteFile(file.path))
      }
      if (req.files.contract) {
        req.files.contract.forEach(file => deleteFile(file.path))
      }
      if (req.files.license) {
        req.files.license.forEach(file => deleteFile(file.path))
      }
    }
    res.status(500).json({ message: 'Error updating Vessel Owner, please try again later' })
  }
}

exports.undeleteById = async (req, res) => {
  try {
    const { id } = req.params
    const unDeleted = await VesselOwner.findByIdAndUpdate(id, { isDeleted: false }, { new: true })
    res.status(200).json(unDeleted)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error restoring Vessel Owner, please try again later' })
  }
}

exports.deleteById = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await VesselOwner.findByIdAndUpdate(id, { isDeleted: true }, { new: true })
    res.status(200).json(deleted)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error deleting Vessel Owner, please try again later' })
  }
}