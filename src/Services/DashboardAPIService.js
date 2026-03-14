const { QueryTypes } = require("sequelize");
const db = require("../Config/DbConfig");
const dashboardModel = require("../../models/dashboardModel");
const sharedModel = require("../../models/sharedModel");
const { filterByUserOffice, schoolLocationsSqlJoin } = require("../../utils");

const DASHBOARD_SUMMARY_CACHE_MS = Number.parseInt(
  process.env.DASHBOARD_SUMMARY_CACHE_MS || "60000",
  10,
);
const dashboardSummaryCache = new Map();

const cacheKeyByUser = (user = {}) =>
  [Number(user.office || 0), user.zone_id || "null", user.district_code || "null"].join(":");

const getCachedSummary = (key) => {
  const cached = dashboardSummaryCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    dashboardSummaryCache.delete(key);
    return null;
  }
  return cached.value;
};

const setCachedSummary = (key, value) => {
  dashboardSummaryCache.set(key, {
    value,
    expiresAt: Date.now() + (Number.isFinite(DASHBOARD_SUMMARY_CACHE_MS) ? DASHBOARD_SUMMARY_CACHE_MS : 60000),
  });
};

const getAllSummaries = async (user) => {
  const cacheKey = cacheKeyByUser(user);
  const cached = getCachedSummary(cacheKey);
  if (cached) return cached;

  const userFilterForRegistered = filterByUserOffice(user, "AND", "r.zone_id", "d.LgaCode");

  const userFilterForStructures = filterByUserOffice(user, "AND");

  const registeredFromSql = `
    FROM applications a
    JOIN establishing_schools e ON e.id = a.establishing_school_id
    JOIN school_registrations s ON s.establishing_school_id = e.id
    LEFT JOIN school_categories sc ON sc.id = e.school_category_id
    LEFT JOIN registry_types rt ON rt.id = a.registry_type_id
    ${schoolLocationsSqlJoin()}
  `;

  const registeredWhereSql = `
    WHERE s.reg_status = 1
    AND a.application_category_id = 4
    AND a.is_approved = 2
    ${userFilterForRegistered}
  `;

  const categoriesSql = `
      SELECT
      e.school_category_id AS id,
      sc.category AS category,
      COUNT(*) AS total
    ${registeredFromSql}
    ${registeredWhereSql}
    GROUP BY e.school_category_id, sc.category
    ORDER BY e.school_category_id ASC
  `;

  const ownersSql = `
    SELECT CASE
      WHEN a.registry_type_id IN (1, 2) THEN 'Non Government'
      WHEN a.registry_type_id = 3 THEN 'Government'
      ELSE 'Unknown'
    END AS owner,
    COUNT(*) AS total
    ${registeredFromSql}
    ${registeredWhereSql}
    GROUP BY owner
  `;

  const applicationsSql = `
    SELECT ac.app_name AS label, COUNT(a.application_category_id) AS total
    FROM application_categories ac
    LEFT JOIN applications a ON ac.id = a.application_category_id AND a.is_approved = 2
    WHERE ac.id NOT IN (1, 4)
    GROUP BY ac.id, ac.app_name
  `;

  const structuresSql = `
    SELECT rs.id AS id, rs.structure AS label, COUNT(*) AS total
    FROM registration_structures rs
    LEFT JOIN establishing_schools e ON e.registration_structure_id = rs.id
    LEFT JOIN applications a ON a.tracking_number = e.tracking_number
    ${schoolLocationsSqlJoin()}
    WHERE a.is_approved = 2 AND a.application_category_id = 1 AND a.is_complete = 1
    ${userFilterForStructures}
    GROUP BY rs.id, rs.structure
    ORDER BY rs.structure ASC
  `;

  const registeredSql = `
    SELECT COUNT(*) AS total
    ${registeredFromSql}
    ${registeredWhereSql}
  `;

  const [categories, owners, applications, structures, registered] = await Promise.all([
    db.query(categoriesSql, { type: QueryTypes.SELECT }),
    db.query(ownersSql, { type: QueryTypes.SELECT }),
    db.query(applicationsSql, { type: QueryTypes.SELECT }),
    db.query(structuresSql, { type: QueryTypes.SELECT }),
    db.query(registeredSql, { type: QueryTypes.SELECT }),
  ]);

  const value = {
    registrations: registered[0] || { total: 0 },
    categories,
    owners,
    applications,
    structures,
  };

  setCachedSummary(cacheKey, value);
  return value;
};

const getDashboardFilters = async (user) => {
  const categoriesPromise = new Promise((resolve) => {
    sharedModel.getSchoolCategories((categories) => resolve(categories || []));
  });

  const ownershipsPromise = new Promise((resolve) => {
    sharedModel.getSchoolOwnerships((ownerships) => resolve(ownerships || []));
  });

  const regionsPromise = new Promise((resolve) => {
    sharedModel.getRegions(user, (regions) => resolve(regions || []));
  });

  const [categories, ownerships, regions] = await Promise.all([
    categoriesPromise,
    ownershipsPromise,
    regionsPromise,
  ]);

  return { categories, ownerships, regions };
};

const getMapData = (req) =>
  new Promise((resolve) => {
    dashboardModel.getMapData(req, (data) => {
      resolve(data || []);
    });
  });

const updateMarker = (payload) =>
  new Promise((resolve) => {
    dashboardModel.updateMarker(payload, (success) => {
      resolve(Boolean(success));
    });
  });

const getSchoolsSummaryByRegionAndCategories = (user) =>
  new Promise((resolve) => {
    dashboardModel.getSchoolByRegionsAndCategories(user, (data, minValue, maxValue) => {
      resolve({ data, minValue, maxValue });
    });
  });

const getNumberOfSchoolByYearOfRegistration = (user, options = {}) =>
  new Promise((resolve) => {
    dashboardModel.getTotalNumberOfSchoolByYearOfRegistration(
      user,
      options,
      (individualData, cumulativeData, pagination) => {
        resolve({ individualData, cumulativeData, pagination: pagination || {} });
      },
    );
  });

const getRegisteredSchoolsByPeriod = (user, options = {}) =>
  new Promise((resolve, reject) => {
    dashboardModel.getRegisteredSchoolsByPeriod(
      user,
      options,
      (error, rows, total) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          period: String(options?.period || "recent").toLowerCase(),
          total: Number(total || 0),
          rows: rows || [],
        });
      },
    );
  });

module.exports = {
  fetchDashboardSummaries: getAllSummaries,
  fetchDashboardFilters: getDashboardFilters,
  fetchMapData: getMapData,
  updateMapMarker: updateMarker,
  fetchSchoolsSummaryByRegionsAndCategories: getSchoolsSummaryByRegionAndCategories,
  fetchNumberOfSchoolByYearOfRegistration: getNumberOfSchoolByYearOfRegistration,
  fetchRegisteredSchoolsByPeriod: getRegisteredSchoolsByPeriod,
  getAllSummaries,
  getDashboardFilters,
  getMapData,
  updateMarker,
  getSchoolsSummaryByRegionAndCategories,
  getNumberOfSchoolByYearOfRegistration,
  getRegisteredSchoolsByPeriod,
};
