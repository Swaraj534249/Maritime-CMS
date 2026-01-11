const express = require("express");
const userController = require("../controllers/user.controller");
const { verifyToken } = require("../middleware/VerifyToken");
const router = express.Router();

router.use(verifyToken);

router.get("/", userController.getAll);
router.get("/:id", userController.getById);
router.patch("/:id", userController.updateById);

module.exports = router;
