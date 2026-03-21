// Src/Controllers/ApplicationController.js
const ApplicationService = require("../Services/ApplicationAPIService");

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
      res.status(500).json({ success: false, message: error.message });
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
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 3. Get single application details
  static  getApplicationByTrackingNumber = async(req, res) => {
    try {
      const trackingNumber = req.params.trackingNumber;
      const application = await ApplicationService.fetchApplicationDetails(trackingNumber, req.user);
      if (!application)
        return res
          .status(404)
          .json({ success: false, message: "Application not found" });
        res.json({ success: true, data: application });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
  }

  // 4. Add comment / feedback to application
  static  addComment = async(req, res) => {
    try {
      const trackingNumber = req.params.trackingNumber;
      const staffId = req.user.id;
      const { content } = req.body;
      const comment = await ApplicationService.addComment(
        trackingNumber,
        staffId,
        content,
        req.user,
      );
      res.json({ success: true, data: comment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 5. Advance workflow (approve / reject / send back)
  static  advanceWorkflow = async(req, res) => {
    try {
      const trackingNumber = req.params.trackingNumber;
      const staffId = req.user.id;
      const updatedApplication = await ApplicationService.advanceWorkflow(
        trackingNumber,
        staffId,
        req.body || {},
        req.user,
      );
      res.json({ success: true, data: updatedApplication });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 6. Start workflow for submitted application (is_approved = 0) with no application_processes rows
  static startWorkflow = async (req, res) => {
    try {
      const trackingNumber = req.params.trackingNumber;
      const staffId = req.user.id;
      const updatedApplication = await ApplicationService.startWorkflow(
        trackingNumber,
        staffId,
        req.user,
      );
      res.json({ success: true, data: updatedApplication });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = ApplicationController
