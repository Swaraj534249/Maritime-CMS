require("dotenv").config();
const jwt = require("jsonwebtoken");

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token || typeof token !== "string" || !token.trim()) {
      return res
        .status(401)
        .json({ message: "Token missing, please login again" });
    }

    const decodedInfo = jwt.verify(token.trim(), process.env.SECRET_KEY);

    if (decodedInfo && decodedInfo._id && decodedInfo.email) {
      req.user = {
        _id: decodedInfo._id,
        email: decodedInfo.email,
        role: decodedInfo.role,
        agencyId: decodedInfo.agencyId || null,
        agencyName: decodedInfo.agencyName || null,
        agencyShortName: decodedInfo.agencyShortName || null,
        agencyEmail: decodedInfo.agencyEmail || null,
        licenseNumber: decodedInfo.licenseNumber || null,
        industryType: decodedInfo.industryType || null,
      };

      return next();
    }

    return res
      .status(401)
      .json({ message: "Invalid Token, please login again" });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .json({ message: "Token expired, please login again" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res
        .status(401)
        .json({ message: "Invalid Token, please login again" });
    }
    console.error("[verifyToken]", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
