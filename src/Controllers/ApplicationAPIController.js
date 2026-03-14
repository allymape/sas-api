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

      res.json({
        success: true,
        data: applications,
        application_categories_summary: categorySummary,
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

      res.json({
        success: true,
        data: applications,
        application_categories_summary: categorySummary,
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
}

module.exports = ApplicationController
