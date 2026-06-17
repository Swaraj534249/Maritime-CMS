const express = require("express");
const controller = require("../controllers/documentation.controller");
const { mountStaffAccess } = require("../middleware/routeGuards");

const router = express.Router();

mountStaffAccess(router);

router
  .get("/status-counts", controller.statusCounts)
  .get("/", controller.list)
  .get("/:id", controller.getById)
  .patch("/:id/verify-document", controller.verifyDocument);

module.exports = router;
