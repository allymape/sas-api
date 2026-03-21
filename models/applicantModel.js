const db = require("../config/database");
const { schoolLocationsSqlJoin } = require("../utils");

module.exports = {
  //******** GET A LIST OF APPLICANTS *******************************
  getAllApplicants: (
    offset,
    per_page,
    search_value,
    sort_by,
    sort_order,
    min_applications,
    max_applications,
    callback,
  ) => {
    // Backward compatibility: getAllApplicants(offset, per_page, search_value, callback)
    if (typeof sort_by === "function") {
      callback = sort_by;
      sort_by = "created_at";
      sort_order = "desc";
      min_applications = 0;
      max_applications = null;
    } else if (typeof sort_order === "function") {
      callback = sort_order;
      sort_by = sort_by || "created_at";
      sort_order = "desc";
      min_applications = 0;
      max_applications = null;
    }

    if (typeof callback !== "function") {
      throw new TypeError("callback is not a function");
    }

    const normalizeSearch = (value) => {
      if (value === undefined || value === null) return "";
      if (typeof value === "object") {
        return String(value.value ?? value.search ?? value.q ?? "").trim();
      }
      return String(value).trim();
    };

    const searchText = normalizeSearch(search_value);
    const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
    const safePerPage =
      Number.isFinite(Number(per_page)) && Number(per_page) > 0
        ? Number.parseInt(per_page, 10)
        : 10;

    const sortMap = {
      created_at: "u.created_at",
      updated_at: "u.updated_at",
      name: "u.name",
      email: "u.email",
      total_applications: "total_applications",
    };

    const sortKey = String(sort_by || "").trim().toLowerCase();
    const sortColumn = sortMap[sortKey] || sortMap.created_at;
    const sortOrder = String(sort_order || "").trim().toLowerCase() === "asc" ? "ASC" : "DESC";

    const minApps = Math.max(0, Number(min_applications || 0) || 0);
    const rawMaxApps = max_applications === "" || max_applications === undefined ? null : max_applications;
    const parsedMaxApps = rawMaxApps === null ? null : Number(rawMaxApps);
    const maxApps = Number.isFinite(parsedMaxApps) ? Math.max(0, parsedMaxApps) : null;
    var searchQuery = "";
    var queryParams = [];
    if (searchText) {
      searchQuery += ` AND (u.email LIKE ? OR 
                            u.name LIKE ? OR
                            es.school_name LIKE ? OR
                            sr.registration_number LIKE ?
                          )`;
      queryParams.push(
        `%${searchText}%`,
        `%${searchText}%`,
        `%${searchText}%`,
        `%${searchText}%`
      );
    }
      // List users first (fast), then aggregate applications only for the current page user_ids.
      // This avoids heavy GROUP BY scans for every DataTables draw.
      const whereParts = ["1 = 1"];
      const whereParams = [];

      if (searchText) {
        whereParts.push(`(
          u.email LIKE ? OR
          u.name LIKE ? OR
          EXISTS (
            SELECT 1
            FROM applications a1
            LEFT JOIN establishing_schools es1 ON es1.id = a1.establishing_school_id
            LEFT JOIN school_registrations sr1 ON sr1.establishing_school_id = es1.id
            WHERE a1.user_id = u.id
              AND (
                es1.school_name LIKE ? OR
                sr1.registration_number LIKE ?
              )
          )
        )`);
        whereParams.push(
          `%${searchText}%`,
          `%${searchText}%`,
          `%${searchText}%`,
          `%${searchText}%`,
        );
      }

      if (minApps > 0) {
        whereParts.push("(SELECT COUNT(DISTINCT a2.id) FROM applications a2 WHERE a2.user_id = u.id) >= ?");
        whereParams.push(minApps);
      }
      if (maxApps !== null && Number.isFinite(maxApps)) {
        whereParts.push("(SELECT COUNT(DISTINCT a3.id) FROM applications a3 WHERE a3.user_id = u.id) <= ?");
        whereParams.push(maxApps);
      }

      // Defensive join: some environments may have duplicate applicants for a single user_id.
      // Collapse applicants to one row per user_id.
      const usersFromSql = `FROM users u
        LEFT JOIN (
          SELECT user_id, MIN(id) AS id, MAX(applicantable_type) AS applicantable_type
          FROM applicants
          WHERE user_id IS NOT NULL
          GROUP BY user_id
        ) ap ON ap.user_id = u.id
        WHERE ${whereParts.join(" AND ")}`;

      const usersListSql = `SELECT
          u.id AS id,
          ap.id AS applicant_id,
          ap.applicantable_type AS applicantable_type,
          u.name AS name,
          u.email AS email,
          u.created_at AS created_at,
          u.updated_at AS updated_at
        ${usersFromSql}
        ORDER BY ${sortColumn} ${sortOrder}
        ${safePerPage > 0 ? "LIMIT ? , ?" : ""}`;

      const usersCountSql = `SELECT COUNT(*) AS num_rows ${usersFromSql}`;

      db.query(
        usersListSql,
        safePerPage > 0 ? whereParams.concat([safeOffset, safePerPage]) : whereParams,
        (error, users) => {
          if (error) {
            console.log(error);
            return callback(error, [], 0);
          }

          const userIds = (Array.isArray(users) ? users : []).map((u) => u.id).filter(Boolean);
          if (!userIds.length) {
            return db.query(usersCountSql, whereParams, (error2, result2) => {
              if (error2) {
                console.log(error2);
                return callback(error2, [], 0);
              }
              const total = Array.isArray(result2) && result2[0] ? result2[0].num_rows : 0;
              callback(null, [], total);
            });
          }

          const appsAggSql = `SELECT
              a.user_id,
              COUNT(DISTINCT a.id) AS total_applications,
              COUNT(DISTINCT a.registry_type_id) AS registry_type_distinct_count,
              CASE
                WHEN COUNT(DISTINCT a.registry_type_id) = 1 THEN MIN(a.registry_type_id)
                ELSE NULL
              END AS registry_type_id,
              CASE
                WHEN COUNT(DISTINCT a.registry_type_id) = 1 THEN MAX(rt.registry)
                WHEN COUNT(DISTINCT a.registry_type_id) > 1 THEN 'MIXED'
                ELSE 'UNKNOWN'
              END AS registry_type
            FROM applications a
            LEFT JOIN registry_types rt ON rt.id = a.registry_type_id
            WHERE a.user_id IN (?)
            GROUP BY a.user_id`;

          db.query(appsAggSql, [userIds], (errorAgg, aggRows) => {
            if (errorAgg) {
              console.log(errorAgg);
              return callback(errorAgg, [], 0);
            }

            const aggMap = new Map();
            (Array.isArray(aggRows) ? aggRows : []).forEach((r) => {
              aggMap.set(r.user_id, r);
            });

            const enriched = (users || []).map((u) => {
              const agg = aggMap.get(u.id) || {};
              const hasApplicant = Boolean(u && u.applicant_id);
              return {
                ...u,
                total_applications: Number(agg.total_applications || 0),
                // If the user has not filled applicants details yet, show UNKNOWN regardless of applications mix.
                registry_type_id: hasApplicant ? (agg.registry_type_id ?? null) : null,
                registry_type: hasApplicant ? (agg.registry_type ?? "UNKNOWN") : "UNKNOWN",
              };
            });

            db.query(usersCountSql, whereParams, (error2, result2) => {
              if (error2) {
                console.log(error2);
                return callback(error2, enriched, 0);
              }
              const total = Array.isArray(result2) && result2[0] ? result2[0].num_rows : 0;
              callback(null, enriched, total);
            });
          });
        }
      );

      return;

	  },

    getApplicantsRegistryTypeSummary: (
      search_value,
      min_applications,
      max_applications,
      callback,
    ) => {
      const normalizeSearch = (value) => {
        if (value === undefined || value === null) return "";
        if (typeof value === "object") {
          return String(value.value ?? value.search ?? value.q ?? "").trim();
        }
        return String(value).trim();
      };

      const searchText = normalizeSearch(search_value);
      const minApps = Math.max(0, Number(min_applications || 0) || 0);
      const rawMaxApps = max_applications === "" || max_applications === undefined ? null : max_applications;
      const parsedMaxApps = rawMaxApps === null ? null : Number(rawMaxApps);
      const maxApps = Number.isFinite(parsedMaxApps) ? Math.max(0, parsedMaxApps) : null;

      var searchQuery = "";
      var queryParams = [];
      if (searchText) {
        searchQuery += ` AND (u.email LIKE ? OR 
                              u.name LIKE ? OR
                              es.school_name LIKE ? OR
                              sr.registration_number LIKE ?
                            )`;
        queryParams.push(
          `%${searchText}%`,
          `%${searchText}%`,
          `%${searchText}%`,
          `%${searchText}%`
        );
      }

      const havingParts = [];
      const havingParams = [];
      if (minApps > 0) {
        havingParts.push("COUNT(DISTINCT a.id) >= ?");
        havingParams.push(minApps);
      }
      if (maxApps !== null && Number.isFinite(maxApps)) {
        havingParts.push("COUNT(DISTINCT a.id) <= ?");
        havingParams.push(maxApps);
      }
      const havingSql = havingParts.length ? `HAVING ${havingParts.join(" AND ")}` : "";

      // Summary matches Waombaji list (users + resolved registry type from their applications).
      if (!searchText) {
        // No HAVING here; we apply min/max filters on COALESCE(total_applications, 0) in the outer query
        // so users with 0 applications are handled correctly.
        const appsAggSql = `
          SELECT
            a.user_id,
            COUNT(DISTINCT a.registry_type_id) AS registry_type_distinct_count,
            CASE
              WHEN COUNT(DISTINCT a.registry_type_id) = 1 THEN MIN(a.registry_type_id)
              ELSE NULL
            END AS registry_type_id,
            COUNT(DISTINCT a.id) AS total_applications
          FROM applications a
          WHERE a.user_id IS NOT NULL
          GROUP BY a.user_id
        `;

        const filterParts = [];
        const filterParams = [];
        if (minApps > 0) {
          filterParts.push("COALESCE(au.total_applications, 0) >= ?");
          filterParams.push(minApps);
        }
        if (maxApps !== null && Number.isFinite(maxApps)) {
          filterParts.push("COALESCE(au.total_applications, 0) <= ?");
          filterParams.push(maxApps);
        }
        const filterSql = filterParts.length ? `WHERE ${filterParts.join(" AND ")}` : "";

        return db.query(
          `SELECT 
              t.registry_type_id,
              t.registry_type,
              COUNT(*) AS total
            FROM (
              SELECT
                u.id AS user_id,
                CASE
                  WHEN ap.id IS NULL THEN NULL
                  WHEN au.registry_type_distinct_count = 1 THEN au.registry_type_id
                  ELSE NULL
                END AS registry_type_id,
                CASE
                  WHEN ap.id IS NULL THEN 'UNKNOWN'
                  WHEN au.registry_type_distinct_count = 1 THEN COALESCE(rt.registry, 'UNKNOWN')
                  WHEN au.registry_type_distinct_count > 1 THEN 'MIXED'
                  ELSE 'UNKNOWN'
                END AS registry_type
              FROM users u
              LEFT JOIN (
                SELECT user_id, MIN(id) AS id
                FROM applicants
                WHERE user_id IS NOT NULL
                GROUP BY user_id
              ) ap ON ap.user_id = u.id
              LEFT JOIN (${appsAggSql}) au ON au.user_id = u.id
              LEFT JOIN registry_types rt ON rt.id = au.registry_type_id
              ${filterSql}
            ) t
            GROUP BY t.registry_type_id, t.registry_type
            ORDER BY total DESC`,
          filterParams,
          (error, rows) => {
            if (error) {
              console.log(error);
              return callback(error, []);
            }
            callback(null, Array.isArray(rows) ? rows : []);
          }
        );
      }

      const locationJoins = `
        LEFT JOIN establishing_schools es ON es.id = a.establishing_school_id
        LEFT JOIN school_registrations sr ON es.id = sr.establishing_school_id`;

      const baseSql = `FROM users u
          LEFT JOIN (
            SELECT user_id, MIN(id) AS id
            FROM applicants
            WHERE user_id IS NOT NULL
            GROUP BY user_id
          ) ap ON ap.user_id = u.id
          LEFT JOIN applications a ON a.user_id = u.id
          LEFT JOIN registry_types rt ON rt.id = a.registry_type_id
          ${locationJoins}
          WHERE 1 = 1
          ${searchQuery}`;

      db.query(
        `SELECT 
            registry_type_id,
            registry_type,
            COUNT(*) AS total
          FROM (
            SELECT
              u.id,
              CASE
                WHEN MAX(ap.id) IS NULL THEN NULL
                WHEN COUNT(DISTINCT a.registry_type_id) = 1 THEN MIN(a.registry_type_id)
                ELSE NULL
              END AS registry_type_id,
              CASE
                WHEN MAX(ap.id) IS NULL THEN 'UNKNOWN'
                WHEN COUNT(DISTINCT a.registry_type_id) = 1 THEN MAX(rt.registry)
                WHEN COUNT(DISTINCT a.registry_type_id) > 1 THEN 'MIXED'
                ELSE 'UNKNOWN'
              END AS registry_type
            ${baseSql}
            GROUP BY u.id
            ${havingSql}
          ) t
          GROUP BY registry_type_id, registry_type
          ORDER BY total DESC`,
        queryParams.concat(havingParams),
        (error, rows) => {
          if (error) {
            console.log(error);
            return callback(error, []);
          }

          const summary = Array.isArray(rows) ? rows : [];
          callback(null, summary);
        }
      );
    },
  // LOOK FOR APPLICANTS
  lookForApplicants: (offset, per_page, search, exclude, callback) => {
    const keyword = db.escape(`%${search}%`);
    const email = db.escape(`${exclude}`);
    const searchSql = search
      ? ` WHERE (u.name LIKE ${keyword} OR u.email LIKE ${keyword})`
      : "";
    const excludeSql = exclude
      ? (search ? ` AND ` : ` WHERE `) + ` u.email <> ${email}`
      : "";
    const sql = `SELECT u.id AS id, u.email AS text
                      FROM users u ${searchSql} 
                      ${excludeSql}
                      ORDER BY u.email ASC
                      LIMIT ? , ?`;

    db.query(sql, [offset, per_page], (error, users) => {
      if (error) {
        console.log(error);
      }
      callback(error, users);
    });
  },
  //
  findOneApplicant : (applicantId , callback) => {
      const id = db.escape(Number(applicantId));
      db.query(`SELECT u.id AS id, u.name AS name , u.email AS email, u.created_at AS created_at, 
                    IFNULL(COUNT(a.id)  , 0) AS total,
                    MAX(ap.applicant_id) AS applicant_id,
                    MAX(ap.registry_type_id) AS applicant_registry_type_id
                    FROM users u
                    LEFT JOIN (
                      SELECT user_id, MIN(id) AS applicant_id, MAX(registry_type_id) AS registry_type_id
                      FROM applicants
                      WHERE user_id IS NOT NULL
                      GROUP BY user_id
                    ) ap ON ap.user_id = u.id
                    LEFT JOIN applications a ON a.user_id = u.id 
                    WHERE u.id = ${id}
                    GROUP BY id` , (error , applicant) => {
                        if(error) console.log(error)
                        callback(error , applicant);
                    });
  },
  //   FIND AN APPLICANT
  findApplicant: (offset, per_page, applicantId, callback) => {
    const id = db.escape(Number(applicantId));
    db.query(
      `SELECT u.id AS id, u.name AS name , u.email AS email, u.created_at AS created_at, 
                    IFNULL(COUNT(a.id)  , 0) AS total,
                    MAX(ap.applicant_id) AS applicant_id,
                    MAX(ap.registry_type_id) AS applicant_registry_type_id
                    FROM users u
                    LEFT JOIN (
                      SELECT user_id, MIN(id) AS applicant_id, MAX(registry_type_id) AS registry_type_id
                      FROM applicants
                      WHERE user_id IS NOT NULL
                      GROUP BY user_id
                    ) ap ON ap.user_id = u.id
                    LEFT JOIN applications a ON a.user_id = u.id 
                    WHERE u.id = ${id}
                    GROUP BY id`,
      (error, applicant) => {
        if (error) {
          console.log(error);
        }
        const applicationsSql = ` 
                      FROM applications a 
                      JOIN application_categories c ON c.id = a.application_category_id 
                      JOIN maoni m ON m.id =  (
                                              SELECT max(m.id)
                                              FROM applications a1
                                              JOIN maoni m ON m.trackingNo = a1.tracking_number 
                                              WHERE a1.user_id = ${id}
                                              ORDER BY m.id DESC
                                              )
                      LEFT JOIN staffs s ON s.id = m.user_to
                      LEFT JOIN roles v ON s.user_level = v.id 
                      WHERE a.user_id = ${id}`;

        db.query(
          `SELECT a.id AS id, c.app_name AS application_category,  
                           a.tracking_number AS tracking_number, is_approved, 
                           a.created_at AS created_at, v.name AS cheo 
                            ${applicationsSql} 
                            #GROUP BY m.trackingNo, a.id , application_category, created_at, cheo
                            LIMIT ?, ?`,
          [offset, per_page],
          (error2, applications) => {
            if (error2) {
              error = error2;
              console.log(error2);
            }

            db.query(
              `SELECT count(*) AS num_rows ${applicationsSql}`,
              (error3, result) => {
                if (error3) {
                  error = error3;
                  console.log(error3);
                }
                 callback(
                   error,
                   applicant,
                   applications,
                   result[0].num_rows,
                  //  schools,
                  //  result2[0].num_rows,
                  //  attachments,
                  //  result3[0].num_rows
                 );
              }
            );
          }
        );
      }
    );
  },
// get applicant schools
getApplicantSchools: (offset, per_page, applicant_id, search_value, callback) => {
    var searchQuery = "";
    var queryParams = [];
    if (search_value) {
      searchQuery += ` AND (a.tracking_number LIKE ? OR 
                            e.school_name LIKE ? OR
                            s.registration_number LIKE ? 
                          )`;
      queryParams.push(`%${search_value}%`, `%${search_value}%` , `%${search_value}%`);
    }
    // Show all schools for this applicant (even if not yet registered).
    // Registration details will be null when the school is not registered.
    let sql = `FROM applications a
               JOIN establishing_schools e ON e.id = a.establishing_school_id
               LEFT JOIN school_registrations s ON s.establishing_school_id = e.id AND s.reg_status = 1
               LEFT JOIN school_categories sc ON sc.id = e.school_category_id
               ${schoolLocationsSqlJoin()}
               WHERE a.user_id = ${applicant_id} AND a.establishing_school_id IS NOT NULL
                ${searchQuery}
                `;
    db.query(
      `SELECT
              MAX(a.tracking_number) AS tracking_number,
              MAX(s.registration_number) AS reg_number,
              e.school_name AS name,
              MAX(s.registration_date) AS registration_date,
              MAX(sc.category) AS type,
              MAX(r.RegionName) AS region,
              MAX(d.LgaName) AS district,
              MAX(w.WardName) AS ward,
              MAX(st.StreetName) AS village
             ${sql}
             GROUP BY e.id
             ORDER BY MAX(a.created_at) DESC
             ${per_page > 0 ? "LIMIT ? , ?" : ""}
             `,
      per_page > 0 ? queryParams.concat([offset, per_page]) : queryParams,
      (error, users) => {
        if (error) console.log(error);
        db.query(
          `SELECT COUNT(*) AS num_rows FROM (SELECT e.id ${sql} GROUP BY e.id) t`,
          queryParams,
          (error2, result2) => {
            if (error2) {
              error = error2;
              console.log(error);
            }
            callback(error, users, result2[0].num_rows);
          }
        );
      }
    );
    // const id = db.escape(Number(applicantId));
    // const keyword = db.escape(`%${search}%`);
    // const searchSql = search
    //   ? ` AND (
    //           e.school_name LIKE ${keyword} OR 
    //           s.registration_number LIKE ${keyword} OR
    //           s.tracking_number LIKE ${keyword} 
    //         )`
    //   : "";
    // const attachmentSearch = search ? ` AND a.tracking_number LIKE ${keyword} OR 
    //                                     at.attachment_name LIKE ${keyword}` : ""
    // db.query(
    //   `SELECT u.id AS id, u.name AS name , u.email AS email, u.created_at AS created_at, 
    //                 IFNULL(COUNT(a.id)  , 0) AS total
    //                 FROM users u
    //                 LEFT JOIN applications a ON a.user_id = u.id 
    //                 WHERE u.id = ${id}
    //                 GROUP BY id`,
    //   (error, applicant) => {
    //     if (error) {
    //       console.log(error);
    //     }
    //     const applicationsSql = ` 
    //                   FROM applications a 
    //                   JOIN application_categories c ON c.id = a.application_category_id 
    //                   JOIN maoni m ON m.id =  (
    //                                           SELECT max(m.id)
    //                                           FROM applications a1
    //                                           JOIN maoni m ON m.trackingNo = a1.tracking_number 
    //                                           WHERE a1.user_id = ${id}
    //                                           ORDER BY m.id DESC
    //                                           )
    //                   LEFT JOIN staffs s ON s.id = m.user_to
    //                   LEFT JOIN roles v ON s.user_level = v.id 
    //                   WHERE a.user_id = ${id}`;

    //     db.query(
    //       `SELECT a.id AS id, c.app_name AS application_category,  
    //                        a.tracking_number AS tracking_number, is_approved, 
    //                        a.created_at AS created_at, v.name AS cheo 
    //                         ${applicationsSql} 
    //                         #GROUP BY m.trackingNo, a.id , application_category, created_at, cheo
    //                         LIMIT ?, ?`,
    //       [offset, per_page],
    //       (error2, applications) => {
    //         if (error2) {
    //           error = error2;
    //           console.log(error2);
    //         }

    //         db.query(
    //           `SELECT count(*) AS num_rows ${applicationsSql}`,
    //           (error3, result) => {
    //             if (error3) {
    //               error = error3;
    //               console.log(error3);
    //             }
    //             const schoolsSql = `FROM school_registrations s
    //                                                 LEFT JOIN establishing_schools e ON e.id = s.establishing_school_id
    //                                                 LEFT JOIN school_categories sc ON sc.id = e.school_category_id
    //                                                 LEFT JOIN applications a ON a.tracking_number = e.tracking_number
    //                                                 ${schoolLocationsSqlJoin()}
    //                                                 WHERE a.user_id = ${id} AND reg_status = 1`;

    //             db.query(
    //               `SELECT s.registration_number AS reg_number , e.school_name AS name, 
    //                                             e.tracking_number AS tracking_number ,s.registration_date AS registration_date,
    //                                             sc.category AS type , 
    //                                             r.RegionName AS region, d.LgaName AS district, w.WardName AS ward, st.StreetName AS village
    //                                             ${schoolsSql} ${searchSql}
    //                                             LIMIT ?, ?`,
    //               [offset, per_page],
    //               (error4, schools) => {
    //                 if (error4) {
    //                   error = error4;
    //                   console.log(error4);
    //                 }
    //                 db.query(
    //                   `SELECT COUNT(*) as num_rows ${schoolsSql} ${searchSql}`,
    //                   (error5, result2) => {
    //                     if (error5) {
    //                       error = error5;
    //                       console.log(error5);
    //                     }

    //                     const attachmentSql = ` FROM attachments a
    //                                             JOIN applications ap ON ap.tracking_number = a.tracking_number
    //                                             JOIN attachment_types at ON at.id = a.attachment_type_id
    //                                             JOIN application_categories ac ON ac.id = at.application_category_id
    //                                             WHERE ap.user_id = ${id} `;
    //                     db.query(
    //                       `SELECT at.attachment_name AS name , ac.app_name AS application_category_name,
    //                                             a.tracking_number AS tracking_number , 
    //                                             attachment_path , a.created_at AS created_at
    //                                             ${attachmentSql} ${attachmentSearch}
    //                                             LIMIT ?,?`,
    //                       [offset, per_page],
    //                       (error6, attachments) => {
    //                         if (error6) {
    //                           error = error6;
    //                           console.log(error);
    //                         }
    //                         db.query(
    //                           `SELECT count(*) AS num_rows ${attachmentSql} ${attachmentSearch}`,
    //                           (error7, result3) => {
    //                             if (error7) {
    //                               error = error7;
    //                               console.log(error);
    //                             }
    //                             callback(
    //                               error,
    //                               applicant,
    //                               applications,
    //                               result[0].num_rows,
    //                               schools,
    //                               result2[0].num_rows,
    //                               attachments,
    //                               result3[0].num_rows
    //                             );
    //                           }
    //                         );
    //                       }
    //                     );
    //                   }
    //                 );
    //               }
    //             );
    //           }
    //         );
    //       }
    //     );
    //   }
    // );
  },
  changeApplicant: (applicantData, callback) => {
    const sql = `UPDATE applications SET user_id = ? WHERE tracking_number = ?`;
    var success = false;
    db.query(sql, applicantData, (error, result) => {
      if (error) {
        console.log(error);
      }
      if (result.affectedRows > 0) {
        success = true;
      }
      callback(success);
    });
  },

  transferGovernmentSchoolsToApplicant: (payload = {}, callback) => {
    const safeUserId = Number.parseInt(payload?.user_id, 10);
    const safeApplicantId = Number.parseInt(payload?.applicant_id, 10);
    const safeLgaCode = String(payload?.lga_code || "").trim();
    const safeRegistryTypeId = Number.parseInt(payload?.registry_type_id, 10);
    if (!Number.isFinite(safeUserId) || safeUserId <= 0) {
      return callback(new Error("Invalid user_id"), { affectedRows: 0 });
    }
    if (!Number.isFinite(safeApplicantId) || safeApplicantId <= 0) {
      return callback(new Error("Invalid applicant_id"), { affectedRows: 0 });
    }
    if (!safeLgaCode) {
      return callback(new Error("Invalid lga_code"), { affectedRows: 0 });
    }
    if (safeRegistryTypeId !== 3) {
      return callback(new Error("registry_type_id must be 3"), { affectedRows: 0 });
    }

    db.query(
      `SELECT id, user_id, registry_type_id
       FROM applicants
       WHERE id = ?
       LIMIT 1`,
      [safeApplicantId],
      (error, rows) => {
        if (error) {
          console.log(error);
          return callback(error, { affectedRows: 0 });
        }
        const applicantRow = rows && rows[0] ? rows[0] : null;
        if (!applicantRow) {
          return callback(new Error("Applicant not found"), { affectedRows: 0 });
        }
        if (Number(applicantRow.user_id) !== safeUserId) {
          return callback(new Error("applicant_id does not belong to user_id"), { affectedRows: 0 });
        }
        if (Number(applicantRow.registry_type_id) !== safeRegistryTypeId) {
          return callback(new Error("Applicant registry_type_id is not 3"), { affectedRows: 0 });
        }

        db.beginTransaction((txError) => {
          if (txError) {
            console.log(txError);
            return callback(txError, { affectedRows: 0 });
          }

          const updateSchoolsSql = `
            UPDATE establishing_schools e
            JOIN wards w ON w.WardCode = e.ward_id
            SET e.applicant_id = ?
            WHERE w.LgaCode = ?
              AND e.registry_type_id = ?
              AND (e.applicant_id IS NULL OR e.applicant_id <> ?)`;

          db.query(
            updateSchoolsSql,
            [safeApplicantId, safeLgaCode, safeRegistryTypeId, safeApplicantId],
            (error2, schoolsResult) => {
              if (error2) {
                return db.rollback(() => {
                  console.log(error2);
                  callback(error2, { schoolsUpdated: 0, applicationsUpdated: 0 });
                });
              }

              const updateApplicationsSql = `
                UPDATE applications a
                JOIN establishing_schools e ON e.id = a.establishing_school_id
                JOIN wards w ON w.WardCode = e.ward_id
                SET a.user_id = ?
                WHERE w.LgaCode = ?
                  AND e.registry_type_id = ?
                  AND e.applicant_id = ?
                  AND (a.user_id IS NULL OR a.user_id <> ?)`;

              db.query(
                updateApplicationsSql,
                [safeUserId, safeLgaCode, safeRegistryTypeId, safeApplicantId, safeUserId],
                (error3, appsResult) => {
                  if (error3) {
                    return db.rollback(() => {
                      console.log(error3);
                      callback(error3, { schoolsUpdated: 0, applicationsUpdated: 0 });
                    });
                  }

                  db.commit((commitError) => {
                    if (commitError) {
                      return db.rollback(() => {
                        console.log(commitError);
                        callback(commitError, { schoolsUpdated: 0, applicationsUpdated: 0 });
                      });
                    }

                    callback(null, {
                      schoolsUpdated: Number(schoolsResult?.affectedRows || 0),
                      applicationsUpdated: Number(appsResult?.affectedRows || 0),
                    });
                  });
                }
              );
            }
          );
        });
      }
    );
  },
};
