const express = require("express");
const controller = require("../controllers/sailing.controller");
const { mountStaffAccess } = require("../middleware/routeGuards");

const router = express.Router();

mountStaffAccess(router);

router
  .get("/status-counts", controller.statusCounts)
  .get("/", controller.list)
  .post("/", controller.finalize)
  .patch("/:id/sign-off", controller.signOff);

module.exports = router;
