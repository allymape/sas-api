const religionModel = require("../../models/religionModel");
const sectNameModel = require("../../models/sectNameModel");

const asPromise = (fn) =>
  new Promise((resolve, reject) => {
    try {
      fn((...args) => resolve(args));
    } catch (error) {
      reject(error);
    }
  });

const parsePagination = (req) => {
  const perPage = Math.max(
    1,
    Number.parseInt(req.query.per_page || req.body?.per_page || "10", 10) ||
      10,
  );
  const page = Math.max(
    1,
    Number.parseInt(req.query.page || req.body?.page || "1", 10) || 1,
  );
  const offset = (page - 1) * perPage;
  const isPaginated =
    req.query.is_paginated !== undefined
      ? !["false", "0"].includes(String(req.query.is_paginated).toLowerCase())
      : req.body?.is_paginated !== undefined
        ? !["false", "0"].includes(String(req.body.is_paginated).toLowerCase())
        : true;

  return { perPage, page, offset, isPaginated };
};

const sanitizeStatus = (status) => {
  const value = String(status || "")
    .trim()
    .toLowerCase();
  if (!value) return "active";
  return value;
};

class ReligionAPIService {
  static async getReligions(req) {
    const { perPage, page, offset, isPaginated } = parsePagination(req);
    const search = req.query.search || req.query.q || req.body?.search || "";
    const status = req.query.status || req.body?.status || "";

    const [error, rows, numRows] = await asPromise((cb) =>
      religionModel.getAllReligions(
        offset,
        perPage,
        isPaginated,
        { search, status },
        (modelError, data, total) => cb(modelError, data || [], total || 0),
      ),
    );

    return {
      httpStatus: error ? 500 : 200,
      error: Boolean(error),
      statusCode: error ? 500 : 300,
      data: error ? [] : rows,
      numRows: Number(numRows || 0),
      current_page: page,
      per_page: perPage,
      last_page: Math.ceil(Number(numRows || 0) / perPage) || 1,
      message: error ? "Failed to fetch religions." : "List of religions.",
    };
  }

  static async getReligionById(req) {
    const id = Number.parseInt(req.params.id, 10) || 0;
    if (id <= 0) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "Invalid religion id.",
      };
    }

    const [error, success, row] = await asPromise((cb) =>
      religionModel.findReligionById(id, (modelError, found, data) =>
        cb(modelError, found, data || null),
      ),
    );

    if (error) {
      return {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        data: null,
        message: "Failed to fetch religion.",
      };
    }

    if (!success) {
      return {
        httpStatus: 404,
        statusCode: 404,
        error: true,
        data: null,
        message: "Religion not found.",
      };
    }

    return {
      httpStatus: 200,
      statusCode: 300,
      error: false,
      data: row,
      message: "Religion found.",
    };
  }

  static async createReligion(req) {
    const name = String(req.body?.name || "").trim();
    const code = String(req.body?.code || "").trim() || null;
    const status = sanitizeStatus(req.body?.status);

    if (!name) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "name is required.",
      };
    }

    if (!["active", "inactive"].includes(status)) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "status must be active or inactive.",
      };
    }

    const [error, success, result, duplicateField] = await asPromise((cb) =>
      religionModel.createReligion(
        { name, code, status },
        (modelError, ok, dbResult, field) =>
          cb(modelError, ok, dbResult || null, field || null),
      ),
    );

    if (error) {
      return {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        data: null,
        message: "Failed to create religion.",
      };
    }

    if (!success && duplicateField === "name") {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "name already exists.",
      };
    }

    if (!success && duplicateField === "code") {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "code already exists.",
      };
    }

    return {
      httpStatus: 201,
      statusCode: 300,
      error: false,
      data: {
        id: result?.insertId || null,
      },
      message: "Religion created successfully.",
    };
  }

  static async updateReligion(req) {
    const id = Number.parseInt(req.params.id, 10) || 0;
    const name = String(req.body?.name || "").trim();
    const code = String(req.body?.code || "").trim() || null;
    const status = sanitizeStatus(req.body?.status);

    if (id <= 0) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "Invalid religion id.",
      };
    }

    if (!name) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "name is required.",
      };
    }

    if (!["active", "inactive"].includes(status)) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "status must be active or inactive.",
      };
    }

    const [error, success, result, duplicateField, notFound] = await asPromise(
      (cb) =>
        religionModel.updateReligion(
          id,
          { name, code, status },
          (modelError, ok, dbResult, field, missing) =>
            cb(
              modelError,
              ok,
              dbResult || null,
              field || null,
              Boolean(missing),
            ),
        ),
    );

    if (error) {
      return {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        data: null,
        message: "Failed to update religion.",
      };
    }

    if (notFound) {
      return {
        httpStatus: 404,
        statusCode: 404,
        error: true,
        data: null,
        message: "Religion not found.",
      };
    }

    if (!success && duplicateField === "name") {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "name already exists.",
      };
    }

    if (!success && duplicateField === "code") {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "code already exists.",
      };
    }

    return {
      httpStatus: 200,
      statusCode: 300,
      error: false,
      data: {
        affectedRows: result?.affectedRows || 0,
      },
      message: "Religion updated successfully.",
    };
  }

  static async deleteReligion(req) {
    const id = Number.parseInt(req.params.id, 10) || 0;
    if (id <= 0) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "Invalid religion id.",
      };
    }

    const [error, success, result, sectCount, hasReferences, notFound] =
      await asPromise((cb) =>
        religionModel.deleteReligion(
          id,
          (modelError, ok, dbResult, count, referenced, missing = false) =>
            cb(
              modelError,
              ok,
              dbResult || null,
              Number(count || 0),
              Boolean(referenced),
              Boolean(missing),
            ),
        ),
      );

    if (error) {
      return {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        data: null,
        message: "Failed to delete religion.",
      };
    }

    if (notFound) {
      return {
        httpStatus: 404,
        statusCode: 404,
        error: true,
        data: null,
        message: "Religion not found.",
      };
    }

    if (!success && hasReferences) {
      return {
        httpStatus: 409,
        statusCode: 409,
        error: true,
        data: null,
        message: `Cannot delete religion because it has ${sectCount} sect name(s).`,
      };
    }

    return {
      httpStatus: 200,
      statusCode: 300,
      error: false,
      data: {
        affectedRows: result?.affectedRows || 0,
      },
      message: "Religion deleted successfully.",
    };
  }

  static async getSectNamesByReligion(req) {
    const religionId = Number.parseInt(req.params.id, 10) || 0;
    if (religionId <= 0) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: [],
        message: "Invalid religion id.",
      };
    }

    const [findError, found, religion] = await asPromise((cb) =>
      religionModel.findReligionById(religionId, (error, success, row) =>
        cb(error, success, row || null),
      ),
    );

    if (findError) {
      return {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        data: [],
        message: "Failed to fetch religion.",
      };
    }

    if (!found) {
      return {
        httpStatus: 404,
        statusCode: 404,
        error: true,
        data: [],
        message: "Religion not found.",
      };
    }

    const { perPage, page, offset, isPaginated } = parsePagination(req);
    const search = req.query.search || req.query.q || req.body?.search || "";

    const [error, rows, numRows] = await asPromise((cb) =>
      religionModel.getReligionSectNames(
        religionId,
        offset,
        perPage,
        isPaginated,
        search,
        (modelError, data, total) => cb(modelError, data || [], total || 0),
      ),
    );

    return {
      httpStatus: error ? 500 : 200,
      statusCode: error ? 500 : 300,
      error: Boolean(error),
      religion: error ? null : religion,
      data: error ? [] : rows,
      numRows: Number(numRows || 0),
      current_page: page,
      per_page: perPage,
      last_page: Math.ceil(Number(numRows || 0) / perPage) || 1,
      message: error
        ? "Failed to fetch sect names by religion."
        : "List of sect names by religion.",
    };
  }

  static async getSectNames(req) {
    const { perPage, page, offset, isPaginated } = parsePagination(req);
    const religionId = req.query.religion_id || req.body?.religion_id || null;
    const search = req.query.search || req.query.q || req.body?.search || "";

    const [error, rows, numRows] = await asPromise((cb) =>
      sectNameModel.getAllSectNames(
        offset,
        perPage,
        isPaginated,
        { religion_id: religionId, search },
        (modelError, data, total) => cb(modelError, data || [], total || 0),
      ),
    );

    return {
      httpStatus: error ? 500 : 200,
      statusCode: error ? 500 : 300,
      error: Boolean(error),
      data: error ? [] : rows,
      numRows: Number(numRows || 0),
      current_page: page,
      per_page: perPage,
      last_page: Math.ceil(Number(numRows || 0) / perPage) || 1,
      message: error ? "Failed to fetch sect names." : "List of sect names.",
    };
  }

  static async getSectNameById(req) {
    const id = Number.parseInt(req.params.id, 10) || 0;
    if (id <= 0) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "Invalid sect name id.",
      };
    }

    const [error, success, row] = await asPromise((cb) =>
      sectNameModel.findSectNameById(id, (modelError, found, data) =>
        cb(modelError, found, data || null),
      ),
    );

    if (error) {
      return {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        data: null,
        message: "Failed to fetch sect name.",
      };
    }

    if (!success) {
      return {
        httpStatus: 404,
        statusCode: 404,
        error: true,
        data: null,
        message: "Sect name not found.",
      };
    }

    return {
      httpStatus: 200,
      statusCode: 300,
      error: false,
      data: row,
      message: "Sect name found.",
    };
  }

  static async createSectName(req) {
    const religionId = Number.parseInt(req.body?.religion_id, 10) || 0;
    const word = String(req.body?.word || "").trim();

    if (religionId <= 0) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "religion_id is required and must exist.",
      };
    }

    if (!word) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "word is required.",
      };
    }

    const [error, success, result, reason] = await asPromise((cb) =>
      sectNameModel.createSectName(
        { religion_id: religionId, word },
        (modelError, ok, dbResult, modelReason) =>
          cb(modelError, ok, dbResult || null, modelReason || null),
      ),
    );

    if (error) {
      return {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        data: null,
        message: "Failed to create sect name.",
      };
    }

    if (!success && reason === "religion_not_found") {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "religion_id is required and must exist.",
      };
    }

    if (!success && reason === "duplicate_word") {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "This sect name already exists for the selected religion.",
      };
    }

    return {
      httpStatus: 201,
      statusCode: 300,
      error: false,
      data: {
        id: result?.insertId || null,
      },
      message: "Sect name created successfully.",
    };
  }

  static async updateSectName(req) {
    const id = Number.parseInt(req.params.id, 10) || 0;
    const religionId = Number.parseInt(req.body?.religion_id, 10) || 0;
    const word = String(req.body?.word || "").trim();

    if (id <= 0) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "Invalid sect name id.",
      };
    }

    if (religionId <= 0) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "religion_id is required and must exist.",
      };
    }

    if (!word) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "word is required.",
      };
    }

    const [error, success, result, reason] = await asPromise((cb) =>
      sectNameModel.updateSectName(
        id,
        { religion_id: religionId, word },
        (modelError, ok, dbResult, modelReason) =>
          cb(modelError, ok, dbResult || null, modelReason || null),
      ),
    );

    if (error) {
      return {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        data: null,
        message: "Failed to update sect name.",
      };
    }

    if (!success && reason === "not_found") {
      return {
        httpStatus: 404,
        statusCode: 404,
        error: true,
        data: null,
        message: "Sect name not found.",
      };
    }

    if (!success && reason === "religion_not_found") {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "religion_id is required and must exist.",
      };
    }

    if (!success && reason === "duplicate_word") {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "This sect name already exists for the selected religion.",
      };
    }

    return {
      httpStatus: 200,
      statusCode: 300,
      error: false,
      data: {
        affectedRows: result?.affectedRows || 0,
      },
      message: "Sect name updated successfully.",
    };
  }

  static async deleteSectName(req) {
    const id = Number.parseInt(req.params.id, 10) || 0;
    if (id <= 0) {
      return {
        httpStatus: 422,
        statusCode: 422,
        error: true,
        data: null,
        message: "Invalid sect name id.",
      };
    }

    const [error, success, result, notFound] = await asPromise((cb) =>
      sectNameModel.deleteSectName(id, (modelError, ok, dbResult, missing) =>
        cb(modelError, ok, dbResult || null, Boolean(missing)),
      ),
    );

    if (error) {
      return {
        httpStatus: 500,
        statusCode: 500,
        error: true,
        data: null,
        message: "Failed to delete sect name.",
      };
    }

    if (notFound || !success) {
      return {
        httpStatus: 404,
        statusCode: 404,
        error: true,
        data: null,
        message: "Sect name not found.",
      };
    }

    return {
      httpStatus: 200,
      statusCode: 300,
      error: false,
      data: {
        affectedRows: result?.affectedRows || 0,
      },
      message: "Sect name deleted successfully.",
    };
  }
}

module.exports = ReligionAPIService;

