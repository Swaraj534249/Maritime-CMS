const express = require("express");
const router = express.Router();
const controller = require("../controllers/agent.controller");
const { authorize, checkAgencyStatus } = require("../middleware/authorization");
const { ADMIN_ROLES } = require("../middleware/routeGuards");
const { autoInjectTenantData } = require("../middleware/autoInjectTenantData");

router.use(authorize(...ADMIN_ROLES));
router.use((req, res, next) => {
  if (req.user.role === "SUPER_ADMIN") return next();
  return checkAgencyStatus(req, res, next);
});

router.use(
  autoInjectTenantData({
    includeAgencyId: true,
    includeCreatedBy: true,
    includeIndustryType: true,
    allowOverride: false,
  }),
);

router.get("/types", controller.getTypes);
router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.patch("/:id", controller.updateById);
router.put("/:id", controller.updateById);
router.patch("/:id/toggle-status", controller.toggleStatus);
router.post("/:id/reset-password", controller.resetPassword);

module.exports = router;
