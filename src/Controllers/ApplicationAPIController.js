// Src/Controllers/ApplicationController.js
const ApplicationService = require("../Services/ApplicationAPIService");
const { Staff } = require("../Models");

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const resolveActorStaffId = async (user = {}) => {
  const candidates = [
    toPositiveInt(user?.staff_id),
    toPositiveInt(user?.staffId),
    toPositiveInt(user?.id),
  ].filter((value, index, arr) => value > 0 && arr.indexOf(value) === index);

  for (const id of candidates) {
    const exists = await Staff.findOne({
      where: { id },
      attributes: ["id"],
      raw: true,
    });
    if (exists?.id) return Number(exists.id);
  }

  const email = String(user?.email || "").trim().toLowerCase();
  if (email) {
    const byEmail = await Staff.findOne({
      where: { email },
      attributes: ["id"],
      raw: true,
    });
    if (byEmail?.id) return Number(byEmail.id);
  }

  return candidates[0] || 0;
};

class ApplicationController {
  // 1. Get all applications
  static  getAllApplications = async(req, res) => {
    try {
      const [applications, categorySummary] = await Promise.all([
        ApplicationService.fetchAllApplications(req),
        ApplicationService.fetchApplicationCategorySummary(req),
      ]);

      const debugScope = String(req?.query?.debug_scope || "").trim() === "1";
      res.json({
        success: true,
        data: applications,
        application_categories_summary: categorySummary,
        ...(debugScope
          ? {
              debug_scope: {
                user: req?.user || null,
                office: Number.parseInt(req?.user?.office, 10) || null,
                zone_id: req?.user?.zone_id ?? req?.user?.zoneId ?? null,
                district_code: req?.user?.district_code ?? req?.user?.districtCode ?? null,
              },
            }
          : {}),
      });
    } catch (error) {
      const statusCode = Number(error?.statusCode || 500);
      const httpCode = statusCode >= 500 ? statusCode : 200;
      res.status(httpCode).json({ success: false, statusCode, message: error.message });
    }
  }

  // 2. Get applications assigned to logged-in staff (Inbox)
  static  getMyApplications = async(req, res) => {
    try {
      const workTab = String(req?.query?.work_tab || "pending").toLowerCase();
      const [applications, categorySummary] = await Promise.all([
        ApplicationService.fetchMyApplications(req),
        ApplicationService.fetchApplicationCategorySummaryByStaff(req.user, workTab),
      ]);

      const debugLocation = String(req?.query?.debug_location || "").trim() === "1";
      res.json({
        success: true,
        data: applications,
        application_categories_summary: categorySummary,
        ...(debugLocation
          ? {
              debug_location: {
                user: req?.user || null,
                work_tab: workTab,
                applications: Array.isArray(applications?.data)
                  ? applications.data.slice(0, 50).map((row) => ({
                      tracking_number: row?.tracking_number || null,
                      establishing_school_id: row?.establishing_school_id || null,
                      resolved_lga_code: row?.establishing_school?.debug_resolved_lga_code || null,
                    }))
                  : [],
              },
            }
          : {}),
      });
    } catch (error) {
      const statusCode = Number(error?.statusCode || 500);
      const httpCode = statusCode >= 500 ? statusCode : 200;
      res.status(httpCode).json({ success: false, statusCode, message: error.message });
    }
  }

  // 3. Get single application details
  static  getApplicationByTrackingNumber = async(req, res) => {
    try {
      const trackingNumber = req.params.trackingNumber;
      const detailsTimeoutMsRaw = Number.parseInt(process.env.APPLICATION_DETAILS_HARD_TIMEOUT_MS || "12000", 10);
      const detailsTimeoutMs = Number.isFinite(detailsTimeoutMsRaw) && detailsTimeoutMsRaw > 0
        ? detailsTimeoutMsRaw
        : 12000;

      const application = await Promise.race([
        ApplicationService.fetchApplicationDetails(trackingNumber, req.user),
        new Promise((_, reject) => {
          setTimeout(() => {
            const timeoutError = new Error("Application details request timed out.");
            timeoutError.statusCode = 504;
            reject(timeoutError);
          }, detailsTimeoutMs);
        }),
      ]);
      if (!application)
        return res
          .status(404)
          .json({ success: false, message: "Application not found" });
        res.json({ success: true, data: application });
    } catch (error) {
        const statusCode = Number(error?.statusCode || 500);
        const httpCode = statusCode >= 500 ? statusCode : 200;
        res.status(httpCode).json({ success: false, statusCode, message: error.message });
    }
  }

  // 4. Add comment / feedback to application
  static  addComment = async(req, res) => {
    try {
      const trackingNumber = req.params.trackingNumber;
      const staffId = await resolveActorStaffId(req.user);
      const { content } = req.body;
      const comment = await ApplicationService.addComment(
        trackingNumber,
        staffId,
        content,
        req.user,
      );
      res.json({ success: true, data: comment });
    } catch (error) {
      const statusCode = Number(error?.statusCode || 500);
      const httpCode = statusCode >= 500 ? statusCode : 200;
      res.status(httpCode).json({ success: false, statusCode, message: error.message });
    }
  }

  // 5. Advance workflow (approve / reject / send back)
  static  advanceWorkflow = async(req, res) => {
    try {
      const trackingNumber = req.params.trackingNumber;
      const staffId = await resolveActorStaffId(req.user);
      const updatedApplication = await ApplicationService.advanceWorkflow(
        trackingNumber,
        staffId,
        req.body || {},
        req.user,
      );
      res.json({ success: true, data: updatedApplication });
    } catch (error) {
      const statusCode = Number(error?.statusCode || 500);
      const httpCode = statusCode >= 500 ? statusCode : 200;
      res.status(httpCode).json({ success: false, statusCode, message: error.message });
    }
  }

  // 6. Start workflow for submitted application (is_approved = 0) with no application_processes rows
  static startWorkflow = async (req, res) => {
    try {
      const trackingNumber = req.params.trackingNumber;
      const staffId = await resolveActorStaffId(req.user);
      const updatedApplication = await ApplicationService.startWorkflow(
        trackingNumber,
        staffId,
        req.user,
      );
      res.json({ success: true, data: updatedApplication });
    } catch (error) {
      const statusCode = Number(error?.statusCode || 500);
      const httpCode = statusCode >= 500 ? statusCode : 200;
      res.status(httpCode).json({ success: false, statusCode, message: error.message });
    }
  }
}

module.exports = ApplicationController
