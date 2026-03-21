const express = require("express");

const router = express.Router();

// Transitional compatibility layer:
// expose legacy routers under /api/v2 while the internals are migrated into src/.
router.use("/", require("../../routers/handoverRouter"));
router.use("/", require("../../routers/notificationRouter"));
router.use("/", require("../../routers/zoneRouter"));
router.use("/", require("../../routers/regionRouter"));
router.use("/", require("../../routers/districtRouter"));
router.use("/", require("../../routers/wardRouter"));
router.use("/", require("../../routers/streetRouter"));
router.use("/", require("../../routers/workflowRouter"));
router.use("/", require("../../routers/actionTypeRouter"));
router.use("/", require("../../routers/trackApplicationRouter"));
router.use("/", require("../../routers/hierarchyRouter"));
router.use("/", require("../../routers/designationRouter"));
router.use("/", require("../../routers/roleRouter"));
router.use("/", require("../../routers/rankRouter"));
router.use("/", require("../../routers/permissionRouter"));
router.use("/", require("../../routers/algorithmRouter"));
router.use("/", require("../../routers/applicationCategoryRouter"));
router.use("/", require("../../routers/schoolCategoryRouter"));
router.use("/", require("../../routers/schoolSubCategoryRouter"));
router.use("/", require("../../routers/schoolFileNumberMappingRouter"));
router.use("/", require("../../routers/systemLogRouter"));
router.use("/", require("../../routers/aiSupportRouter"));
router.use("/", require("../../routers/subjectRouter"));
router.use("/", require("../../routers/combinationSubjectRouter"));
router.use("/", require("../../routers/curriculumRouter"));
router.use("/", require("../../routers/ripoti/ripotiKuanzishaRequestRouter"));
router.use("/", require("../../routers/ripoti/ripotiWamilikiRequestRouter"));
router.use("/", require("../../routers/ripoti/ripotiMenejaRequestRouter"));
router.use("/", require("../../routers/ripoti/ripotiUsajiliRequestRouter"));
router.use("/", require("../../routers/ripoti/ripotiMikondoChangeRequestRouter"));
router.use("/", require("../../routers/ripoti/ripotiUhamishoChangeRequestRouter"));
router.use("/", require("../../routers/ripoti/ripotiWamilikiChangeRequestRouter"));
router.use("/", require("../../routers/ripoti/ripotiMenejaChangeRequestRouter"));
router.use("/", require("../../routers/ripoti/ripotiJinaChangeRequestRouter"));
router.use("/", require("../../routers/ripoti/ripotiKufutaChangeRequestRouter"));
router.use("/", require("../../routers/ripoti/ripotiTahasusiChangeRequestRouter"));
router.use("/", require("../../routers/ripoti/ripotiBweniChangeRequestRouter"));
router.use("/", require("../../routers/ripoti/ripotiUsajiliChangeRequestRouter"));
router.use("/", require("../../routers/ripoti/ripotiDahaliaChangeRequestRouter"));

module.exports = router;
