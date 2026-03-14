const db = require("../config/database");
const { schoolLocationsSqlJoin, filterByUserOffice, extractDateRange } = require("../utils");

const registeredSchoolsFromSql = `
  FROM applications a
  JOIN establishing_schools e ON e.id = a.establishing_school_id
  JOIN school_registrations s ON s.establishing_school_id = e.id
  LEFT JOIN school_categories sc ON sc.id = e.school_category_id
  LEFT JOIN registry_types rt ON rt.id = a.registry_type_id
  ${schoolLocationsSqlJoin()}
`;

const registeredSchoolsWhereSql = (user, extraSql = "", includeOfficeFilter = true) => `
  WHERE s.reg_status = 1
  AND a.application_category_id = 4
  AND a.is_approved = 2
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
        sc.category AS category,
        COUNT(*) AS total
      ${registeredSchoolsFromSql}
      ${registeredSchoolsWhereSql(user)}
      GROUP BY e.school_category_id, sc.category
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
                                ${schoolLocationsSqlJoin()}
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
    const baseFromSql = `
      ${registeredSchoolsFromSql}
      ${registeredSchoolsWhereSql(user, `AND s.registration_date IS NOT NULL ${periodSql}`, false)}
    `;

    const dataSql = `
      SELECT DISTINCT
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
        s.registration_date AS registration_date
      ${baseFromSql}
      ORDER BY s.registration_date DESC, e.school_name ASC
      LIMIT ?
    `;

    const countSql = `SELECT COUNT(*) AS total ${baseFromSql}`;

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

        callbackFn(null, rows || [], Number(countRows?.[0]?.total || 0));
      });
    });
  },

  getMapData: (req, callback) => {
     const { user } = req;
     var search = false
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
       street
     } = req.body;
     
     var sql = `SELECT *
                  FROM school_locations_map_view
                  WHERE latitude BETWEEN ? AND ?
                  AND longitude BETWEEN ? AND ?
                  ${filterByUserOffice(
                    user,
                    "AND",
                    "zone_id",
                    "district_code"
                  )}
                  `;
    if (name_or_reg) {
      sql += ` AND (name LIKE ? OR registration_number = ?)`;
      search = true;
    }
    var between = false;
    if (date_range) {
      var { start_date, end_date } = extractDateRange(date_range);
       if(start_date && end_date){
          between = true;
         sql +=   `AND registration_date BETWEEN ? AND ?`
       }else{
          sql += `AND registration_date = ?`;
       }
    }
    if (category) {
      sql += ` AND category_id = ?`;
       search = true;
    }
    if (ownership) {
      sql += ` AND registry_type_id = ?`;
       search = true;
    }
    if (region) {
      sql += ` AND region_code = ?`;
       search = true;
    }
    if (district) {
      sql += ` AND district_code = ?`;
      search = true;
    }
    if (ward) {
      sql += ` AND ward_code = ?`;
      search = true;
    }
    if (street) {
      sql += ` AND street_code = ?`;
       search = true;
    }
    if (zoom < 6) {
      sql = sql += ` LIMIT 40`;
    }else if (zoom == 6) {
      sql = sql += ` LIMIT 100`;
    } else if (zoom > 6 && zoom < 10) {
      sql = sql += ` LIMIT 500`;
    } else {
      sql = sql += `LIMIT 2000`;
    }
    const queryParams = [
      southWestLat,
      northEastLat,
      southWestLng,
      northEastLng,
      ...(name_or_reg ? [`%${name_or_reg}%`, `${name_or_reg}`] : []),
      ...(date_range && between ? [`${start_date}`, `${end_date}`] :  (date_range ? [`${start_date}`] : [])),
      ...(category ? [category] : []),
      ...(ownership ? [ownership] : []),
      ...(region ? [region] : []),
      ...(district ? [district] : []),
      ...(ward ? [ward] : []),
      ...(street ? [street] : []),
    ];
     db.query(
       sql,
       queryParams,
       (error, data) => {
         if (error) {
           console.log(error);
         }
         console.log(data.length);
         callback(data);
       }
     );
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
