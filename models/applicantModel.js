const db = require("../dbConnection");
const { schoolLocationsSqlJoin } = require("../utils");

module.exports = {
  //******** GET A LIST OF APPLICANTS *******************************
  getAllApplicants: (offset, per_page, search_value, callback) => {
    var searchQuery = "";
    var queryParams = [];
    if (search_value) {
      searchQuery += ` AND (u.email LIKE ? OR 
                            u.name LIKE ? 
                          )`;
      queryParams.push(`%${search_value}%`, `%${search_value}%`);
    }
    let sql = `FROM users u 
                LEFT JOIN applications a ON a.user_id = u.id
                WHERE 1 = 1
                ${searchQuery}
                `;
    db.query(
      `SELECT u.id AS id , UPPER(u.name) AS name , u.email AS email,u.created_at as created_at,u.updated_at as updated_at, IFNULL(COUNT(a.id) , 0) AS total_applications
             ${sql}
             GROUP BY u.id
             ORDER BY u.created_at DESC
             ${per_page > 0 ? "LIMIT ? , ?" : ""}
             `,
      per_page > 0 ? queryParams.concat([offset, per_page]) : queryParams,
      (error, users) => {
        if (error) console.log(error);
        db.query(
          `SELECT COUNT(DISTINCT u.id) AS num_rows  ${sql}`,
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
    // const subSql = ` `;
    // const keyword = db.escape(`%${search}%`);
    // const searchSql = search
    //   ? ` WHERE u.name LIKE ${keyword} OR u.email LIKE ${keyword} `
    //   : "";

    // db.query(
    //   `SELECT u.id AS id , u.name AS name , u.email AS email,
    //           u.created_at as created_at,
    //         u.updated_at as updated_at,
    //           IFNULL(COUNT(a.id) , 0) AS total_applications
    //           ${subSql}
    //           ${searchSql}
    //           ${is_paginated ? "" : ""}
    //           GROUP BY id
    //           ORDER BY created_at DESC
    //           ${is_paginated ? " LIMIT ?,?" : ""}`,
    //   is_paginated ? [offset, per_page] : [],
    //   (error, applicants) => {
    //     // console.log(error);
    //     db.query(
    //       `SELECT COUNT(*) AS num_rows
    //         ${subSql}
    //         ${searchSql}
    //       GROUP BY a.user_id`,
    //       (error2, result) => {
    //         if (error2) {
    //           error = error2;
    //           console.log(error);
    //         }
    //         callback(error, applicants, result[0].num_rows);
    //       }
    //     );
    //   }
    // );
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
                    IFNULL(COUNT(a.id)  , 0) AS total
                    FROM users u
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
                    IFNULL(COUNT(a.id)  , 0) AS total
                    FROM users u
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
      searchQuery += ` AND (s.tracking_number LIKE ? OR 
                            e.school_name LIKE ? OR
                            s.registration_number LIKE ? 
                          )`;
      queryParams.push(`%${search_value}%`, `%${search_value}%` , `%${search_value}%`);
    }
    let sql = `FROM school_registrations s
               JOIN applications a ON a.tracking_number = s.tracking_number
               JOIN establishing_schools e ON e.id = s.establishing_school_id
               JOIN school_categories sc ON sc.id = e.school_category_id
               ${schoolLocationsSqlJoin()}
               WHERE a.user_id = ${applicant_id} AND reg_status = 1
                ${searchQuery}
                `;
    db.query(
      `SELECT s.registration_number AS reg_number , e.school_name AS name, 
              e.tracking_number AS tracking_number ,s.registration_date AS registration_date,
              sc.category AS type , 
              r.RegionName AS region, d.LgaName AS district, w.WardName AS ward, st.StreetName AS village
             ${sql}
             ORDER BY a.created_at DESC
             ${per_page > 0 ? "LIMIT ? , ?" : ""}
             `,
      per_page > 0 ? queryParams.concat([offset, per_page]) : queryParams,
      (error, users) => {
        if (error) console.log(error);
        db.query(
          `SELECT COUNT(*) AS num_rows  ${sql}`,
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
};
