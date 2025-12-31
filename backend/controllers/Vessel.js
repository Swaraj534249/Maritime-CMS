const { Schema, default: mongoose } = require("mongoose");
const Vessel = require("../models/Vessel");
const { deleteFile } = require("../middleware/upload");
const { buildListQuery } = require("../utils/ListQueryBuilder");
const { buildListResponse } = require("../utils/ListResponseBuilder");
const VesselOwner = require("../models/VesselOwner");

const processUploadedFiles = (files, existingData = null) => {
  const result = {};

  // Process company logo (single file - just replace)
  if (files.vessel_image && files.vessel_image[0]) {
    const file = files.vessel_image[0];
    result.vessel_image = {
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    };
  }

  // Process vessel_documents document (main/old logic)
  if (files.vessel_documents && files.vessel_documents[0]) {
    const file = files.vessel_documents[0];
    const newFile = {
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    };

    result.vessel_documents = {
      main: newFile,
      old: existingData?.vessel_documents?.main || null, // Current main becomes old
    };
  }

  return result;
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };

    // Handle files if present
    if (req.files) {
      const uploadedFiles = processUploadedFiles(req.files);
      Object.assign(data, uploadedFiles);
    }

    const created = new Vessel(data);
    await created.save();
    res.status(201).json(created);
  } catch (error) {
    console.log(error);
    // Clean up uploaded files if save fails
    if (req.files) {
      if (req.files.vessel_image) {
        req.files.vessel_image.forEach((file) => deleteFile(file.path));
      }
      if (req.files.vessel_documents) {
        req.files.vessel_documents.forEach((file) => deleteFile(file.path));
      }
    }
    return res
      .status(500)
      .json({ message: "Error adding Vessel, please try again later" });
  }
};

exports.getAllLimit = async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.limit || 10);
  const extraFilter = {};

  if (req.query.vesselOwnerId) {
    extraFilter.vesselOwner = req.query.vesselOwnerId;
    vesselOwnerContext = await VesselOwner.findById(
      req.query.vesselOwnerId,
      "company_name company_shortname",
    ).lean();
  }

  const { queryFilter, skip, limit, sort } = buildListQuery({
    Model: Vessel,
    searchValue: req.query.searchValue,
    searchFields: [
      "vesselname",
      "vessel_category",
      "vesseltype",
      "imo_Number",
      "flag",
    ],
    page,
    pageSize,
    sortField: req.query.sortField,
    sortOrder: req.query.sortOrder,
    extraFilter,
  });

  const [data, totalRecords] = await Promise.all([
    Vessel.find(queryFilter).skip(skip).limit(limit).sort(sort).lean(),
    Vessel.countDocuments(queryFilter),
  ]);

  res.json(
    buildListResponse({
      data,
      page,
      pageSize,
      totalRecords,
      searchValue: req.query.searchValue,
      sortField: req.query.sortField,
      sortOrder: req.query.sortOrder,
      aggregates: {},
      context: {
        vesselOwner: vesselOwnerContext
          ? {
              _id: vesselOwnerContext._id,
              name: vesselOwnerContext.company_name,
              shortName: vesselOwnerContext.company_shortname,
            }
          : null,
      },
    }),
  );
};

// Get all Vessels without pagination
exports.getAll = async (req, res) => {
  try {
    const filter = {};

    // Filter by vessel owner if provided
    if (req.query.vesselOwnerId) {
      filter.vesselOwner = req.query.vesselOwnerId;
    }

    const results = await Vessel.find(filter)
      .populate("vesselOwner", "company_name company_shortname")
      .exec();

    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error fetching Vessels, please try again later" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Vessel.findById(id).populate("vesselOwner");
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        message: "Error getting Vessel details, please try again later",
      });
  }
};

exports.getByVesselOwnerId = async (req, res) => {
  try {
    const { id } = req.params;
    const results = await Vessel.find({ vesselOwner: id }).populate(
      "vesselOwner",
    );
    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        message: "Error fetching Vessels by Owner, please try again later",
      });
  }
};

exports.updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    // Get existing record
    const existing = await Vessel.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Vessel not found" });
    }

    // Handle files if present
    if (req.files) {
      const uploadedFiles = processUploadedFiles(req.files, existing);

      // If updating company logo, delete old file
      if (uploadedFiles.vessel_image) {
        if (existing.vessel_image?.path) {
          deleteFile(existing.vessel_image.path);
        }
        data.vessel_image = uploadedFiles.vessel_image;
      }

      // If updating vessel_documents, delete the old file (not the current main)
      if (uploadedFiles.vessel_documents) {
        if (existing.vessel_documents?.old?.path) {
          deleteFile(existing.vessel_documents.old.path);
        }
        data.vessel_documents = uploadedFiles.vessel_documents;
      }
    }
    console.log("data; ", data);

    const updated = await Vessel.findByIdAndUpdate(id, data, {
      new: true,
    }).populate("vesselOwner");
    res.status(200).json(updated);
  } catch (error) {
    console.log(error);
    // Clean up uploaded files if update fails
    if (req.files) {
      if (req.files.vessel_image) {
        req.files.vessel_image.forEach((file) => deleteFile(file.path));
      }
      if (req.files.vessel_documents) {
        req.files.vessel_documents.forEach((file) => deleteFile(file.path));
      }
    }
    res
      .status(500)
      .json({ message: "Error updating Vessel, please try again later" });
  }
};

exports.undeleteById = async (req, res) => {
  try {
    const { id } = req.params;
    const unDeleted = await Vessel.findByIdAndUpdate(
      id,
      { isDeleted: false },
      { new: true },
    );
    res.status(200).json(unDeleted);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error restoring Vessel, please try again later" });
  }
};

exports.deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Vessel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
    res.status(200).json(deleted);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error deleting Vessel, please try again later" });
  }
};
