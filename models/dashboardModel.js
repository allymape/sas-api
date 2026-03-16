const db = require("../config/database");
const { filterByUserOffice, extractDateRange } = require("../utils");
const DASHBOARD_PERIOD_PERF_LOG = String(process.env.DASHBOARD_PERIOD_PERF_LOG || "0") === "1";

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

const registeredSchoolsFromSql = `
  FROM establishing_schools e
  JOIN school_registrations s ON s.establishing_school_id = e.id
  JOIN (${latestApprovedRegistrationApplicationSql}) a ON a.establishing_school_id = e.id
  LEFT JOIN school_categories sc ON sc.id = e.school_category_id
  LEFT JOIN registry_types rt ON rt.id = a.registry_type_id
  ${dashboardLocationsJoinSql}
`;

const registeredSchoolsWhereSql = (user, extraSql = "", includeOfficeFilter = true) => `
  WHERE s.reg_status = 1
  ${includeOfficeFilter ? filterByUserOffice(user, "AND", "r.zone_id", "d.LgaCode") : ""}
  ${extraSql}
`;

const labelSelectByOffice = (user = {}) => {
  switch (Number(user.office)) {
    case 1:
      return "r.RegionName";
    case 2:
      return "d.LgaName";
    case 3:
      return "w.WardName";
    default:
      return "r.RegionName";
  }
};

module.exports = {
  getAllSummaries: (user, callback) => {
    const summaryCategoriesSql = `
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
      ${registeredSchoolsFromSql}
      ${registeredSchoolsWhereSql(user)}
      GROUP BY e.school_category_id, category
      ORDER BY e.school_category_id ASC
    `;

    db.query(summaryCategoriesSql, (error, summaryCategories) => {
      if (error) {
        console.log(error);
      }

      db.query(
        `
          SELECT
            CASE
              WHEN a.registry_type_id IN (1, 2) THEN 'Non Government'
              WHEN a.registry_type_id = 3 THEN 'Government'
              ELSE 'Unknown'
            END AS owner,
            COUNT(*) AS total
          ${registeredSchoolsFromSql}
          ${registeredSchoolsWhereSql(user)}
          GROUP BY owner
        `,
        (error2, summaryOwners) => {
          if (error2) {
            error = error2;
            console.log(error2);
          }

          // APPLICATIONS BASE ON APPLICATION CATEGORIES EXCEPT KUANZISHA
          db.query(
            `SELECT ac.app_name AS label, COUNT(a.application_category_id) AS total
                                  FROM application_categories ac
                                  LEFT JOIN applications a ON ac.id = a.application_category_id
                                  LEFT JOIN  establishing_schools e ON e.tracking_number = a.tracking_number
                                  LEFT JOIN owners o ON o.establishing_school_id = e.id
                                  WHERE ac.id NOT IN (1,4) 
                                  AND a.is_approved = 2
                                  GROUP BY ac.id , ac.app_name 
                                  `,
            (error3, summaryApplications) => {
              if (error3) {
                console.log(error3);
                error = error3;
              }

              db.query(
                `SELECT rs.id AS id, rs.structure AS label,
                                COUNT(*) AS total
                                FROM registration_structures rs
                                LEFT JOIN establishing_schools e ON e.registration_structure_id = rs.id
                                LEFT JOIN applications a ON a.tracking_number = e.tracking_number
                                ${dashboardLocationsJoinSql}
                                WHERE a.is_approved = 2 AND a.application_category_id = 1 AND a.is_complete = 1
                                ${filterByUserOffice(user, "AND")}
                                GROUP BY label, id
                                ORDER BY label ASC`,
                (error4, summaryStructures) => {
                  // console.log("structure: ", summaryStructures);
                  if (error4) {
                    console.log(error4);
                    error = error4;
                  }

                  // Registered schools
                  db.query(
                    `
                      SELECT COUNT(*) AS total
                      ${registeredSchoolsFromSql}
                      ${registeredSchoolsWhereSql(user)}
                    `,
                    (error5, summaryRegisteredSchools) => {
                      if (error5) {
                        console.log(error5);
                        error = error5;
                      }

                      callback(
                        error,
                        summaryRegisteredSchools[0],
                        summaryCategories,
                        summaryOwners,
                        summaryApplications,
                        summaryStructures
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  },
  //******** Schools by Regions and Categories *******************************
  getSchoolByRegionsAndCategories: (user, callback) => {
    const labelSql = labelSelectByOffice(user);

    db.query(
      `
        SELECT
          ${labelSql} AS label,
          e.school_category_id AS category,
          COUNT(*) AS school_count
        ${registeredSchoolsFromSql}
        ${registeredSchoolsWhereSql(user)}
        GROUP BY label, e.school_category_id
        ORDER BY label ASC
      `,
      function (error, results) {
        if (error) {
          console.log(error);
        }

        // Format the results
        const formattedResults = {};

        // Iterate over the query results
        (results || []).forEach((row) => {
          const { label, category, school_count } = row;

          // Check if the region exists in the formatted results
          if (!formattedResults[label]) {
            formattedResults[label] = {
              total: 0,
              categories: { 1: 0, 2: 0, 3: 0, 4: 0 },
            };
          }

          // Update the total count for the region
          formattedResults[label].total += school_count;
          // Update the count for the category
          if (!formattedResults[label].categories[category]) {
            formattedResults[label].categories[category] = 0;
          }
          formattedResults[label].categories[category] += school_count;
        });
        // End
        // console.log(formattedResults);
        var maxValue = 0;
        var minValue = 0;
        var initial = 0;
        Object.values(formattedResults).forEach((row) => {
          // const { total } = row[i];
          initial = row.total;
          if (minValue == 0) {
            minValue = initial;
          }
          if (initial > maxValue) {
            maxValue = initial;
          }
          if (minValue > initial) {
            minValue = initial;
          }
        });
        callback(formattedResults, minValue, maxValue);
      }
    );
  },
  // Registered schools by year with server-side pagination
  getTotalNumberOfSchoolByYearOfRegistration: (user, options = {}, callback) => {
    let isLegacyCall = false;
    if (typeof options === "function") {
      callback = options;
      options = {};
      isLegacyCall = true;
    }
    const callbackFn = typeof callback === "function" ? callback : () => {};

    const parsedLimit = Number.parseInt(options.limit, 10);
    const parsedOffset = Number.parseInt(options.offset, 10);
    const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 100)) : 10;
    const offset = Number.isFinite(parsedOffset) ? Math.max(0, parsedOffset) : 0;

    const yearlyAggregateSql = `
      SELECT YEAR(s.registration_date) AS label, COUNT(*) AS total
      ${registeredSchoolsFromSql}
      ${registeredSchoolsWhereSql(user, "AND s.registration_date IS NOT NULL")}
      GROUP BY YEAR(s.registration_date)
    `;

    // Keep old routes intact: old signature (user, callback) should return full data.
    if (isLegacyCall) {
      const legacySql = `
        SELECT yearly.label, yearly.total
        FROM (${yearlyAggregateSql}) yearly
        ORDER BY yearly.label ASC
      `;
      db.query(legacySql, (legacyError, individual) => {
        if (legacyError) {
          console.log(legacyError);
          callbackFn([], []);
          return;
        }
        let runningTotal = 0;
        const cumulative = (individual || []).map((row) => {
          runningTotal += Number(row.total || 0);
          return {
            label: row.label,
            total: runningTotal,
          };
        });
        callbackFn(individual || [], cumulative);
      });
      return;
    }

    const totalYearsSql = `SELECT COUNT(*) AS totalYears FROM (${yearlyAggregateSql}) yearly`;
    const paginatedYearsSql = `
      SELECT yearly.label, yearly.total
      FROM (${yearlyAggregateSql}) yearly
      ORDER BY yearly.label DESC
      LIMIT ? OFFSET ?
    `;

    db.query(totalYearsSql, (countError, countRows) => {
      if (countError) {
        console.log(countError);
        callbackFn([], [], {
          limit,
          offset,
          totalYears: 0,
          hasOlder: false,
          hasNewer: false,
        });
        return;
      }

      const totalYears = Number(countRows?.[0]?.totalYears || 0);

      db.query(paginatedYearsSql, [limit, offset], (dataError, yearsDesc) => {
        if (dataError) {
          console.log(dataError);
          callbackFn([], [], {
            limit,
            offset,
            totalYears,
            hasOlder: false,
            hasNewer: offset > 0,
          });
          return;
        }

        const individual = Array.isArray(yearsDesc) ? [...yearsDesc].reverse() : [];

        if (!individual.length) {
          callbackFn([], [], {
            limit,
            offset,
            totalYears,
            hasOlder: false,
            hasNewer: offset > 0,
          });
          return;
        }

        const firstYearInWindow = Number(individual[0].label);
        const baseCumulativeSql = `
          SELECT IFNULL(SUM(yearly.total), 0) AS baseTotal
          FROM (${yearlyAggregateSql}) yearly
          WHERE yearly.label < ?
        `;

        db.query(baseCumulativeSql, [firstYearInWindow], (baseError, baseRows) => {
          if (baseError) {
            console.log(baseError);
          }

          let runningTotal = Number(baseRows?.[0]?.baseTotal || 0);
          const cumulative = individual.map((row) => {
            runningTotal += Number(row.total || 0);
            return {
              label: row.label,
              total: runningTotal,
            };
          });

          const loadedCount = individual.length;
          callbackFn(individual, cumulative, {
            limit,
            offset,
            totalYears,
            hasOlder: offset + loadedCount < totalYears,
            hasNewer: offset > 0,
          });
        });
      });
    });
  },

  // Registered schools by selected period (today, week, month, year, recent)
  getRegisteredSchoolsByPeriod: (user, options = {}, callback) => {
    const callbackFn = typeof callback === "function" ? callback : () => {};
    const parsedLimit = Number.parseInt(options.limit, 10);
    const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 100)) : 10;
    const period = String(options.period || "recent").toLowerCase();
    const isRecentPeriod = period === "recent";
    const startedAt = Date.now();

    // Use range filters (instead of YEAR/MONTH/DATE wrappers on column)
    // so MySQL can use registration_date indexes efficiently.
    const periodConditions = {
      today: `
        AND s.registration_date >= CURDATE()
        AND s.registration_date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      `,
      week: `
        AND s.registration_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND s.registration_date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      `,
      month: `
        AND s.registration_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
        AND s.registration_date < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
      `,
      year: `
        AND s.registration_date >= DATE_FORMAT(CURDATE(), '%Y-01-01')
        AND s.registration_date < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-01-01'), INTERVAL 1 YEAR)
      `,
      recent: ``,
    };

    const periodSql = periodConditions[period] ?? periodConditions.recent;
    const officeFilterSql = filterByUserOffice(user, "AND", "r.zone_id", "d.LgaCode");
    const periodDateSql = isRecentPeriod
      ? ""
      : `AND s.registration_date IS NOT NULL ${periodSql}`;
    const periodWhereSql = `
      WHERE s.reg_status = 1
      ${periodDateSql}
      ${officeFilterSql}
    `;

    const dataFromSql = `
      FROM establishing_schools e
      JOIN school_registrations s ON s.establishing_school_id = e.id
      JOIN (${latestApprovedRegistrationApplicationSql}) a ON a.establishing_school_id = e.id
      LEFT JOIN school_categories sc ON sc.id = e.school_category_id
      LEFT JOIN registry_types rt ON rt.id = a.registry_type_id
      ${dashboardLocationsJoinSql}
      ${periodWhereSql}
    `;

    const countFromSql = `
      FROM establishing_schools e
      JOIN school_registrations s ON s.establishing_school_id = e.id
      JOIN (${latestApprovedRegistrationApplicationSql}) a ON a.establishing_school_id = e.id
      LEFT JOIN streets st ON st.StreetCode = e.village_id
      LEFT JOIN wards w ON w.WardCode = COALESCE(e.ward_id, st.WardCode)
      LEFT JOIN districts d ON d.LgaCode = w.LgaCode
      LEFT JOIN regions r ON r.RegionCode = d.RegionCode
      ${periodWhereSql}
    `;

    const dataSql = `
      SELECT
        a.tracking_number AS tracking_number,
        e.school_name AS school_name,
        s.registration_number AS registration_number,
        COALESCE(sc.category, 'Unknown') AS category,
        CASE
          WHEN a.registry_type_id IN (1, 2) THEN 'Non Government'
          WHEN a.registry_type_id = 3 THEN 'Government'
          ELSE COALESCE(rt.registry, 'Unknown')
        END AS ownership,
        r.RegionName AS region,
        d.LgaName AS district,
        w.WardName AS ward,
        s.registration_date AS registration_date,
        s.created_at AS created_at,
        s.updated_at AS updated_at
      ${dataFromSql}
      ORDER BY ${
        isRecentPeriod
          ? "COALESCE(s.updated_at, s.created_at, s.registration_date) DESC"
          : "s.registration_date DESC"
      }, e.school_name ASC
      LIMIT ?
    `;

    const countSql = `SELECT COUNT(*) AS total ${countFromSql}`;

    db.query(dataSql, [limit], (error, rows) => {
      if (error) {
        console.error("[getRegisteredSchoolsByPeriod:dataSql]", {
          period,
          code: error.code,
          message: error.sqlMessage || error.message,
        });
        callbackFn(error, [], 0);
        return;
      }

      db.query(countSql, (countError, countRows) => {
        if (countError) {
          console.error("[getRegisteredSchoolsByPeriod:countSql]", {
            period,
            code: countError.code,
            message: countError.sqlMessage || countError.message,
          });
          callbackFn(countError, [], 0);
          return;
        }

        if (DASHBOARD_PERIOD_PERF_LOG) {
          console.log("[getRegisteredSchoolsByPeriod][PERF]", {
            period,
            limit,
            rows: (rows || []).length,
            total: Number(countRows?.[0]?.total || 0),
            ms: Date.now() - startedAt,
          });
        }

        callbackFn(null, rows || [], Number(countRows?.[0]?.total || 0));
      });
    });
  },

  getMapData: (req, callback) => {
    const user = req?.user || {};
    const source = req?.body && Object.keys(req.body).length
      ? req.body
      : (req?.query || {});

    const {
      southWestLat,
      southWestLng,
      northEastLat,
      northEastLng,
      zoom,
      name_or_reg,
      category,
      date_range,
      ownership,
      region,
      district,
      ward,
      street,
    } = source;

    const toNumber = (value, fallback) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const southWestLatNum = toNumber(southWestLat, -90);
    const southWestLngNum = toNumber(southWestLng, -180);
    const northEastLatNum = toNumber(northEastLat, 90);
    const northEastLngNum = toNumber(northEastLng, 180);
    const zoomLevel = toNumber(zoom, 6);

    const normalizedUser = { ...user };
    const office = Number(normalizedUser.office);
    if (![1, 2, 3].includes(office)) {
      normalizedUser.office = normalizedUser.district_code
        ? 3
        : (normalizedUser.zone_id ? 2 : 1);
    }

    const officeFilterSql = filterByUserOffice(
      normalizedUser,
      "AND",
      "r.zone_id",
      "d.LgaCode",
    );

    const baseFromSql = `
      FROM establishing_schools e
      JOIN school_registrations sr ON sr.establishing_school_id = e.id
      LEFT JOIN school_categories sc ON sc.id = e.school_category_id
      LEFT JOIN streets st ON st.StreetCode = e.village_id
      LEFT JOIN wards w ON w.WardCode = COALESCE(e.ward_id, st.WardCode)
      LEFT JOIN districts d ON d.LgaCode = w.LgaCode
      LEFT JOIN regions r ON r.RegionCode = d.RegionCode
      LEFT JOIN (
        SELECT a1.establishing_school_id, a1.registry_type_id
        FROM applications a1
        INNER JOIN (
          SELECT establishing_school_id, MAX(id) AS max_id
          FROM applications
          WHERE application_category_id = 4 AND is_approved = 2
          GROUP BY establishing_school_id
        ) latest ON latest.max_id = a1.id
      ) app ON app.establishing_school_id = e.id
      WHERE e.latitude IS NOT NULL
        AND e.longitude IS NOT NULL
        AND sr.reg_status = 1
        AND e.latitude BETWEEN ? AND ?
        AND e.longitude BETWEEN ? AND ?
        ${officeFilterSql}
    `;

    const baseParams = [
      southWestLatNum,
      northEastLatNum,
      southWestLngNum,
      northEastLngNum,
    ];

    let filterSql = "";
    const filterParams = [];

    if (name_or_reg) {
      filterSql += ` AND (e.school_name LIKE ? OR sr.registration_number = ? OR sr.tracking_number = ?)`;
      filterParams.push(`%${name_or_reg}%`, `${name_or_reg}`, `${name_or_reg}`);
    }

    if (date_range) {
      const { start_date, end_date } = extractDateRange(date_range);
      if (start_date && end_date) {
        filterSql += ` AND DATE(sr.registration_date) BETWEEN ? AND ?`;
        filterParams.push(`${start_date}`, `${end_date}`);
      } else if (start_date) {
        filterSql += ` AND DATE(sr.registration_date) = ?`;
        filterParams.push(`${start_date}`);
      }
    }

    if (category) {
      filterSql += ` AND sc.id = ?`;
      filterParams.push(category);
    }
    if (ownership) {
      filterSql += ` AND app.registry_type_id = ?`;
      filterParams.push(ownership);
    }
    if (region) {
      filterSql += ` AND r.RegionCode = ?`;
      filterParams.push(region);
    }
    if (district) {
      filterSql += ` AND d.LgaCode = ?`;
      filterParams.push(district);
    }
    if (ward) {
      filterSql += ` AND w.WardCode = ?`;
      filterParams.push(ward);
    }
    if (street) {
      filterSql += ` AND st.StreetCode = ?`;
      filterParams.push(street);
    }

    const buildPointsSql = (limit = 2000) => `
      SELECT
        sr.tracking_number AS tracking_number,
        e.school_name AS name,
        sr.registration_number AS registration_number,
        sr.registration_date AS registration_date,
        CASE
          WHEN sc.id = 1 THEN 'AWALI'
          WHEN sc.id = 2 THEN 'MSINGI'
          WHEN sc.id = 3 THEN 'SEKONDARI'
          WHEN sc.id = 4 THEN 'CHUO'
          ELSE 'N/A'
        END AS category,
        sc.id AS category_id,
        app.registry_type_id AS registry_type_id,
        CASE
          WHEN app.registry_type_id IN (1, 2) THEN 'PRIVATE'
          WHEN app.registry_type_id = 3 THEN 'GOVERNMENT'
          ELSE 'N/A'
        END AS ownership,
        e.latitude AS latitude,
        e.longitude AS longitude,
        UCASE(r.RegionName) AS region,
        UCASE(d.LgaName) AS district,
        UCASE(w.WardName) AS ward,
        UCASE(st.StreetName) AS street,
        r.RegionCode AS region_code,
        d.LgaCode AS district_code,
        w.WardCode AS ward_code,
        st.StreetCode AS street_code,
        r.zone_id AS zone_id
      ${baseFromSql}
      ${filterSql}
      ORDER BY sr.registration_date DESC, e.school_name ASC
      LIMIT ${limit}
    `;

    const buildAggregateSql = (groupLevel = "region", limit = 400) => {
      const groupCode = groupLevel === "region" ? "r.RegionCode" : "d.LgaCode";
      const groupLabel = groupLevel === "region" ? "UCASE(r.RegionName)" : "UCASE(d.LgaName)";
      return `
        SELECT
          ${groupCode} AS group_code,
          ${groupLabel} AS label,
          AVG(e.latitude) AS latitude,
          AVG(e.longitude) AS longitude,
          COUNT(*) AS school_count
        ${baseFromSql}
        ${filterSql}
        GROUP BY group_code, label
        ORDER BY school_count DESC, label ASC
        LIMIT ${limit}
      `;
    };

    const clusterCellSize = (z) => {
      if (z <= 8) return 0.2;
      if (z <= 9) return 0.12;
      return 0.07;
    };

    const buildClusterSql = () => `
      SELECT
        CONCAT(FLOOR(e.latitude / ?), ':', FLOOR(e.longitude / ?)) AS bucket_id,
        AVG(e.latitude) AS latitude,
        AVG(e.longitude) AS longitude,
        MIN(UCASE(r.RegionName)) AS region,
        MIN(UCASE(d.LgaName)) AS district,
        COUNT(*) AS school_count
      ${baseFromSql}
      ${filterSql}
      GROUP BY bucket_id
      ORDER BY school_count DESC, bucket_id ASC
      LIMIT 1200
    `;

    let mode = "points";
    let sql = "";
    let queryParams = [];

    if (zoomLevel <= 7) {
      mode = "aggregate";
      const groupLevel = zoomLevel <= 5 ? "region" : "district";
      sql = buildAggregateSql(groupLevel, groupLevel === "region" ? 80 : 250);
      queryParams = [...baseParams, ...filterParams];
    } else if (zoomLevel <= 10) {
      mode = "cluster";
      const cell = clusterCellSize(zoomLevel);
      sql = buildClusterSql();
      queryParams = [cell, cell, ...baseParams, ...filterParams];
    } else {
      mode = "points";
      const limit = zoomLevel <= 12 ? 1500 : 2500;
      sql = buildPointsSql(limit);
      queryParams = [...baseParams, ...filterParams];
    }

    const finalizeMapResponse = (selectedMode, rows, usedSql, usedParams, fallbackFrom = null) => {
      const rowsCount = rows.length;
      const hasOfficeFilter = String(officeFilterSql || "").trim().length > 0;

      if (!rowsCount && hasOfficeFilter) {
        const debugSql = usedSql.replace(officeFilterSql, "");
        db.query(debugSql, usedParams, (debugError, debugRows) => {
          console.log("[getMapData][DEBUG_EMPTY]", {
            office: normalizedUser.office,
            zone_id: normalizedUser.zone_id || null,
            district_code: normalizedUser.district_code || null,
            rows_with_office_filter: rowsCount,
            rows_without_office_filter: debugError ? null : (debugRows || []).length,
            debug_error: debugError ? (debugError.sqlMessage || debugError.message || "unknown") : null,
            filters: {
              name_or_reg: name_or_reg || null,
              category: category || null,
              ownership: ownership || null,
              region: region || null,
              district: district || null,
              ward: ward || null,
              street: street || null,
              date_range: date_range || null,
              zoom: zoomLevel,
            },
            mode: selectedMode,
            fallback_from: fallbackFrom,
          });
        });
      } else {
        console.log("[getMapData][OK]", {
          office: normalizedUser.office,
          rows: rowsCount,
          zoom: zoomLevel,
          mode: selectedMode,
          fallback_from: fallbackFrom,
        });
      }

      const totalSchools = selectedMode === "points"
        ? rowsCount
        : rows.reduce((sum, row) => sum + Number(row?.school_count || 0), 0);

      callback({
        mode: selectedMode,
        rows,
        meta: {
          zoom: zoomLevel,
          total_rows: rowsCount,
          total_schools: totalSchools,
          grouped_by: selectedMode === "aggregate"
            ? (zoomLevel <= 5 ? "region" : "district")
            : (selectedMode === "cluster" ? "grid" : "point"),
          fallback_from: fallbackFrom,
        },
      });
    };

    db.query(sql, queryParams, (error, data) => {
      if (error) {
        console.log("[getMapData][ERROR]", {
          code: error.code || null,
          message: error.sqlMessage || error.message || null,
        });
        callback([]);
        return;
      }

      const rows = Array.isArray(data) ? data : [];
      const rowsCount = rows.length;

      if (mode !== "points" && rowsCount === 0) {
        const fallbackSql = buildPointsSql(2500);
        const fallbackParams = [...baseParams, ...filterParams];
        db.query(fallbackSql, fallbackParams, (fallbackError, fallbackData) => {
          if (fallbackError) {
            console.log("[getMapData][FALLBACK_ERROR]", {
              from_mode: mode,
              code: fallbackError.code || null,
              message: fallbackError.sqlMessage || fallbackError.message || null,
            });
            finalizeMapResponse(mode, rows, sql, queryParams);
            return;
          }

          const fallbackRows = Array.isArray(fallbackData) ? fallbackData : [];
          console.log("[getMapData][FALLBACK_TO_POINTS]", {
            from_mode: mode,
            to_mode: "points",
            zoom: zoomLevel,
            rows_before: rowsCount,
            rows_after: fallbackRows.length,
          });
          finalizeMapResponse("points", fallbackRows, fallbackSql, fallbackParams, mode);
        });
        return;
      }

      finalizeMapResponse(mode, rows, sql, queryParams);
    });
  },
  updateMarker: (data, callback) => {
    const { tracking_number, latitude, longitude } = data;
    db.query(
      `UPDATE establishing_schools es
       JOIN school_registrations sr ON sr.establishing_school_id = es.id
       SET latitude = ?, longitude = ? 
       WHERE sr.tracking_number = ?`,
      [latitude, longitude, tracking_number],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        if(result.affectedRows > 0){
          callback(true);
        }else{
          callback(false);
        }
      }
    );
  }
};
