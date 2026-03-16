const { QueryTypes } = require("sequelize");
const db = require("../Config/DbConfig");
const dashboardModel = require("../../models/dashboardModel");
const sharedModel = require("../../models/sharedModel");
const { filterByUserOffice } = require("../../utils");

const DASHBOARD_SUMMARY_CACHE_MS = Number.parseInt(
  process.env.DASHBOARD_SUMMARY_CACHE_MS || "60000",
  10,
);
const DASHBOARD_REGIONS_CACHE_MS = Number.parseInt(
  process.env.DASHBOARD_REGIONS_CACHE_MS || "60000",
  10,
);
const DASHBOARD_YEARS_CACHE_MS = Number.parseInt(
  process.env.DASHBOARD_YEARS_CACHE_MS || "120000",
  10,
);
const DASHBOARD_PERIODS_CACHE_MS = Number.parseInt(
  process.env.DASHBOARD_PERIODS_CACHE_MS || "30000",
  10,
);
const DASHBOARD_CACHE_MAX_KEYS = Number.parseInt(
  process.env.DASHBOARD_CACHE_MAX_KEYS || "250",
  10,
);
const dashboardSummaryCache = new Map();
const dashboardRegionsCache = new Map();
const dashboardYearsCache = new Map();
const dashboardPeriodsCache = new Map();
const dashboardInFlightCache = new Map();
const latestApprovedRegistrationApplicationSql = `
  SELECT a1.id, a1.establishing_school_id, a1.registry_type_id, a1.tracking_number
  FROM applications a1
  INNER JOIN (
    SELECT establishing_school_id, MAX(id) AS max_id
    FROM applications
    WHERE application_category_id = 4 AND is_approved = 2
    GROUP BY establishing_school_id
  ) latest ON latest.max_id = a1.id
`;

const dashboardLocationsJoinSql = `
  LEFT JOIN streets st ON st.StreetCode = e.village_id
  LEFT JOIN wards w ON w.WardCode = COALESCE(e.ward_id, st.WardCode)
  LEFT JOIN districts d ON d.LgaCode = w.LgaCode
  LEFT JOIN regions r ON r.RegionCode = d.RegionCode
  LEFT JOIN zones z ON z.id = r.zone_id
`;

const cacheKeyByUser = (user = {}) =>
  [Number(user.office || 0), user.zone_id || "null", user.district_code || "null"].join(":");

const pruneCacheMap = (cacheMap, maxSize = 250) => {
  const limit = Number.isFinite(maxSize) && maxSize > 0 ? maxSize : 250;
  while (cacheMap.size > limit) {
    const oldestKey = cacheMap.keys().next().value;
    if (oldestKey === undefined) break;
    cacheMap.delete(oldestKey);
  }
};

const getCachedValue = (cacheMap, key) => {
  const cached = cacheMap.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    cacheMap.delete(key);
    return null;
  }
  return cached.value;
};

const setCachedValue = (cacheMap, key, value, ttlMs) => {
  const ttl = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : 60000;
  cacheMap.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  });
  pruneCacheMap(cacheMap, DASHBOARD_CACHE_MAX_KEYS);
};

const getOrFetchCachedValue = async ({ cacheMap, key, ttlMs, fetcher }) => {
  const cached = getCachedValue(cacheMap, key);
  if (cached) return cached;

  const inFlightKey = String(key);
  if (dashboardInFlightCache.has(inFlightKey)) {
    return dashboardInFlightCache.get(inFlightKey);
  }

  const promise = (async () => {
    const value = await fetcher();
    if (value !== null && value !== undefined) {
      setCachedValue(cacheMap, key, value, ttlMs);
    }
    return value;
  })().finally(() => {
    dashboardInFlightCache.delete(inFlightKey);
  });

  dashboardInFlightCache.set(inFlightKey, promise);
  return promise;
};

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
  setCachedValue(dashboardSummaryCache, key, value, DASHBOARD_SUMMARY_CACHE_MS);
};

const getAllSummaries = async (user) => {
  const cacheKey = cacheKeyByUser(user);
  const cached = getCachedSummary(cacheKey);
  if (cached) return cached;

  const userFilterForRegistered = filterByUserOffice(user, "AND", "r.zone_id", "d.LgaCode");

  const userFilterForStructures = filterByUserOffice(user, "AND");

  const registeredFromSql = `
    FROM establishing_schools e
    JOIN school_registrations s ON s.establishing_school_id = e.id
    JOIN (${latestApprovedRegistrationApplicationSql}) a ON a.establishing_school_id = e.id
    LEFT JOIN school_categories sc ON sc.id = e.school_category_id
    LEFT JOIN registry_types rt ON rt.id = a.registry_type_id
    ${dashboardLocationsJoinSql}
  `;

  const registeredWhereSql = `
    WHERE s.reg_status = 1
    ${userFilterForRegistered}
  `;

  const categoriesSql = `
      SELECT
      e.school_category_id AS id,
      CASE
        WHEN e.school_category_id = 1 THEN 'Awali'
        WHEN e.school_category_id = 2 THEN 'Msingi'
        WHEN e.school_category_id = 3 THEN 'Sekondari'
        WHEN e.school_category_id = 4 THEN 'Vyuo vya Ualimu'
        ELSE COALESCE(NULLIF(TRIM(sc.category), ''), CONCAT('Aina ', e.school_category_id))
      END AS category,
      COUNT(*) AS total
    ${registeredFromSql}
    ${registeredWhereSql}
    GROUP BY e.school_category_id, category
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
    ${dashboardLocationsJoinSql}
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

const getSchoolsSummaryByRegionAndCategories = async (user) => {
  const key = `regions:${cacheKeyByUser(user)}`;
  return getOrFetchCachedValue({
    cacheMap: dashboardRegionsCache,
    key,
    ttlMs: DASHBOARD_REGIONS_CACHE_MS,
    fetcher: async () =>
      new Promise((resolve) => {
        dashboardModel.getSchoolByRegionsAndCategories(user, (data, minValue, maxValue) => {
          resolve({ data, minValue, maxValue });
        });
      }),
  });
};

const getNumberOfSchoolByYearOfRegistration = async (user, options = {}) => {
  const parsedLimit = Number.parseInt(options.limit, 10);
  const parsedOffset = Number.parseInt(options.offset, 10);
  const normalizedOptions = {
    limit: Number.isFinite(parsedLimit) ? parsedLimit : 10,
    offset: Number.isFinite(parsedOffset) ? parsedOffset : 0,
  };
  const key = `years:${cacheKeyByUser(user)}:${normalizedOptions.limit}:${normalizedOptions.offset}`;

  return getOrFetchCachedValue({
    cacheMap: dashboardYearsCache,
    key,
    ttlMs: DASHBOARD_YEARS_CACHE_MS,
    fetcher: async () =>
      new Promise((resolve) => {
        dashboardModel.getTotalNumberOfSchoolByYearOfRegistration(
          user,
          normalizedOptions,
          (individualData, cumulativeData, pagination) => {
            resolve({ individualData, cumulativeData, pagination: pagination || {} });
          },
        );
      }),
  });
};

const getRegisteredSchoolsByPeriod = async (user, options = {}) => {
  const parsedLimit = Number.parseInt(options.limit, 10);
  const normalizedOptions = {
    period: String(options?.period || "recent").toLowerCase(),
    limit: Number.isFinite(parsedLimit) ? parsedLimit : 10,
  };
  const key = `period:${cacheKeyByUser(user)}:${normalizedOptions.period}:${normalizedOptions.limit}`;

  return getOrFetchCachedValue({
    cacheMap: dashboardPeriodsCache,
    key,
    ttlMs: DASHBOARD_PERIODS_CACHE_MS,
    fetcher: async () =>
      new Promise((resolve, reject) => {
        dashboardModel.getRegisteredSchoolsByPeriod(
          user,
          normalizedOptions,
          (error, rows, total) => {
            if (error) {
              reject(error);
              return;
            }

            resolve({
              period: normalizedOptions.period,
              total: Number(total || 0),
              rows: rows || [],
            });
          },
        );
      }),
  });
};

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
