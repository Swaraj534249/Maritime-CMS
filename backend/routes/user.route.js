const express = require("express");
const userController = require("../controllers/user.controller");
const router = express.Router();

router
  .get("/", userController.getAll)
  .get("/:id", userController.getById)
  .patch("/:id", userController.updateById);

module.exports = router;
