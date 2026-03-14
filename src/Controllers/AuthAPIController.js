const AuthAPIService = require("../Services/AuthAPIService");

class AuthAPIController {
  static async login(req, res) {
    try {
      const result = await AuthAPIService.login(req.body);
      return res.send(result);
    } catch (error) {
      console.error("V2 Login Error:", error);
      return res.status(500).send({
        error: true,
        statusCode: 500,
        message: "Kuna tatizo la server. Tafadhali jaribu tena baadaye.",
      });
    }
  }

  static async logout(req, res) {
    try {
      const result = await AuthAPIService.logout();
      return res.send(result);
    } catch (error) {
      console.error("V2 Logout Error:", error);
      return res.status(500).send({
        error: true,
        statusCode: 500,
        message: "Kuna tatizo la server. Tafadhali jaribu tena baadaye.",
      });
    }
  }
}

module.exports = AuthAPIController;
