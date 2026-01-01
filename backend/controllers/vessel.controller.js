const { Schema, default: mongoose } = require("mongoose");
const Vessel = require("../models/Vessel");
const { deleteFile } = require("../middleware/upload");
const { buildListQuery } = require("../utils/ListQueryBuilder");
const { buildListResponse } = require("../utils/ListResponseBuilder");
const VesselOwner = require("../models/VesselOwner");

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.files) {
      Object.assign(data, processUploadedFiles(req.files));
    }

    const created = new Vessel(data);
    await created.save();
    res.status(201).json(created);
  } catch (error) {
    console.log(error);
    cleanupFiles(req.files);
    return res
      .status(500)
      .json({ message: "Error adding Vessel, please try again later" });
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
let vesselOwnerContext = null;

  if (req.query.vesselOwnerId) {
    extraFilter.vesselOwner = req.query.vesselOwnerId;
    const owner = await VesselOwner.findById(
      req.query.vesselOwnerId,
      "company_name company_shortname",
    ).lean();
if(owner){
  vesselOwnerContext =  {
            _id: owner._id,
            name: owner.company_name,
            shortName: owner.company_shortname,
          }
}
  }

  const { queryFilter, skip, sort } = buildListQuery({
    Model: Vessel,
    searchValue,
    searchFields: [
      "vesselname",
      "vessel_category",
      "vesseltype",
      "imo_Number",
      "flag",
    ],
    page:pageNumber,
    pageSize: pageSizeNumber,
    sortField,
    sortOrder,
    extraFilter,
  });

  if (all === "true") {
      const data = await Vessel.find(queryFilter)
        .sort(sort)
        .populate("vesselOwner", "company_name company_shortname")
        .lean();
      return res.json(data);
    }

  const [data, totalRecords] = await Promise.all([
    Vessel.find(queryFilter).skip(skip).limit(pageSizeNumber).sort(sort).populate("vesselOwner", "company_name company_shortname").lean(),
    Vessel.countDocuments(queryFilter),
  ]);

  res.json(
    buildListResponse({
      data,
      page:pageNumber,
    pageSize: pageSizeNumber,
      totalRecords,
      searchValue,
      sortField,
      sortOrder,
      aggregates: {},
      context: {
        vesselOwner: vesselOwnerContext || null,
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
    const result = await Vessel.findById(id).populate("vesselOwner", "company_name company_shortname");
    if (!result) {
      return res.status(404).json({ message: "Vessel Owner not found" });
    }
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

exports.updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    const existing = await Vessel.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Vessel not found" });
    }

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

    const updated = await Vessel.findByIdAndUpdate(id, data, {
      new: true,
    }).populate("vesselOwner");
    res.status(200).json(updated);
  } catch (error) {
    console.log(error);
    // Clean up uploaded files if update fails
   cleanupFiles(req.files);
    res
      .status(500)
      .json({ message: "Error updating Vessel, please try again later" });
  }
};

exports.toggleStatus = async (req, res) => {
  const vessel = await Vessel.findById(req.params.id);

  if (!vessel) {
    return res.status(404).json({ message: "Vessel not found" });
  }

  vessel.isDeleted = !vessel.isDeleted;
  await vessel.save();

  res.json(vessel);
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

  if (files.vessel_image && files.vessel_image[0]) {
    result.vessel_image = mapFile(files.vessel_image[0]);
  }

  if (files.vessel_documents && files.vessel_documents[0]) {
    result.vessel_documents = {
      main: mapFile(files.vessel_documents[0]),
      old: existingData?.vessel_documents?.main || null,
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