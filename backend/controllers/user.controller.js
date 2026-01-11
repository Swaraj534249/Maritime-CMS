const User = require("../models/User");

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    let skip = 0;
    let limit = 100;

    if (req.query.user) {
      filter["isDeleted"] = false;
    }

    if (req.query.page && req.query.limit) {
      const pageSize = req.query.limit;
      const page = req.query.page;

      skip = pageSize * (page - 1);
      limit = pageSize;
    }

    const totalDocs = await User.find(filter).countDocuments().exec();
    const results = await User.find(filter).skip(skip).limit(limit).exec();

    res.set("X-Total-Count", totalDocs);

    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error fetching Users, please try again later" });
  }
};
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await User.findById(id)
      .select("-password")
      .populate("agencyId", "name email industryType") // NEW: Include industryType
      .lean();
    
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      message: "Error getting your details, please try again later" 
    });
  }
};

exports.updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Prevent updating critical fields
    delete updates.password;
    delete updates.role;
    delete updates.agencyId;
    delete updates.industryType; // NEW: Prevent manual industryType changes
    delete updates.createdBy;
    delete updates._id;
    delete updates.email;
    
    const updated = await User.findByIdAndUpdate(
      id, 
      { $set: updates }, 
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("agencyId", "name email industryType") // NEW: Include industryType
      .lean();
    
    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json(updated);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error getting your details, please try again later" });
  }
};
