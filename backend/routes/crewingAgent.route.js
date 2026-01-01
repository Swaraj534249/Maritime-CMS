const express = require("express");
const crewingAgentController = require("../controllers/crewingAgent.controller");
const router = express.Router();

router
  .post("/", crewingAgentController.create)
  .get("/", crewingAgentController.getAll)
  .get("/:id", crewingAgentController.getById)
  .patch("/:id", crewingAgentController.updateById)
  .patch("/undelete/:id", crewingAgentController.undeleteById)
  .delete("/:id", crewingAgentController.deleteById);

module.exports = router;
