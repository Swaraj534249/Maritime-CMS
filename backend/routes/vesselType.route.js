const express = require("express");
const controller = require("../controllers/vesselType.controller");
const { mountStaffAccess } = require("../middleware/routeGuards");

const router = express.Router();

mountStaffAccess(router);

router
  .post("/", controller.create)
  .get("/", controller.list)
  .patch("/:id", controller.updateById)
  .patch("/:id/toggle-status", controller.toggleStatus);

module.exports = router;
