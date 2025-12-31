const { Schema, default: mongoose } = require("mongoose");
const VesselOwner = require("../models/VesselOwner");
const Vessel = require("../models/Vessel");
const { deleteFile } = require("../middleware/upload");
const { buildListQuery } = require("../utils/ListQueryBuilder");
const { buildListResponse } = require("../utils/ListResponseBuilder");

// Helper function to process uploaded files with main/old logic
const processUploadedFiles = (files, existingData = null) => {
  const result = {};

  // Process company logo (single file - just replace)
  if (files.company_logo && files.company_logo[0]) {
    const file = files.company_logo[0];
    result.company_logo = {
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    };
  }

  // Process contract document (main/old logic)
  if (files.contract && files.contract[0]) {
    const file = files.contract[0];
    const newFile = {
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    };

    result.contract = {
      main: newFile,
      old: existingData?.contract?.main || null,
    };
  }

  // Process license document (main/old logic)
  if (files.license && files.license[0]) {
    const file = files.license[0];
    const newFile = {
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    };

    result.license = {
      main: newFile,
      old: existingData?.license?.main || null,
    };
  }

  return result;
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.files) {
      const uploadedFiles = processUploadedFiles(req.files);
      Object.assign(data, uploadedFiles);
    }

    const created = new VesselOwner(data);
    await created.save();
    res.status(201).json(created);
  } catch (error) {
    console.log(error);
    if (req.files) {
      if (req.files.company_logo) {
        req.files.company_logo.forEach((file) => deleteFile(file.path));
      }
      if (req.files.contract) {
        req.files.contract.forEach((file) => deleteFile(file.path));
      }
      if (req.files.license) {
        req.files.license.forEach((file) => deleteFile(file.path));
      }
    }
    return res
      .status(500)
      .json({
        message: "Error adding Vessel Owner, please trying again later",
      });
  }
};

exports.getAllLimit = async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.limit || 10);

  const { queryFilter, skip, limit, sort } = buildListQuery({
    Model: VesselOwner,
    searchValue: req.query.searchValue,
    searchFields: [
      "company_name",
      "company_shortname",
      "contactperson",
      "email",
      "phoneno",
      "address",
      "crewing_department1",
      "crewing_department11",
    ],
    page,
    pageSize,
    sortField: req.query.sortField,
    sortOrder: req.query.sortOrder,
  });

  const [data, totalRecords] = await Promise.all([
    VesselOwner.find(queryFilter).skip(skip).limit(limit).sort(sort).lean(),
    VesselOwner.countDocuments(queryFilter),
  ]);

  const ownerIds = data.map((o) => o._id);

  const vesselCounts = await Vessel.aggregate([
    { $match: { vesselOwner: { $in: ownerIds } } },
    { $group: { _id: "$vesselOwner", count: { $sum: 1 } } },
  ]);

  const vesselCountByOwner = {};
  vesselCounts.forEach((v) => {
    if (v._id) {
      vesselCountByOwner[v._id.toString()] = v.count;
    }
  });

  res.json(
    buildListResponse({
      data,
      page,
      pageSize,
      totalRecords,
      searchValue: req.query.searchValue,
      sortField: req.query.sortField,
      sortOrder: req.query.sortOrder,
      aggregates: {
        vesselCountByOwner,
      },
    }),
  );
};

// Get all Vessel Owners without pagination (unchanged)
exports.getAll = async (req, res) => {
  try {
    const filter = {};

    if (req.query.user) {
      filter["isDeleted"] = false;
    }

    const results = await VesselOwner.find(filter).exec();
    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        message: "Error fetching Vessel Owners, please try again later",
      });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await VesselOwner.findById(id);

    if (!result) {
      return res.status(404).json({ message: "Vessel Owner not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        message: "Error getting Vessel Owner details, please try again later",
      });
  }
};

exports.updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    const existing = await VesselOwner.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Vessel Owner not found" });
    }

    if (req.files) {
      const uploadedFiles = processUploadedFiles(req.files, existing);

      if (uploadedFiles.company_logo) {
        if (existing.company_logo?.path) {
          deleteFile(existing.company_logo.path);
        }
        data.company_logo = uploadedFiles.company_logo;
      }

      if (uploadedFiles.contract) {
        if (existing.contract?.old?.path) {
          deleteFile(existing.contract.old.path);
        }
        data.contract = uploadedFiles.contract;
      }

      if (uploadedFiles.license) {
        if (existing.license?.old?.path) {
          deleteFile(existing.license.old.path);
        }
        data.license = uploadedFiles.license;
      }
    }

    const updated = await VesselOwner.findByIdAndUpdate(id, data, {
      new: true,
    });
    res.status(200).json(updated);
  } catch (error) {
    console.log(error);
    if (req.files) {
      if (req.files.company_logo) {
        req.files.company_logo.forEach((file) => deleteFile(file.path));
      }
      if (req.files.contract) {
        req.files.contract.forEach((file) => deleteFile(file.path));
      }
      if (req.files.license) {
        req.files.license.forEach((file) => deleteFile(file.path));
      }
    }
    res
      .status(500)
      .json({ message: "Error updating Vessel Owner, please try again later" });
  }
};

exports.undeleteById = async (req, res) => {
  try {
    const { id } = req.params;
    const unDeleted = await VesselOwner.findByIdAndUpdate(
      id,
      { isDeleted: false },
      { new: true },
    );

    if (!unDeleted) {
      return res.status(404).json({ message: "Vessel Owner not found" });
    }

    res.status(200).json(unDeleted);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        message: "Error restoring Vessel Owner, please try again later",
      });
  }
};

exports.deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await VesselOwner.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );

    if (!deleted) {
      return res.status(404).json({ message: "Vessel Owner not found" });
    }

    res.status(200).json(deleted);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error deleting Vessel Owner, please try again later" });
  }
};
