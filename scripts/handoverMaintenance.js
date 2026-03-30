require("dotenv").config();

const HandoverService = require("../src/Services/HandoverService");

(async () => {
  try {
    const result = await HandoverService.runMaintenance();
    console.log("handover maintenance complete", result);
    process.exit(0);
  } catch (error) {
    console.error("handover maintenance failed", error?.message || error);
    process.exit(1);
  }
})();
