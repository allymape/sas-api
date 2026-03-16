const db = require("../config/database");
const { schoolLocationsSqlJoin, establishedApplicationRegisteredSchoolsSqlJoin, applicationEstablishedRegisteredSchoolsSqlJoin, formatDate, registeredSchoolsEstablishedApplicationSqlJoin, auditMiddleware, insertAudit, formatIp } = require("../utils");

module.exports = {
  //******** GET A LIST OF REGISTERED SCHOOLS *******************************
  getAllSchools: (
    offset,
    per_page,
    type_search,
    owner_search,
    invalid_or_no_reg_search,
    geolocation_search,
    duplicate_reg_search,
    delete_duplicate,
    correction,
    search_value,
    callback,
    req = null
  ) => {
    const { sehemu, zone_id, district_code } = req.user;
    const searchParts = [];
    const queryParams = [];
    const needsLocationFilter = sehemu == "k1" || sehemu == "w1";
    const hasSearch = Boolean(String(search_value || "").trim());
    const needsVerificationJoin = correction == 1;
    const needsLocationSearch = hasSearch;

    if (search_value) {
      searchParts.push(`(e.school_name LIKE ? OR 
                              s.registration_number LIKE ? OR 
                              r.RegionName LIKE ? OR 
                              d.LgaName LIKE ? OR 
                              w.WardName LIKE ? OR 
                              st.StreetName LIKE ?
                            )`);
      queryParams.push(
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`
      );
    }
    if (type_search) {
      searchParts.push(`e.school_category_id = ?`);
      queryParams.push(Number(type_search));
    }
    if (owner_search) {
      searchParts.push(`a.registry_type_id = ?`);
      queryParams.push(Number(owner_search));
    }
    if (invalid_or_no_reg_search == 1) {
      searchParts.push(`s.registration_number NOT LIKE "EA.%" AND 
                             s.registration_number NOT LIKE "EM.%" AND
                             s.registration_number NOT LIKE "S.%"  AND
                             s.registration_number NOT LIKE "CU.%" AND
                             s.registration_number NOT LIKE '% %'`);
    }
    if (geolocation_search == 1) {
      searchParts.push(`e.latitude IS NOT NULL AND e.longitude IS NOT NULL`);
    }
   
    if (correction == 1) {
      searchParts.push(`s.is_verified = 0  AND sv.corrected = 0`);
    }
    if (geolocation_search == 2) {
      searchParts.push(`(e.latitude IS NULL OR e.longitude IS NULL)`);
    }
    if (duplicate_reg_search == 1) {
      searchParts.push(`EXISTS (
                    SELECT 1
                    FROM school_registrations sr2
                    WHERE sr2.registration_number = s.registration_number
                    GROUP BY sr2.registration_number
                    HAVING COUNT(*) > 1
                  )`);
    }

    const whereParts = [`s.reg_status IN (1)`];
    if (sehemu == "k1") {
      whereParts.push(`r.zone_id = ${Number(zone_id) || 0}`);
    }
    if (sehemu == "w1") {
      whereParts.push(`d.LgaCode = ${db.escape(district_code)}`);
    }
    if (searchParts.length > 0) {
      whereParts.push(...searchParts);
    }

    const dataFromSql = `FROM school_registrations s 
                      JOIN establishing_schools e ON s.establishing_school_id = e.id
                      JOIN applications a ON a.tracking_number = s.tracking_number
                      JOIN school_categories sc ON sc.id = e.school_category_id
                      LEFT JOIN registry_types rt ON rt.id = a.registry_type_id
                      LEFT JOIN school_verifications sv ON sv.tracking_number = s.tracking_number
                      LEFT JOIN users u ON u.id = a.user_id
                      ${schoolLocationsSqlJoin()}
                      WHERE ${whereParts.join("\n                      AND ")}
                      ORDER BY e.school_name ASC`;

    const countJoins = [
      `FROM school_registrations s`,
      `JOIN establishing_schools e ON s.establishing_school_id = e.id`,
      `JOIN applications a ON a.tracking_number = s.tracking_number`,
    ];

    if (needsVerificationJoin) {
      countJoins.push(`LEFT JOIN school_verifications sv ON sv.tracking_number = s.tracking_number`);
    }

    if (needsLocationFilter || needsLocationSearch) {
      countJoins.push(schoolLocationsSqlJoin());
    }

    const countSql = `${countJoins.join("\n                      ")}
                      WHERE ${whereParts.join("\n                      AND ")}`;

    db.query(
      `SELECT s.tracking_number AS id,
              e.id AS school_id,
              school_name AS name, 
              s.registration_number AS reg_no, 
              rt.registry AS ownership,
              sc.category AS category,
              e.file_number AS file_number,
              (SELECT COUNT(*) FROM applications app2 WHERE app2.establishing_school_id = e.id) AS applications_count,
              IFNULL(s.school_opening_date , '') AS opening_date, 
              r.RegionName AS region, 
              latitude,longitude,
              u.name AS applicant_name,
              u.email AS applicant_email,
              d.LgaName AS lga,
              w.WardName AS ward, 
              st.StreetName AS street,
              IFNULL(s.registration_date , '') AS reg_date, 
              DATE_FORMAT(s.updated_at , '%Y-%m-%d %H:%i:%s') AS updated_at, 
              CASE 
                  WHEN s.reg_status = 1 THEN 'Imesajiliwa'
                  WHEN s.reg_status = 0 THEN 'Imefutiwa Usajili'
                  ELSE 'Unknown'
              END AS status,
              s.is_verified AS is_verified,
              sv.corrected AS corrected,
              sv.description AS description,
              s.reg_status AS reg_status
              ${dataFromSql}
              ${per_page > 0 ? "LIMIT ? , ?" : ""}`,
      per_page > 0 ? queryParams.concat([offset, per_page]) : queryParams,
      (error, schools) => {
        if (error) console.log(error);
        const schoolRows = Array.isArray(schools) ? schools : [];
        db.query(
          `SELECT COUNT(*) AS num_rows ${countSql}`,
          queryParams,
          (error2, result2) => {
            if (error2) {
              error = error2;
              console.log(error);
            }
            
            if (schoolRows.length > 0) {
               if (delete_duplicate && Number(delete_duplicate) == 1) {
                 const msg = "Amefuta taarifa za shule zinazojirudia.";
                 console.log(msg)
                 const { user, body, url } = req;
                 const { id, user_level } = user;
                 const { clientInfo } = body;
                 delete body.clientInfo;
                 const { ip, browserInfo } = clientInfo;
                 const { os, browser, platform } = browserInfo;
                 const browser_used = `${os} ${browser} ${platform}`;
                 const ip_address = formatIp(ip);
                 insertAudit(
                   id,
                   "Delete",
                   null,
                   null,
                   url,
                   browser_used,
                   user_level,
                   msg,
                   ip_address,
                   "school_registrations"
                 );
                 module.exports.deleteDuplicateSchools();
               }
            }
            db.query(
              `SELECT COUNT(*) AS missing_rows
                 FROM establishing_schools
                WHERE file_number IS NULL OR TRIM(file_number) = ''`,
              (error3, result3) => {
                if (error3) {
                  console.log(error3);
                }

                callback(
                  error || error2 || error3,
                  schoolRows,
                  result2?.[0]?.num_rows || 0,
                  result3?.[0]?.missing_rows || 0
                );
              }
            );
          }
        );
      }
    );
  },
  getSchoolFiles: (
    offset,
    per_page,
    search_value,
    sort_by,
    sort_dir,
    req,
    callback
  ) => {
    const { sehemu, zone_id, district_code } = req.user || {};
    const needsLocationFilter = sehemu === "k1" || sehemu === "w1";
    const joins = [];
    const whereParts = ["1 = 1"];
    const queryParams = [];
    const sortableColumns = {
      name: "e.school_name",
      reg_no: "s.registration_number",
      category: "sc.category",
      ownership: "rt.registry",
      file_number: "e.file_number",
      applications_count: "IFNULL(ax.applications_count, 0)",
    };
    const orderColumn = sortableColumns[String(sort_by || "").trim()] || "e.school_name";
    const orderDir = String(sort_dir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
    const sortKey = String(sort_by || "").trim();
    const orderClause =
      sortKey === "reg_no"
        ? `
          CASE
            WHEN s.registration_number IS NULL OR TRIM(s.registration_number) = '' THEN 1
            ELSE 0
          END ASC,
          UPPER(SUBSTRING_INDEX(TRIM(s.registration_number), '.', 1)) ${orderDir},
          CAST(SUBSTRING_INDEX(TRIM(s.registration_number), '.', -1) AS UNSIGNED) ${orderDir},
          UPPER(TRIM(s.registration_number)) ${orderDir},
          e.id ASC
        `
        : `${orderColumn} ${orderDir}, e.id ASC`;

    if (needsLocationFilter) {
      joins.push(schoolLocationsSqlJoin());
      if (sehemu === "k1") {
        whereParts.push(`r.zone_id = ?`);
        queryParams.push(Number(zone_id) || 0);
      } else if (sehemu === "w1") {
        whereParts.push(`d.LgaCode = ?`);
        queryParams.push(String(district_code || ""));
      }
    }

    const keyword = String(search_value || "").trim();
    if (keyword) {
      whereParts.push(
        `(e.school_name LIKE ? OR
          s.registration_number LIKE ? OR
          sc.category LIKE ? OR
          rt.registry LIKE ? OR
          e.file_number LIKE ?)`
      );
      const like = `%${keyword}%`;
      queryParams.push(like, like, like, like, like);
    }

    const baseSql = `
      FROM establishing_schools e
      LEFT JOIN (
        SELECT
          sr.establishing_school_id,
          MAX(sr.id) AS latest_registration_id
        FROM school_registrations sr
        WHERE sr.reg_status = 1
        GROUP BY sr.establishing_school_id
      ) srx ON srx.establishing_school_id = e.id
      LEFT JOIN school_registrations s ON s.id = srx.latest_registration_id
      LEFT JOIN school_categories sc ON sc.id = e.school_category_id
      LEFT JOIN (
        SELECT
          a.establishing_school_id,
          MAX(a.id) AS latest_application_id,
          COUNT(*) AS applications_count
        FROM applications a
        GROUP BY a.establishing_school_id
      ) ax ON ax.establishing_school_id = e.id
      LEFT JOIN applications a ON a.id = ax.latest_application_id
      LEFT JOIN registry_types rt ON rt.id = a.registry_type_id
      ${joins.join("\n")}
      WHERE ${whereParts.join(" AND ")}
    `;

    const listSql = `
      SELECT
        e.id AS school_id,
        e.school_name AS name,
        s.registration_number AS reg_no,
        sc.category AS category,
        rt.registry AS ownership,
        e.file_number AS file_number,
        IFNULL(ax.applications_count, 0) AS applications_count
      ${baseSql}
      ORDER BY ${orderClause}
      ${per_page > 0 ? "LIMIT ?, ?" : ""}
    `;

    const listParams = per_page > 0
      ? queryParams.concat([offset, per_page])
      : queryParams;

    db.query(listSql, listParams, (error, rows = []) => {
      if (error) {
        console.log(error);
        callback(error, [], 0, 0);
        return;
      }

      const countSql = `SELECT COUNT(*) AS num_rows ${baseSql}`;
      db.query(countSql, queryParams, (countError, countRows = []) => {
        if (countError) {
          console.log(countError);
          callback(countError, [], 0, 0);
          return;
        }

        db.query(
          `SELECT COUNT(*) AS total
             FROM establishing_schools
            WHERE file_number IS NULL OR TRIM(file_number) = ''`,
          (missingError, missingRows = []) => {
            if (missingError) {
              console.log(missingError);
              callback(missingError, rows, Number(countRows?.[0]?.num_rows || 0), 0);
              return;
            }

            callback(
              null,
              rows,
              Number(countRows?.[0]?.num_rows || 0),
              Number(missingRows?.[0]?.total || 0)
            );
          }
        );
      });
    });
  },
  // LOOK FOR SCHOOLS
  lookForSchools: (offset, per_page, search, callback) => {
    const keyword = db.escape(`%${search}%`);
    const searchSql = search
      ? ` AND e.school_name LIKE ${keyword} `
      : "";
    const sql = `SELECT e.tracking_number AS id, e.school_name AS text , s.registration_number AS registration_number,
                    r.RegionName AS region, d.LgaName AS district, w.WardName AS ward
                            FROM school_registrations s
                            ${registeredSchoolsEstablishedApplicationSqlJoin()} 
                            ${schoolLocationsSqlJoin()}
                            WHERE s.reg_status = 1
                             ${searchSql}
                            ORDER BY school_name ASC
                            LIMIT ? , ?`;
    // console.log(sql);
    db.query(sql, [offset, per_page], (error, schools) => {
      if (error) {
        console.log(error);
      }
      console.log(schools);
      callback(error, schools);
    });
  },
  //******** STORE SCHOOLS *******************************
  storeSchools: (
    established_schools,
    applications,
    school_registrations,
    owners,
    applicants,
    callback
  ) => {
    var success = false;
    db.query(
      `INSERT INTO establishing_schools (id, school_name, secure_token,school_phone, tracking_number, is_for_disabled, is_hostel, stage,ward_id, village_id, school_email, po_box ,school_category_id , created_at , updated_at) VALUES ? 
       ON DUPLICATE KEY UPDATE school_name = VALUES(school_name), stage=VALUES(stage), school_phone =  VALUES(school_phone), ward_id = VALUES(ward_id), village_id = VALUES(village_id), updated_at = VALUES(updated_at), tracking_number = VALUES(tracking_number) , school_category_id = VALUES(school_category_id)`,
      [established_schools],
      (err, established) => {
        if (err) {
          console.log(err);
        }
        if (established) {
          db.query(
            `INSERT INTO applications (id,staff_id,secure_token,foreign_token,tracking_number,user_id,application_category_id,
                                        registry_type_id,is_approved,status_id,is_complete,payment_status_id , approved_at, created_at,updated_at) 
                                        VALUES ? 
              ON DUPLICATE KEY UPDATE 
                          secure_token=VALUES(secure_token),foreign_token=VALUES(foreign_token),user_id=VALUES(user_id), staff_id=VALUES(staff_id), tracking_number=VALUES(tracking_number), 
                          is_approved=VALUES(is_approved), application_category_id=VALUES(application_category_id), 
                          registry_type_id=VALUES(registry_type_id), payment_status_id=VALUES(payment_status_id), 
                          approved_at = VALUES(approved_at),
                          updated_at=VALUES(updated_at)`,
            [applications],
            (err2, application) => {
              if (err2) {
                console.log(err2);
              }
              if (application) {
                db.query(`SET sql_mode = "NO_ZERO_IN_DATE"`, (modeError) => {
                  if (modeError) {
                    console.log(modeError);
                  }
                  //  console.log(school_registrations);
                  db.query(
                    `INSERT INTO school_registrations (id,secure_token,establishing_school_id,tracking_number,school_opening_date,registration_date,registration_number, reg_status, created_at, updated_at) 
                        VALUES ? ON DUPLICATE KEY UPDATE establishing_school_id=VALUES(establishing_school_id), secure_token=VALUES(secure_token), registration_number=VALUES(registration_number), tracking_number=VALUES(tracking_number), 
                                                        reg_status=VALUES(reg_status), school_opening_date = VALUES(school_opening_date) , registration_date = VALUES(registration_date), created_at=VALUES(created_at) , 
                                                        updated_at=VALUES(updated_at)`,
                    [school_registrations],
                    (err3, registered) => {
                      if (err || err2 || err3) {
                        console.log(err, err2, err3);
                      }

                      db.query(
                        `INSERT INTO personal_infos (id, secure_token , first_name , ward_id , created_at)
                                   VALUES ? ON DUPLICATE KEY UPDATE secure_token=VALUES(secure_token), first_name = VALUES(first_name), 
                                   middle_name = VALUES(middle_name), last_name = VALUES(last_name), ward_id = VALUES(ward_id)`,
                        [applicants],
                        (err4) => {
                          if (err4) console.log(err4);
                          db.query(
                            `INSERT INTO owners (id, secure_token , establishing_school_id , tracking_number , owner_name ,created_at) 
                                                VALUES ? ON DUPLICATE KEY UPDATE secure_token=VALUES(secure_token), owner_name = VALUES(owner_name) , tracking_number = VALUES(tracking_number)`,
                            [owners],
                            (err5, owners) => {
                              if (err5) console.log(err5);
                              if (owners) {
                                success = true;
                              }
                              callback(success);
                            }
                          );
                        }
                      );
                    }
                  );
                });
              }
            }
          );
        }
      }
    );
  },
  // find school
  checkIfExistSchool: (reg_number, callback) => {
    var exist = false;
    db.query(
      `SELECT * FROM school_registrations s WHERE registration_number = ?`,
      [reg_number],
      (error, res) => {
        if (error) console.log(error);
        if (res.length > 0) {
          exist = true;
        }
        callback(exist);
      }
    );
  },
  // find last id
  lastSchoolId: (callback) => {
    db.query(`SELECT MAX(id) AS id FROM applications`, (err, res) => {
      if (err) console.log(err);
      var id = 0;
      if (res.length > 0) {
        id = res[0].id;
      }
      callback(id);
    });
  },
  // Edit School
  editSchool: (tracking_number, callback) => {
    db.query(
      `SELECT e.id AS id, e.school_name AS name, e.school_category_id AS category,latitude,longitude,max_folio,file_number,
        IFNULL(DATE(s.registration_date) , null) AS registration_date,
        a.registry_type_id AS ownership, e.tracking_number AS tracking_number,
        s.registration_number AS registration_number, e.village_id AS street, 
        w.WardCode AS ward, d.LgaCode AS lga, r.RegionCode AS region , sv.description AS description, s.is_verified AS is_verified
        FROM school_registrations s
        ${registeredSchoolsEstablishedApplicationSqlJoin()}
        ${schoolLocationsSqlJoin()}
        LEFT JOIN school_verifications sv ON sv.tracking_number = s.tracking_number
        WHERE s.tracking_number = ?`,
      [tracking_number],
      (error, school) => {
        if (error) {
          console.log(error);
        }
        console.log("hii", school);
        callback(error, school[0]);
      }
    );
  },
  updateSchool: (tracking_number, data, callback) => {
    var {
      school_name,
      kata,
      mtaa,
      category,
      registration_date,
      registration_number,
      ownership,
      file_number,
      max_folio,
      latitude,
      longitude,
    } = data;
  
    var message = "";
    registration_number = registration_number.replace(/\s+/g, "");
    db.query(
      `SELECT id 
              FROM school_registrations s 
              WHERE s.registration_number = ? AND s.tracking_number <> ?`,
      [registration_number, tracking_number],
      (err, results) => {
        if (err) console.log(err);
        // Update
        if (results.length == 0) {
          const currentDate = formatDate(new Date());
          const values = [
            school_name,
            latitude ? parseFloat(latitude) : null,
            longitude ? parseFloat(longitude) : null,
            kata,
            mtaa,
            category,
            4,
            ownership,
            registration_number,
            registration_date,
            file_number,
            max_folio,
            1,
            currentDate,
            currentDate,
            currentDate,
            currentDate,
            tracking_number,
          ];
          //  console.log(values , data)
          db.query(
            `UPDATE  school_registrations s
                  ${registeredSchoolsEstablishedApplicationSqlJoin()}
                  LEFT JOIN school_verifications sv ON sv.tracking_number = s.tracking_number
                  SET e.school_name = ?,
                      e.latitude = ?,
                      e.longitude = ?,
                      e.ward_id = ?,
                      e.village_id = ?,
                      e.school_category_id = ?,
                      a.application_category_id = ?,
                      a.registry_type_id = ?,
                      s.registration_number = ?,
                      s.registration_date = ?,
                      e.file_number = ?,
                      e.max_folio = ?,
                      sv.corrected = ?,
                      s.created_at = ?,
                      s.updated_at = ?,
                      e.updated_at = ?,
                      a.updated_at = ?
                  WHERE s.tracking_number = ?
                  `,
            values,
            (error, result) => {
              if (error) {
                console.log(error);
                message = "Haujafanikiwa kuna tatizo.";
              } else {
                if (result.affectedRows > 0) {
                  message = "Umefanikiwa kufanya mabadiliko.";
                } else {
                  message = "Haujafanikiwa kuna tatizo.";
                }
              }
              callback(error, message);
            }
          );
        } else {
          callback(true, "Namba ya usajili uliyoingiza imeshatumika.");
        }
      }
    );
  },
  changeSchoolName: (req, callback) => {
    const { application_category, newName, trackingId } = req.body;
    if (application_category == 'usajili') {
      console.log('Usajili ...')
      db.query(
        `UPDATE establishing_schools es
           JOIN school_registrations sr ON sr.establishing_school_id = es.id
           SET es.school_name = ? WHERE sr.tracking_number = ?`,
        [newName, trackingId],
        function (error, results) {
          if (error) {
            console.log(error);
          }
          const success = results.affectedRows > 0;
          callback(success);
        }
      );
    } else {
      console.log('Kuanzisha shule ...')
      db.query(
        "UPDATE establishing_schools SET school_name = ? WHERE tracking_number = ?",
        [newName, trackingId],
        function (error, results) {
          if (error) {
            console.log(error);
          }
          const success = results.affectedRows > 0;
          callback(success);
        }
      );
    }
  },
  deleteDuplicateSchools: () => {
    db.query(
      `
      SELECT id, establishing_school_id, tracking_number 
      FROM school_registrations 
      WHERE registration_number IS NOT NULL 
      GROUP BY registration_number 
      HAVING COUNT(*) > 1;`,
      (error, results) => {
        if (error) return console.log(error);
        if (results.length > 0) {
          results.forEach((result) => {
            const { id, establishing_school_id, tracking_number } = result;
            // Delete from `school_registrations`
            db.query(
              `DELETE FROM school_registrations WHERE id = ?`,
              [id],
              (error2 , deletedRegistration) => {
                if (error2) console.log(error2);
                // Delete from `owners`
                if (deletedRegistration.affectedRows > 0) {
                  console.log("School registration record deleted successfully.");
                }
                db.query(
                  `DELETE FROM owners WHERE establishing_school_id = ?`,
                  [establishing_school_id],
                  (error3 , deleteOwners) => {
                    if (error3) console.log(error3);
                    // Delete from `establishing_schools`
                    if (deleteOwners.affectedRows > 0) {
                      console.log(
                        "School owners record deleted successfully."
                      );
                    }
                    db.query(
                      `DELETE FROM establishing_schools WHERE id = ?`,
                      [establishing_school_id],
                      (error4, deleteEstablishing) => {
                        if (error4) console.log(error4);
                        // Delete from `applications`
                        if (deleteEstablishing.affectedRows > 0) {
                          console.log(
                            "School establishment record deleted successfully."
                          );
                        }
                        db.query(
                          `DELETE FROM applications WHERE tracking_number = ?`,
                          [tracking_number],
                          (error5, deleteApplications) => {
                            if (error5) console.log(error5);
                            if (deleteApplications.affectedRows > 0) {
                              console.log(
                                "Application record deleted successfully."
                              );
                            }
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          });
        }
      }
    );

  },
  verifySchool : (tracking_number , callback) => {
      var success = false;
      db.query(
        `UPDATE school_registrations SET is_verified = 1 WHERE tracking_number = ?`,
        [tracking_number],
        (err, result) => {
          if (err) {
            console.log(err);
          }
          success = result.affectedRows > 0; 
          callback(success);
        }
      );
  },
  ombiRekebishaShule : (tracking_number , data , callback) => {
      var success = false;
      db.query(
        `INSERT INTO school_verifications 
                       SET tracking_number = ? , description = ? , created_by = ? , corrected = ? , created_at = ? , updated_at = ?
                       ON DUPLICATE KEY UPDATE description = VALUES(description) ,corrected = VALUES(corrected), created_by =  VALUES(created_by) , updated_at = VALUES(updated_at) `,
        data,
        (error, result) => {
          if (error) {
            console.log(error);
          } else {
            success = result.affectedRows > 0;
            if (success) {
              db.query(
                `UPDATE school_registrations SET is_verified = 0 WHERE tracking_number = ?`,
                [tracking_number],
                (err, result2) => {
                  if (err) {
                    success = false;
                    console.log(err);
                  }
                  callback(success);
                }
              );
            } else {
              callback(success);
            }
          }
        }
      );
  },
  // Reg status 0 imefutiwa usajili, 1 imesajiliwa, 2 iko kwenye mchakato wa kusajiliwa, 3 imefutwa manually, reason duplicates
  deleteSchool : (tracking_number , callback) => {
    var success = false
    db.query(
      `UPDATE school_registrations s
       JOIN applications a ON s.tracking_number = a.tracking_number
       SET a.is_approved = 5, s.reg_status = 3, s.deleted_at = ?
       WHERE s.tracking_number = ?`,
      [formatDate(new Date()), tracking_number],
      (error, result) => {
        if (error) {
          console.log(error);
          callback(success);
        } else {
          console.log(tracking_number);
          success = result.affectedRows;
          callback(success);
        }
      }
    );
  },
  deregisterSchool : (tracking_number , callback) => {
    var success = false
    db.query(
      `UPDATE school_registrations s
       JOIN applications a ON s.tracking_number = a.tracking_number
       SET a.application_category_id = 11, s.reg_status = 0, a.approved_at = ?
       WHERE s.tracking_number = ?`,
      [ formatDate(new Date) , tracking_number],
      (error, result) => {
        if (error) {
          console.log(error);
          callback(success);
        } else {
          console.log(tracking_number);
          success = result.affectedRows;
          callback(success);
        }
      }
    );
  },
  updateSchoolFileNumber: (school_id, file_number, callback) => {
    const schoolId = Number.parseInt(school_id, 10) || 0;
    const normalizedFileNumber = String(file_number || "").trim();
    const normalizedUpper = normalizedFileNumber.toUpperCase();

    if (!schoolId) {
      callback(false, "Shule haijapatikana.");
      return;
    }

    if (!normalizedFileNumber) {
      callback(false, "Namba ya jalada inahitajika.");
      return;
    }

    db.query(
      `SELECT
          e.school_category_id,
          (
            SELECT a.registry_type_id
              FROM applications a
             WHERE a.establishing_school_id = e.id
             ORDER BY a.id DESC
             LIMIT 1
          ) AS registry_type_id
        FROM establishing_schools e
       WHERE e.id = ?
       LIMIT 1`,
      [schoolId],
      (schoolError, schoolRows = []) => {
        if (schoolError) {
          console.log(schoolError);
          callback(false, "Kuna tatizo la mfumo.");
          return;
        }

        if (!schoolRows.length) {
          callback(false, "Shule haijapatikana.");
          return;
        }

        const schoolCategoryId = Number(schoolRows[0]?.school_category_id || 0);
        const registryTypeId = Number(schoolRows[0]?.registry_type_id || 0);

        if (!schoolCategoryId || !registryTypeId) {
          callback(false, "Aina au umiliki wa shule haujakamilika kwenye mfumo.");
          return;
        }

        db.query(
          `SELECT UPPER(TRIM(file_number)) AS base_pattern
             FROM school_file_number_mappings
            WHERE is_active = 1
              AND registry_type_id = ?
              AND school_category_id = ?
              AND file_number IS NOT NULL
              AND TRIM(file_number) <> ''`,
          [registryTypeId, schoolCategoryId],
          (patternError, patternRows = []) => {
            if (patternError) {
              console.log(patternError);
              callback(false, "Kuna tatizo la mfumo.");
              return;
            }

            const allowedBases = patternRows
              .map((row) => String(row?.base_pattern || "").trim())
              .filter(Boolean);
            const allowedPatternText = allowedBases.join(", ");

            if (!allowedBases.length) {
              callback(
                false,
                "Hakuna pattern ya namba ya jalada kwa aina na umiliki wa shule hii."
              );
              return;
            }

            const validPattern = allowedBases.some(
              (base) => normalizedUpper === base || normalizedUpper.startsWith(`${base}/`)
            );

            if (!validPattern) {
              callback(
                false,
                `Namba ya jalada haifuati pattern inayotakiwa. Tumia pattern: ${allowedPatternText}. Mfano: ${allowedBases[0]}/1`
              );
              return;
            }

            const matchedBase =
              allowedBases.find(
                (base) =>
                  normalizedUpper === base || normalizedUpper.startsWith(`${base}/`)
              ) || "";
            const basePrefix = `${matchedBase}/`;
            const enteredSuffixRaw = normalizedUpper.startsWith(basePrefix)
              ? normalizedUpper.slice(basePrefix.length)
              : "";

            if (!/^\d+$/.test(enteredSuffixRaw)) {
              callback(
                false,
                `Namba ya jalada haipo kwenye muundo sahihi. Tumia muundo: ${matchedBase}/N (mfano ${matchedBase}/1).`
              );
              return;
            }

            const enteredSuffix = Number.parseInt(enteredSuffixRaw, 10);
            if (!Number.isFinite(enteredSuffix) || enteredSuffix < 1) {
              callback(
                false,
                `Namba ya jalada haipo kwenye muundo sahihi. Tumia muundo: ${matchedBase}/N (mfano ${matchedBase}/1).`
              );
              return;
            }

            db.query(
              `SELECT UPPER(TRIM(file_number)) AS file_number
                 FROM establishing_schools
                WHERE file_number IS NOT NULL
                  AND TRIM(file_number) <> ''
                  AND UPPER(TRIM(file_number)) LIKE CONCAT(?, '/%')`,
              [matchedBase],
              (rangeError, rangeRows = []) => {
                if (rangeError) {
                  console.log(rangeError);
                  callback(false, "Kuna tatizo la mfumo.");
                  return;
                }

                let maxSuffix = 0;
                (rangeRows || []).forEach((row) => {
                  const value = String(row?.file_number || "").trim().toUpperCase();
                  if (!value.startsWith(basePrefix)) return;
                  const suffixRaw = value.slice(basePrefix.length);
                  if (!/^\d+$/.test(suffixRaw)) return;
                  const suffix = Number.parseInt(suffixRaw, 10);
                  if (Number.isFinite(suffix) && suffix > maxSuffix) {
                    maxSuffix = suffix;
                  }
                });

                if (maxSuffix > 0 && enteredSuffix > maxSuffix) {
                  callback(
                    false,
                    `Namba ya jalada imezidi range ya pattern hii. Mwisho unaoruhusiwa ni ${matchedBase}/${maxSuffix}.`
                  );
                  return;
                }

                db.query(
                  `SELECT id
                     FROM establishing_schools
                    WHERE UPPER(TRIM(file_number)) = UPPER(?)
                      AND id <> ?
                      AND file_number IS NOT NULL
                      AND TRIM(file_number) <> ''
                    LIMIT 1`,
                  [normalizedFileNumber, schoolId],
                  (existError, existRows = []) => {
                    if (existError) {
                      console.log(existError);
                      callback(false, "Kuna tatizo la mfumo.");
                      return;
                    }

                    if (existRows.length > 0) {
                      callback(false, "Namba ya jalada imeshatumika na shule nyingine.");
                      return;
                    }

                    db.query(
                      `UPDATE establishing_schools
                          SET file_number = ?, updated_at = ?
                        WHERE id = ?`,
                      [normalizedFileNumber, formatDate(new Date()), schoolId],
                      (updateError, result) => {
                        if (updateError) {
                          console.log(updateError);
                          callback(false, "Haujafanikiwa kubadili namba ya jalada.");
                          return;
                        }

                        const success = Number(result?.affectedRows || 0) > 0;
                        callback(success, success
                          ? "Umefanikiwa kubadili namba ya jalada."
                          : "Hakuna mabadiliko yaliyofanyika.");
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  },
  countMissingSchoolFileNumbers: (callback) => {
    db.query(
      `SELECT COUNT(*) AS total
         FROM establishing_schools
        WHERE file_number IS NULL OR TRIM(file_number) = ''`,
      (error, rows = []) => {
        if (error) {
          console.log(error);
          callback(false, 0, "Haujafanikiwa kupata idadi ya majalada yasiyo na namba.");
          return;
        }

        const total = Number(rows?.[0]?.total || 0);
        callback(true, total, "Idadi imepatikana.");
      }
    );
  },
  generateMissingSchoolFileNumbers: (callback) => {
    const queryAsync = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
      });

    const normalize = (value) => String(value || "").trim();
    const normalizeUpper = (value) => normalize(value).toUpperCase();

    (async () => {
      const skippedReasons = {
        registry_type_missing: 0,
        school_category_missing: 0,
        mapping_not_found: 0,
      };
      const skippedDetails = [];

      const mappings = await queryAsync(
        `SELECT registry_type_id, school_category_id, file_number
           FROM school_file_number_mappings
          WHERE is_active = 1
            AND file_number IS NOT NULL
            AND TRIM(file_number) <> ''`
      );

      if (!Array.isArray(mappings) || mappings.length === 0) {
        callback(true, "Hakuna mapping za namba za jalada zilizoactive.", {
          updated: 0,
          skipped: 0,
          skipped_reasons: skippedReasons,
          skipped_details: skippedDetails,
        });
        return;
      }

      const mappingByKey = new Map();
      const bases = [];
      mappings.forEach((row) => {
        const key = `${Number(row.registry_type_id || 0)}|${Number(row.school_category_id || 0)}`;
        const base = normalize(row.file_number);
        if (!base) return;
        mappingByKey.set(key, base);
        if (!bases.includes(base)) bases.push(base);
      });

      const existingRows = await queryAsync(
        `SELECT file_number
           FROM establishing_schools
          WHERE file_number IS NOT NULL
            AND TRIM(file_number) <> ''`
      );

      const usedNumbers = new Set();
      const nextByBase = {};
      bases.forEach((base) => {
        nextByBase[base] = 1;
      });

      existingRows.forEach((row) => {
        const current = normalize(row.file_number);
        if (!current) return;
        usedNumbers.add(normalizeUpper(current));
        bases.forEach((base) => {
          const prefix = `${base}/`;
          if (!current.startsWith(prefix)) return;
          const suffix = current.slice(prefix.length).split("/").pop();
          const numericSuffix = Number.parseInt(suffix, 10);
          if (Number.isFinite(numericSuffix) && numericSuffix >= nextByBase[base]) {
            nextByBase[base] = numericSuffix + 1;
          }
        });
      });

      const missingSchools = await queryAsync(
        `SELECT
            e.id,
            e.tracking_number,
            e.school_name,
            e.school_category_id,
            e.created_at,
            (
              SELECT a.registry_type_id
                FROM applications a
               WHERE a.tracking_number = e.tracking_number
               ORDER BY a.id DESC
               LIMIT 1
            ) AS registry_type_id,
            (
              SELECT MIN(sr.registration_date)
                FROM school_registrations sr
               WHERE sr.establishing_school_id = e.id
            ) AS registration_date
          FROM establishing_schools e
          WHERE e.file_number IS NULL OR TRIM(e.file_number) = ''
          ORDER BY
            (registration_date IS NULL) ASC,
            registration_date ASC,
            e.created_at ASC,
            e.id ASC`
      );

      const updates = [];
      let skipped = 0;

      missingSchools.forEach((row) => {
        const registryTypeId = Number(row.registry_type_id || 0);
        const schoolCategoryId = Number(row.school_category_id || 0);
        const key = `${registryTypeId}|${schoolCategoryId}`;
        const base = mappingByKey.get(key);

        if (!registryTypeId || !schoolCategoryId || !base) {
          let reasonCode = "mapping_not_found";
          let reasonText = "Hakuna pattern inayolingana na aina/umiliki wa shule.";

          if (!registryTypeId) {
            reasonCode = "registry_type_missing";
            reasonText = "Shule haina umiliki (registry_type) kwenye taarifa zake.";
          } else if (!schoolCategoryId) {
            reasonCode = "school_category_missing";
            reasonText = "Shule haina aina ya shule (school_category).";
          }

          skippedReasons[reasonCode] = Number(skippedReasons[reasonCode] || 0) + 1;
          if (skippedDetails.length < 50) {
            skippedDetails.push({
              id: Number(row.id || 0),
              tracking_number: row.tracking_number || null,
              school_name: row.school_name || null,
              reason_code: reasonCode,
              reason: reasonText,
              registry_type_id: registryTypeId || null,
              school_category_id: schoolCategoryId || null,
            });
          }

          skipped += 1;
          return;
        }

        let sequence = Number(nextByBase[base] || 1);
        let generated = `${base}/${sequence}`;
        while (usedNumbers.has(normalizeUpper(generated))) {
          sequence += 1;
          generated = `${base}/${sequence}`;
        }

        usedNumbers.add(normalizeUpper(generated));
        nextByBase[base] = sequence + 1;
        updates.push({
          id: Number(row.id),
          file_number: generated,
        });
      });

      if (!updates.length) {
        callback(true, "Hakuna shule zenye uhitaji wa kugenerate namba ya jalada.", {
          updated: 0,
          skipped,
          skipped_reasons: skippedReasons,
          skipped_details: skippedDetails,
        });
        return;
      }

      await queryAsync("START TRANSACTION");
      try {
        const updatedAt = formatDate(new Date());
        const chunkSize = 300;
        for (let i = 0; i < updates.length; i += chunkSize) {
          const chunk = updates.slice(i, i + chunkSize);
          const caseParts = [];
          const params = [];
          const ids = [];

          chunk.forEach((row) => {
            caseParts.push("WHEN ? THEN ?");
            params.push(Number(row.id), String(row.file_number));
            ids.push(Number(row.id));
          });

          const idPlaceholders = ids.map(() => "?").join(", ");
          const sql = `UPDATE establishing_schools
                         SET file_number = CASE id ${caseParts.join(" ")} END,
                             updated_at = ?
                       WHERE id IN (${idPlaceholders})`;

          await queryAsync(sql, params.concat([updatedAt], ids));
        }
        await queryAsync("COMMIT");
      } catch (error) {
        await queryAsync("ROLLBACK");
        throw error;
      }

      callback(true, "Umefanikiwa kugenerate namba za jalada.", {
        updated: updates.length,
        skipped,
        skipped_reasons: skippedReasons,
        skipped_details: skippedDetails,
      });
    })().catch((error) => {
      console.log(error);
      callback(false, "Haujafanikiwa kugenerate namba za jalada.", {
        updated: 0,
        skipped: 0,
        skipped_reasons: {
          registry_type_missing: 0,
          school_category_missing: 0,
          mapping_not_found: 0,
        },
        skipped_details: [],
      });
    });
  }
};
