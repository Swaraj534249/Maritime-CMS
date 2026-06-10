const express = require("express");
const controller = require("../controllers/vacancy.controller");
const { mountStaffAccess } = require("../middleware/routeGuards");

const router = express.Router();

mountStaffAccess(router);

router
  .post("/", controller.create)
  .get("/", controller.list)
  .get("/status-counts", controller.statusCounts)
  .get("/:id", controller.getById)
  .patch("/:id", controller.updateById)
  .patch("/:id/close", controller.closeById);

module.exports = router;
