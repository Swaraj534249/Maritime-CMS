const { Schema, default: mongoose } = require("mongoose");
// const csvParser = require("csv-parser");
// const fs = require("fs");
// const { Parser } = require("json2csv");
const VesselOwner = require("../models/VesselOwner");
const Vessel = require("../models/Vessel");
const { deleteFile } = require("../middleware/upload");
const { buildListQuery } = require("../utils/ListQueryBuilder");
const { buildListResponse } = require("../utils/ListResponseBuilder");

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.files) {
      Object.assign(data, processUploadedFiles(req.files));
    }

    const created = new VesselOwner(data);
    await created.save();
    res.status(201).json(created);
  } catch (error) {
    console.log(error);
    cleanupFiles(req.files);
    return res
      .status(500)
      .json({
        message: "Error adding Vessel Owner, please trying again later",
      });
  }
};

exports.list = async (req, res) => {
  try {
    const {
      page,
      limit,
      searchValue,
      sortField,
      sortOrder,
      all,
      isDeleted,
    } = req.query;

    const pageNumber = Number(page || 1);
    const pageSizeNumber = Number(limit || 10);
    
    const extraFilter =
      isDeleted === "true"
        ? { isDeleted: true }
        : {
            $or: [
              { isDeleted: false },
              { isDeleted: { $exists: false } },
            ],
          };

  const { queryFilter, skip, sort } = buildListQuery({
    Model: VesselOwner,
    searchValue,
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
    page:pageNumber,
    pageSize: pageSizeNumber,
      sortField,
      sortOrder,
      extraFilter,
  });

   if (all === "true") {
      const data = await VesselOwner.find(queryFilter).sort(sort).lean();
      return res.json(data);
    }

  const [data, totalRecords] = await Promise.all([
    VesselOwner.find(queryFilter).skip(skip).limit(pageSizeNumber).sort(sort).lean(),
    VesselOwner.countDocuments(queryFilter),
  ]);

  const ownerIds = data.map((o) => o._id);
  const vesselCounts = await Vessel.aggregate([
    { $match: {
      vesselOwner: { $in: ownerIds },
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } },
      ],
    }, },
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
      page:pageNumber,
    pageSize: pageSizeNumber,
      totalRecords,
      searchValue,
      sortField,
      sortOrder,
      aggregates: {
        vesselCountByOwner,
      },
    }),
  );
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch vessel owners" });
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
    cleanupFiles(req.files);
    res
      .status(500)
      .json({ message: "Error updating Vessel Owner, please try again later" });
  }
};

exports.toggleStatus = async (req, res) => {
  const status = await VesselOwner.findById(req.params.id);

  if (!status) {
    return res.status(404).json({ message: "Vessel Owner not found" });
  }

  status.isDeleted = !status.isDeleted;
  await status.save();

  res.json(status);
};

// exports.bulkImport = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "CSV file required" });
//     }

//     const rows = [];

//     fs.createReadStream(req.file.path)
//       .pipe(csvParser())
//       .on("data", (row) => {
//         rows.push({
//           company_name: row.company_name?.trim(),
//           company_shortname: row.company_shortname?.trim(),
//           email: row.email?.trim(),
//           phoneno: row.phoneno?.trim(),
//         });
//       })
//       .on("end", async () => {
//         await VesselOwner.insertMany(rows, { ordered: false });
//         deleteFile(req.file.path);

//         res.json({
//           message: "Bulk import completed",
//           inserted: rows.length,
//         });
//       });
//   } catch (error) {
//     cleanupFiles({ csv: [req.file] });
//     res.status(500).json({ message: "Bulk import failed" });
//   }
// };

// exports.exportList = async (req, res) => {
//   try {
//     const data = await VesselOwner.find({ isDeleted: false }).lean();

//     const fields = [
//       "company_name",
//       "company_shortname",
//       "email",
//       "phoneno",
//     ];

//     const parser = new Parser({ fields });
//     const csv = parser.parse(data);

//     res.header("Content-Type", "text/csv");
//     res.attachment("vessel-owners.csv");
//     return res.send(csv);
//   } catch (error) {
//     res.status(500).json({ message: "Export failed" });
//   }
// };

/**
 * BULK IMPORT (CSV/Excel)
 */
exports.bulkImport = async (req, res) => {
  // placeholder – implemented once, reused everywhere
  res.json({ message: "Bulk import coming soon" });
};

/**
 * EXPORT
 */
exports.exportList = async (req, res) => {
  // placeholder – CSV/Excel
  res.json({ message: "Export coming soon" });
};

// Helper functions
const processUploadedFiles = (files, existingData = null) => {
  const result = {};

  if (files.company_logo && files.company_logo[0]) {
    result.company_logo = mapFile(files.company_logo[0]);
  }

  if (files.contract && files.contract[0]) {
    result.contract = {
      main: mapFile(files.contract[0]),
      old: existingData?.contract?.main || null,
    };
  }

  if (files.license && files.license[0]) {
    result.license = {
      main: mapFile(files.license[0]),
      old: existingData?.license?.main || null,
    };
  }

  return result;
};

function mapFile(file) {
  return {
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  };
}

function cleanupFiles(files = {}) {
  Object.values(files)
    .flat()
    .forEach(file => deleteFile(file.path));
}