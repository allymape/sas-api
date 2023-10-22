const db = require("../dbConnection");
const { schoolLocationsSqlJoin } = require("../utils");

module.exports = {
  //******** Track All Applications Query *******************************
  getAllApplications: (offset, per_page, is_paginated, search , callback) => {
       const {tafuta , category} = search;
       let sqlSearch = tafuta
         ? ` AND (a.tracking_number LIKE '%${tafuta}%' 
                          OR u.name LIKE '%${tafuta}%'
                          OR c.name LIKE '%${tafuta}%'
                 )`
         : ``;
         sqlSearch += category ? `AND a.application_category_id = ${category} ` : ``;
       const commonSql = `  JOIN application_categories ac ON ac.id = a.application_category_id
                            JOIN users u ON u.id = a.user_id
                            LEFT JOIN staffs s ON s.id = a.staff_id
                            LEFT JOIN roles c ON c.id = s.user_level 
                            LEFT JOIN payment_statuses p ON p.id = a.payment_status_id
                            LEFT JOIN districts  d ON d.LgaCode = s.district_code
                            LEFT JOIN regions    r ON r.RegionCode = s.region_code
                            LEFT JOIN zones z ON  z.id = s.zone_id
                            LEFT JOIN school_registrations sr ON sr.tracking_number = a.tracking_number
                            LEFT JOIN (SELECT m2.created_at AS maoni_created_at ,trackingNo
                                            FROM maoni m2
                                            ORDER BY id DESC 
                                            LIMIT 1) AS m
                                        ON a.tracking_number = m.trackingNo
                            WHERE a.is_complete = 1 ${sqlSearch}`;
        db.query(
          `SELECT a.id AS id, a.tracking_number AS tracking_number , ac.app_name AS application_category,  
                         u.name AS applicant_name , a.created_at AS application_created_at,
                         IFNULL(m.maoni_created_at , a.created_at) AS submitted_created_at,
                         c.name AS title, r.RegionName as region_name , d.LgaName AS district_name,
                         a.is_approved AS status,
                         p.status AS payment_status, p.id AS payment_status_id,
                         sr.registration_number AS registration_number,
                         sr.reg_status AS reg_status
                  FROM applications a
                  ${commonSql}
                  ORDER BY submitted_created_at DESC
                  ${is_paginated ? " LIMIT ?,?" : ""}`,
          is_paginated ? [offset, per_page] : [],
          (error, applications) => {
            if (error) console.log(error);
            db.query(
              `SELECT COUNT(*) AS num_rows 
               FROM applications a
               ${commonSql}
               `,
              (error2, results2) => {
                if (error2) {
                  error = error2;
                  console.log(error);
                }
                db.query(`SELECT id, app_name AS name FROM application_categories` , (err , categories) => {
                    if(err) console.log(err)
                    callback(error, applications, categories, results2[0].num_rows);
                })
                
              }
            );
          }
        );
  },
}



