const db = require("../dbConnection");
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
    var searchQuery = "";
    var queryParams = [];
    if (search_value) {
      searchQuery += ` AND (school_name LIKE ? OR 
                              registration_number LIKE ? OR 
                              RegionName LIKE ? OR 
                              LgaName LIKE ? OR 
                              WardName LIKE ? OR 
                              StreetName LIKE ?
                            )`;
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
      searchQuery += ` AND e.school_category_id = ?`;
      queryParams.push(Number(type_search));
    }
    if (owner_search) {
      searchQuery += ` AND a.registry_type_id = ?`;
      queryParams.push(Number(owner_search));
    }
    if (invalid_or_no_reg_search == 1) {
      searchQuery += ` AND  s.registration_number NOT LIKE "EA.%" AND 
                             s.registration_number NOT LIKE "EM.%" AND
                             s.registration_number NOT LIKE "S.%"  AND
                             s.registration_number NOT LIKE "CU.%" AND
                             registration_number NOT LIKE '% %'`;
    }
    if (geolocation_search == 1) {
      searchQuery += ` AND latitude IS NOT NULL AND longitude IS NOT NULL`;
    }
   
    if (correction == 1) {
      searchQuery += ` AND is_verified = 0  AND corrected = 0`;
    }
    if (geolocation_search == 2) {
      searchQuery += ` AND (latitude IS NULL OR longitude IS NULL)`;
    }
    if (duplicate_reg_search == 1) {
      searchQuery += `
                  AND EXISTS (
                    SELECT 1
                    FROM school_registrations sr2
                    WHERE sr2.registration_number = s.registration_number
                    GROUP BY sr2.registration_number
                    HAVING COUNT(*) > 1
                  )`;
    }

    let sql = `FROM school_registrations s 
                      JOIN establishing_schools e ON s.establishing_school_id = e.id
                      JOIN applications a ON a.tracking_number = s.tracking_number
                      JOIN school_categories sc ON sc.id = e.school_category_id
                      LEFT JOIN registry_types rt ON rt.id = a.registry_type_id
                      LEFT JOIN school_verifications sv ON sv.tracking_number = s.tracking_number
                      ${schoolLocationsSqlJoin()}
                      WHERE  s.reg_status IN (1)
                      ${searchQuery}
                      ORDER BY school_name ASC`;

    db.query(
      `SELECT s.tracking_number AS id,
              school_name AS name, 
              registration_number AS reg_no, 
              rt.registry AS ownership,
              sc.category AS category,
              IFNULL(school_opening_date , '') AS opening_date, 
              r.RegionName AS region, 
              latitude,longitude,
              d.LgaName AS lga,
              w.WardName AS ward, 
              st.StreetName AS street,
              IFNULL(registration_date , '') AS reg_date, 
              DATE_FORMAT(s.updated_at , '%Y-%m-%d %H:%i:%s') AS updated_at, 
              CASE 
                  WHEN s.reg_status = 1 THEN 'Imesajiliwa'
                  WHEN s.reg_status = 0 THEN 'Imefutiwa Usajili'
                  ELSE 'Unknown'
              END AS status,
              s.is_verified AS is_verified,
              sv.corrected AS corrected,
              sv.description AS description,
              reg_status
              ${sql}
              ${per_page > 0 ? "LIMIT ? , ?" : ""}`,
      per_page > 0 ? queryParams.concat([offset, per_page]) : queryParams,
      (error, schools) => {
        if (error) console.log(error);
        db.query(
          `SELECT COUNT(*) AS num_rows  ${sql}`,
          queryParams,
          (error2, result2) => {
            if (error2) {
              error = error2;
              console.log(error);
            }
            
            if(schools.length > 0){
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
            callback(error, schools, result2[0].num_rows);
          }
        );
      }
    );
  },
  // LOOK FOR SCHOOLS
  lookForSchools: (offset, per_page, search, callback) => {
    const keyword = db.escape(`%${search}%`);
    const searchSql = search
      ? ` AND (e.school_name LIKE ${keyword} OR s.registration_number LIKE ${keyword} OR e.tracking_number LIKE ${keyword}) `
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
      `SELECT e.id AS id, e.school_name AS name, e.school_category_id AS category,latitude,longitude, 
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
  }
};
