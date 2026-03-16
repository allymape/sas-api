const SchoolAPIService = require("../Services/SchoolAPIService");

class SchoolAPIController {
  static async schoolFilters(req, res) {
    try {
      const data = await SchoolAPIService.fetchSchoolFilters(req);
      return res.send({
        error: false,
        statusCode: 300,
        data,
        message: "School filters.",
      });
    } catch (error) {
      console.error("V2 schoolFilters Error:", error);
      return res.status(500).send({
        error: true,
        statusCode: 500,
        message: "Kuna tatizo la server.",
      });
    }
  }

  static async allSchools(req, res) {
    try {
      return res.send(await SchoolAPIService.fetchAllSchools(req));
    } catch (error) {
      console.error("V2 allSchools Error:", error);
      return res.status(500).send({
        error: true,
        statusCode: 500,
        message: error.message || "Kuna tatizo la server.",
      });
    }
  }

  static async schoolFiles(req, res) {
    try {
      return res.send(await SchoolAPIService.fetchSchoolFiles(req));
    } catch (error) {
      console.error("V2 schoolFiles Error:", error);
      return res.status(500).send({
        error: true,
        statusCode: 500,
        message: error.message || "Kuna tatizo la server.",
      });
    }
  }

  static async lookForSchools(req, res) {
    try {
      return res.send(await SchoolAPIService.lookForSchools(req));
    } catch (error) {
      console.error("V2 lookForSchools Error:", error);
      return res.status(500).send({
        error: true,
        statusCode: 500,
        message: error.message || "Kuna tatizo la server.",
      });
    }
  }

  static async editSchool(req, res) {
    try {
      return res.send(
        await SchoolAPIService.findSchoolByTrackingNumber(req.params.id),
      );
    } catch (error) {
      console.error("V2 editSchool Error:", error);
      return res.status(500).send({
        error: true,
        statusCode: 500,
        message: error.message || "Kuna tatizo la server.",
      });
    }
  }

  static async updateSchool(req, res) {
    try {
      return res.send(await SchoolAPIService.updateSchool(req));
    } catch (error) {
      console.error("V2 updateSchool Error:", error);
      return res.status(500).send({
        error: true,
        statusCode: 500,
        message: error.message || "Kuna tatizo la server.",
      });
    }
  }

  static async updateSchoolFileNumber(req, res) {
    try {
      return res.send(await SchoolAPIService.updateSchoolFileNumber(req));
    } catch (error) {
      console.error("V2 updateSchoolFileNumber Error:", error);
      return res.status(500).send({
        error: true,
        statusCode: 500,
        message: error.message || "Kuna tatizo la server.",
      });
    }
  }

  static async missingSchoolFileNumbersCount(req, res) {
    try {
      return res.send(await SchoolAPIService.fetchMissingSchoolFileNumbersCount(req));
    } catch (error) {
      console.error("V2 missingSchoolFileNumbersCount Error:", error);
      return res.status(500).send({
        error: true,
        statusCode: 500,
        message: error.message || "Kuna tatizo la server.",
      });
    }
  }

  static async generateMissingSchoolFileNumbers(req, res) {
    try {
      return res.send(await SchoolAPIService.generateMissingSchoolFileNumbers(req));
    } catch (error) {
      console.error("V2 generateMissingSchoolFileNumbers Error:", error);
      return res.status(500).send({
        error: true,
        statusCode: 500,
        message: error.message || "Kuna tatizo la server.",
      });
    }
  }
}

module.exports = SchoolAPIController;
