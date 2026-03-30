const ReligionAPIService = require("../Services/ReligionAPIService");

const respond = (res, payload = {}) => {
  const httpStatus = Number(payload?.httpStatus || 200);
  const body = { ...payload };
  delete body.httpStatus;
  return res.status(httpStatus).send(body);
};

class ReligionAPIController {
  static async getReligions(req, res) {
    try {
      return respond(res, await ReligionAPIService.getReligions(req));
    } catch (error) {
      console.error("ReligionAPIController.getReligions", error);
      return respond(res, {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        message: "Internal server error.",
      });
    }
  }

  static async getReligionById(req, res) {
    try {
      return respond(res, await ReligionAPIService.getReligionById(req));
    } catch (error) {
      console.error("ReligionAPIController.getReligionById", error);
      return respond(res, {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        message: "Internal server error.",
      });
    }
  }

  static async createReligion(req, res) {
    try {
      return respond(res, await ReligionAPIService.createReligion(req));
    } catch (error) {
      console.error("ReligionAPIController.createReligion", error);
      return respond(res, {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        message: "Internal server error.",
      });
    }
  }

  static async updateReligion(req, res) {
    try {
      return respond(res, await ReligionAPIService.updateReligion(req));
    } catch (error) {
      console.error("ReligionAPIController.updateReligion", error);
      return respond(res, {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        message: "Internal server error.",
      });
    }
  }

  static async deleteReligion(req, res) {
    try {
      return respond(res, await ReligionAPIService.deleteReligion(req));
    } catch (error) {
      console.error("ReligionAPIController.deleteReligion", error);
      return respond(res, {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        message: "Internal server error.",
      });
    }
  }

  static async getSectNamesByReligion(req, res) {
    try {
      return respond(res, await ReligionAPIService.getSectNamesByReligion(req));
    } catch (error) {
      console.error("ReligionAPIController.getSectNamesByReligion", error);
      return respond(res, {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        message: "Internal server error.",
      });
    }
  }

  static async getSectNames(req, res) {
    try {
      return respond(res, await ReligionAPIService.getSectNames(req));
    } catch (error) {
      console.error("ReligionAPIController.getSectNames", error);
      return respond(res, {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        message: "Internal server error.",
      });
    }
  }

  static async getSectNameById(req, res) {
    try {
      return respond(res, await ReligionAPIService.getSectNameById(req));
    } catch (error) {
      console.error("ReligionAPIController.getSectNameById", error);
      return respond(res, {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        message: "Internal server error.",
      });
    }
  }

  static async createSectName(req, res) {
    try {
      return respond(res, await ReligionAPIService.createSectName(req));
    } catch (error) {
      console.error("ReligionAPIController.createSectName", error);
      return respond(res, {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        message: "Internal server error.",
      });
    }
  }

  static async updateSectName(req, res) {
    try {
      return respond(res, await ReligionAPIService.updateSectName(req));
    } catch (error) {
      console.error("ReligionAPIController.updateSectName", error);
      return respond(res, {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        message: "Internal server error.",
      });
    }
  }

  static async deleteSectName(req, res) {
    try {
      return respond(res, await ReligionAPIService.deleteSectName(req));
    } catch (error) {
      console.error("ReligionAPIController.deleteSectName", error);
      return respond(res, {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        message: "Internal server error.",
      });
    }
  }
}

module.exports = ReligionAPIController;

