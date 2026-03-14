const UserAPIService = require("../Services/UserAPIService");

class UserAPIController {
  static async getUsers(req, res) {
    try {
      return res.send(await UserAPIService.getUsers(req));
    } catch (error) {
      console.error("V2 getUsers Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }

  static async findUser(req, res) {
    try {
      return res.send(await UserAPIService.findUser(req));
    } catch (error) {
      console.error("V2 findUser Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }

  static async createUser(req, res) {
    try {
      return res.send(await UserAPIService.createUser(req));
    } catch (error) {
      console.error("V2 createUser Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }

  static async updateUser(req, res) {
    try {
      return res.send(await UserAPIService.updateUser(req));
    } catch (error) {
      console.error("V2 updateUser Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }

  static async activateDeactivateUser(req, res) {
    try {
      return res.send(await UserAPIService.activateDeactivateUser(req));
    } catch (error) {
      console.error("V2 activateDeactivateUser Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }

  static async myProfile(req, res) {
    try {
      return res.send(await UserAPIService.myProfile(req));
    } catch (error) {
      console.error("V2 myProfile Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }

  static async updateMyProfile(req, res) {
    try {
      return res.send(await UserAPIService.updateMyProfile(req));
    } catch (error) {
      console.error("V2 updateMyProfile Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }

  static async changeMyPassword(req, res) {
    try {
      return res.send(await UserAPIService.changeMyPassword(req));
    } catch (error) {
      console.error("V2 changeMyPassword Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }

  static async resetUserPassword(req, res) {
    try {
      return res.send(await UserAPIService.resetUserPassword(req));
    } catch (error) {
      console.error("V2 resetUserPassword Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }

  static async refreshToken(req, res) {
    try {
      return res.send(await UserAPIService.refreshToken(req));
    } catch (error) {
      console.error("V2 refreshToken Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }

  static async lookupRoles(req, res) {
    try {
      return res.send(await UserAPIService.lookupRoles(req));
    } catch (error) {
      console.error("V2 lookupRoles Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }

  static async lookupRanks(req, res) {
    try {
      return res.send(await UserAPIService.lookupRanks(req));
    } catch (error) {
      console.error("V2 lookupRanks Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }

  static async lookupHierarchiesByRanks(req, res) {
    try {
      return res.send(await UserAPIService.lookupHierarchiesByRanks(req));
    } catch (error) {
      console.error("V2 lookupHierarchiesByRanks Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }

  static async lookupZones(req, res) {
    try {
      return res.send(await UserAPIService.lookupZones(req));
    } catch (error) {
      console.error("V2 lookupZones Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }

  static async lookupDesignationsBySection(req, res) {
    try {
      return res.send(await UserAPIService.lookupDesignationsBySection(req));
    } catch (error) {
      console.error("V2 lookupDesignationsBySection Error:", error);
      return res.status(500).send({ error: true, statusCode: 500, message: "Kuna tatizo la server." });
    }
  }
}

module.exports = UserAPIController;
