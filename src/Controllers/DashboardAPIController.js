// Src/Controllers/DashboardAPIController.js
const DashboardAPIService = require("../Services/DashboardAPIService");

class DashboardAPIController {
  static sendSuccess = (res, data, message = "Success") => {
    return res.status(200).json({
      success: true,
      error: false,
      statusCode: 300,
      message,
      data,
    });
  };

  static sendError = (res, message, data = {}, status = 200) => {
    return res.status(status).json({
      success: false,
      error: true,
      statusCode: status === 403 ? 403 : 306,
      message,
      data,
    });
  };

  static schoolSummaries = async (req, res) => {
    try {
      const data = await DashboardAPIService.fetchDashboardSummaries(req.user);
      return DashboardAPIController.sendSuccess(res, data, "Summaries Success");
    } catch (error) {
      console.error("V2 school-summaries error:", error);
      return DashboardAPIController.sendError(res, error.message || "Error", {});
    }
  };

  static dashboardFilters = async (req, res) => {
    try {
      const data = await DashboardAPIService.fetchDashboardFilters(req.user);
      return DashboardAPIController.sendSuccess(res, data);
    } catch (error) {
      console.error("V2 dashboard-filters error:", error);
      return DashboardAPIController.sendError(
        res,
        error.message || "Error",
        { categories: [], ownerships: [], regions: [] },
      );
    }
  };

  static mapData = async (req, res) => {
    try {
      const requestData = {
        ...(req.query || {}),
        ...(req.body || {}),
      };
      const payload = { user: req.user, body: requestData };
      const data = await DashboardAPIService.fetchMapData(payload);
      return DashboardAPIController.sendSuccess(res, data);
    } catch (error) {
      console.error("V2 map-data error:", error);
      return DashboardAPIController.sendError(res, error.message || "Error", []);
    }
  };

  static updateMarker = async (req, res) => {
    const hasPermission = Array.isArray(req.user?.userPermissions)
      && req.user.userPermissions.includes("update-school-marker");

    if (!hasPermission) {
      return DashboardAPIController.sendError(res, "403 Forbidden", {}, 403);
    }

    try {
      const success = await DashboardAPIService.updateMapMarker(req.body || {});
      if (!success) {
        return DashboardAPIController.sendError(
          res,
          "Error, Please contact Administrator",
          {},
          200,
        );
      }
      return DashboardAPIController.sendSuccess(
        res,
        {},
        "Marker is updated successfully",
      );
    } catch (error) {
      console.error("V2 update-marker error:", error);
      return DashboardAPIController.sendError(
        res,
        error.message || "Error, Please contact Administrator",
      );
    }
  };

  static schoolsSummaryByRegionsAndCategories = async (req, res) => {
    try {
      const { data, minValue, maxValue } =
        await DashboardAPIService.fetchSchoolsSummaryByRegionsAndCategories(req.user);

      return DashboardAPIController.sendSuccess(res, { data, minValue, maxValue });
    } catch (error) {
      console.error("V2 schools-summary-by-regions-and-categories error:", error);
      return DashboardAPIController.sendError(
        res,
        error.message || "Error",
        { data: {}, minValue: 0, maxValue: 0 },
      );
    }
  };

  static numberOfSchoolsByYear = async (req, res) => {
    try {
      const parsedLimit = Number.parseInt(req.query?.limit, 10);
      const parsedOffset = Number.parseInt(req.query?.offset, 10);
      const options = {
        limit: Number.isFinite(parsedLimit) ? parsedLimit : 10,
        offset: Number.isFinite(parsedOffset) ? parsedOffset : 0,
      };

      const data = await DashboardAPIService.fetchNumberOfSchoolByYearOfRegistration(
        req.user,
        options,
      );

      return DashboardAPIController.sendSuccess(res, data);
    } catch (error) {
      console.error("V2 number-of-schools-by-year-of-regitration error:", error);
      return DashboardAPIController.sendError(
        res,
        error.message || "Error",
        {
          individualData: [],
          cumulativeData: [],
          pagination: {
            limit: 10,
            offset: 0,
            totalYears: 0,
            hasOlder: false,
            hasNewer: false,
          },
        },
      );
    }
  };

  static registeredSchoolsByPeriod = async (req, res) => {
    try {
      const parsedLimit = Number.parseInt(req.query?.limit || req.body?.limit, 10);
      const options = {
        period: String(req.query?.period || req.body?.period || "recent").toLowerCase(),
        limit: Number.isFinite(parsedLimit) ? parsedLimit : 10,
      };

      const data = await DashboardAPIService.fetchRegisteredSchoolsByPeriod(
        req.user,
        options,
      );

      return DashboardAPIController.sendSuccess(res, data);
    } catch (error) {
      console.error("V2 registered-schools-by-period error:", error);
      return DashboardAPIController.sendError(
        res,
        error.message || "Error",
        { period: "recent", total: 0, rows: [] },
      );
    }
  };
}

module.exports = DashboardAPIController;
