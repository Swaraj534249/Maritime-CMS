const express = require("express");
const controller = require("../controllers/proposal.controller");
const { mountStaffAccess } = require("../middleware/routeGuards");

const router = express.Router();

mountStaffAccess(router);

router
  .get("/eligible", controller.eligibleCandidates)
  .get("/status-counts", controller.statusCounts)
  .get("/assignable-agents", controller.assignableAgents)
  .get("/", controller.list)
  .get("/:id", controller.getById)
  .post("/", controller.propose)
  .patch("/:id/checklist", controller.updateChecklist)
  .patch("/:id/select", controller.select)
  .patch("/:id/reject", controller.reject);

module.exports = router;
