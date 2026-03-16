const schoolModel = require("../../models/schoolModel");
const sharedModel = require("../../models/sharedModel");
const { validateRegistrationNumber } = require("../../utils");

const asPromise = (fn) =>
  new Promise((resolve, reject) => {
    try {
      fn((...args) => resolve(args));
    } catch (error) {
      reject(error);
    }
  });

const extractSearchValue = (req) => {
  const querySearch = req.query.search;
  if (typeof querySearch === "object" && querySearch !== null) {
    return querySearch.value || "";
  }

  return (
    req.query.search_value ||
    querySearch ||
    req.body?.search?.value ||
    req.body?.search ||
    ""
  );
};

const getOptionalNumber = (queryValue, bodyValue) => {
  const candidate =
    queryValue !== undefined && queryValue !== "" ? queryValue : bodyValue;
  if (candidate === undefined || candidate === null || candidate === "") {
    return null;
  }

  const numeric = Number(candidate);
  return Number.isFinite(numeric) ? numeric : null;
};

class SchoolAPIService {
  static async fetchSchoolFilters() {
    const [categories, ownerships] = await Promise.all([
      asPromise((cb) => sharedModel.getSchoolCategories((data) => cb(data || []))),
      asPromise((cb) => sharedModel.getSchoolOwnerships((data) => cb(data || []))),
    ]);

    return {
      categories: categories[0] || [],
      ownerships: ownerships[0] || [],
    };
  }

  static async fetchAllSchools(req) {
    const perPage = Number.parseInt(req.query.per_page, 10) || 10;
    const page = Number.parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * perPage;
    const searchValue = extractSearchValue(req);

    const [error, schools, numRows, missingFileNumbersCount] = await asPromise((cb) =>
      schoolModel.getAllSchools(
        offset,
        perPage,
        getOptionalNumber(req.query.aina, req.body?.aina),
        getOptionalNumber(req.query.umiliki, req.body?.umiliki),
        getOptionalNumber(req.query.invalid_or_no_reg, req.body?.invalid_or_no_reg),
        getOptionalNumber(req.query.geolocation, req.body?.geolocation),
        getOptionalNumber(req.query.duplicate_reg, req.body?.duplicate_reg),
        getOptionalNumber(req.query.delete_duplicate, req.body?.delete_duplicate),
        getOptionalNumber(req.query.correction, req.body?.correction),
        searchValue,
        (modelError, list, total, missingTotal) =>
          cb(modelError, list || [], total || 0, missingTotal || 0),
        req,
      ),
    );

    return {
      error: Boolean(error),
      statusCode: error ? 306 : 300,
      data: error ? [] : schools,
      numRows: Number(numRows || 0),
      missing_file_numbers_count: Number(missingFileNumbersCount || 0),
      current_page: page,
      per_page: perPage,
      message: error ? "Failed to fetch schools." : "Orodha ya Shule.",
    };
  }

  static async fetchSchoolFiles(req) {
    const perPage = Number.parseInt(req.query.per_page, 10) || 10;
    const page = Number.parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * perPage;
    const searchValue = extractSearchValue(req);
    const sortBy = String(req.query.sort_by || req.body?.sort_by || "name").trim();
    const sortDir = String(req.query.sort_dir || req.body?.sort_dir || "asc").trim();

    const [error, rows, numRows, missingFileNumbersCount] = await asPromise((cb) =>
      schoolModel.getSchoolFiles(
        offset,
        perPage,
        searchValue,
        sortBy,
        sortDir,
        req,
        (modelError, list, total, missingTotal) =>
          cb(modelError, list || [], total || 0, missingTotal || 0),
      ),
    );

    return {
      error: Boolean(error),
      statusCode: error ? 306 : 300,
      data: error ? [] : rows,
      numRows: Number(numRows || 0),
      missing_file_numbers_count: Number(missingFileNumbersCount || 0),
      current_page: page,
      per_page: perPage,
      message: error ? "Failed to fetch school files." : "Orodha ya Majalada ya Shule.",
    };
  }

  static async lookForSchools(req) {
    const perPage = Number.parseInt(req.query.per_page, 10) || 10;
    const page = Number.parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * perPage;
    const search = req.query.q || req.body?.search || "";

    const [error, schools] = await asPromise((cb) =>
      schoolModel.lookForSchools(offset, perPage, search, (modelError, list) =>
        cb(modelError, list || []),
      ),
    );

    const data = (schools || []).map((school) => ({
      id: school.id,
      text: `${school.text} (${school.registration_number} - ${school.region} ${school.district} ${school.ward})`,
    }));

    return {
      error: Boolean(error),
      statusCode: error ? 306 : 300,
      data: error ? [] : data,
      message: error ? "Something went wrong" : "List of schools",
    };
  }

  static async findSchoolByTrackingNumber(trackingNumber) {
    const [error, school] = await asPromise((cb) =>
      schoolModel.editSchool(trackingNumber, (modelError, item) =>
        cb(modelError, item || null),
      ),
    );

    return {
      error: Boolean(error),
      statusCode: error ? 306 : 300,
      data: error ? null : school,
      message: error ? "Kuna Tatizo" : "School Found",
    };
  }

  static async updateSchool(req) {
    const trackingNumber = req.params.id;
    const registrationNumber = String(req.body?.registration_number || "").trim();

    if (!validateRegistrationNumber(registrationNumber)) {
      return {
        error: true,
        statusCode: 306,
        message:
          "Namba ya Usajili sio sahihi. Hakikisha namba ya usajili haijaacha nafasi na imetenganishwa na nukta",
      };
    }

    const [error, message] = await asPromise((cb) =>
      schoolModel.updateSchool(trackingNumber, req.body, (modelError, modelMessage) =>
        cb(modelError, modelMessage),
      ),
    );

    return {
      error: Boolean(error),
      statusCode: error ? 306 : 300,
      message,
    };
  }

  static async updateSchoolFileNumber(req) {
    const schoolId = Number.parseInt(req?.params?.school_id, 10) || 0;
    const fileNumber = String(req?.body?.file_number || "").trim();

    const [success, message] = await asPromise((cb) =>
      schoolModel.updateSchoolFileNumber(schoolId, fileNumber, (ok, modelMessage) =>
        cb(Boolean(ok), modelMessage),
      ),
    );

    return {
      error: !success,
      statusCode: success ? 300 : 306,
      message: message || (success ? "Umefanikiwa." : "Haujafanikiwa."),
    };
  }

  static async fetchMissingSchoolFileNumbersCount() {
    const [success, total, message] = await asPromise((cb) =>
      schoolModel.countMissingSchoolFileNumbers((ok, count, modelMessage) =>
        cb(Boolean(ok), Number(count || 0), modelMessage),
      ),
    );

    return {
      error: !success,
      statusCode: success ? 300 : 306,
      message:
        message ||
        (success
          ? "Idadi ya majalada yasiyo na namba imepatikana."
          : "Haujafanikiwa kupata idadi ya majalada yasiyo na namba."),
      data: {
        total: Number(total || 0),
      },
    };
  }

  static async generateMissingSchoolFileNumbers() {
    const [success, message, meta] = await asPromise((cb) =>
      schoolModel.generateMissingSchoolFileNumbers((ok, modelMessage, modelMeta) =>
        cb(Boolean(ok), modelMessage, modelMeta || {
          updated: 0,
          skipped: 0,
          skipped_reasons: {},
          skipped_details: [],
        }),
      ),
    );

    return {
      error: !success,
      statusCode: success ? 300 : 306,
      message: message || (success ? "Umefanikiwa." : "Haujafanikiwa."),
      data: meta || {
        updated: 0,
        skipped: 0,
        skipped_reasons: {},
        skipped_details: [],
      },
    };
  }
}

module.exports = SchoolAPIService;
