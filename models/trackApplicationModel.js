const db = require("../dbConnection");
const { schoolLocationsSqlJoin, applicationView } = require("../utils");

module.exports = {
  //******** Track All Applications Query *******************************
  // getAllApplications: (offset, per_page, is_paginated, search , callback) => {
  //      const {tafuta , category} = search;
  //      let sqlSearch = tafuta
  //        ? ` AND (a.tracking_number LIKE '%${tafuta}%'
  //                         OR u.name LIKE '%${tafuta}%'
  //                         OR c.name LIKE '%${tafuta}%'
  //                )`
  //        : ``;
  //        sqlSearch += category ? `AND a.application_category_id = ${category} ` : ``;
  //      const commonSql = `  JOIN application_categories ac ON ac.id = a.application_category_id
  //                           LEFT JOIN establishing_schools e ON e.tracking_number = a.tracking_number
  //                           LEFT JOIN owners o ON o.tracking_number = a.tracking_number
  //                           LEFT JOIN school_registrations sr ON sr.tracking_number = a.tracking_number
  //                           LEFT JOIN former_managers fm ON fm.tracking_number = a.tracking_number
  //                           LEFT JOIN former_school_combinations fsc ON fsc.tracking_number = a.tracking_number
  //                           LEFT JOIN former_school_infos fsi ON fsi.tracking_number = a.tracking_number
  //                           LEFT JOIN users u ON u.id = a.user_id
  //                           LEFT JOIN staffs s ON s.id = a.staff_id
  //                           LEFT JOIN roles c ON c.id = s.user_level
  //                           LEFT JOIN payment_statuses p ON p.id = a.payment_status_id
  //                           LEFT JOIN (SELECT m2.created_at AS maoni_created_at ,trackingNo
  //                                           FROM maoni m2
  //                                           #ORDER BY id DESC
  //                                           WHERE m2.id = (SELECT MAX(m3.id) FROM maoni m3)
  //                                           LIMIT 1) AS m
  //                                       ON a.tracking_number = m.trackingNo
  //                           LEFT JOIN wards w ON e.ward_id IS NOT NULL AND w.WardCode = e.ward_id
  //                           LEFT JOIN districts  d ON  (s.district_code IS NOT NULL AND w.LgaCode = s.district_code) OR w.LgaCode = d.LgaCode
  //                           LEFT JOIN regions    r ON  (s.region_code IS NOT NULL  AND s.region_code = r.RegionCode) OR  r.RegionCode = d.RegionCode
  //                           LEFT JOIN zones      z ON  (s.zone_id IS NOT NULL AND  z.id = s.zone_id)                 OR z.id = r.zone_id
  //                           WHERE a.is_complete IN (0,1) ${sqlSearch} AND
  //                          (
  //                               (e.tracking_number IS NOT NULL AND sr.tracking_number IS NULL)
  //                               OR (sr.tracking_number IS NOT NULL AND o.tracking_number IS NULL)
  //                               OR (o.tracking_number IS NOT NULL AND fm.tracking_number IS NULL)
  //                               OR (fm.tracking_number IS NOT NULL AND fsc.tracking_number IS NULL)
  //                               OR (fsc.tracking_number IS NOT NULL AND fsi.tracking_number IS NULL)
  //                           )`;
  //                           ;
  //       console.log("start");
  //       db.query(
  //         `SELECT a.id AS id, a.tracking_number AS tracking_number , ac.app_name AS application_category,
  //                        u.name AS applicant_name , a.created_at AS application_created_at,
  //                        IFNULL(m.maoni_created_at , a.created_at) AS submitted_created_at,
  //                        e.school_name AS school_name,
  //                        c.name AS title, r.RegionName as region_name , d.LgaName AS district_name,
  //                        a.is_approved AS status, zone_name,
  //                        p.status AS payment_status, p.id AS payment_status_id,
  //                        sr.registration_number AS registration_number,
  //                        sr.reg_status AS reg_status
  //                 FROM applications a
  //                 ${commonSql}
  //                 ORDER BY submitted_created_at DESC
  //                 ${is_paginated ? " LIMIT ?,?" : ""}`,
  //         is_paginated ? [offset, per_page] : [],
  //         (error, applications) => {
  //           if (error) console.log(error);
  //           console.log("finish")
  //           db.query(
  //             `SELECT COUNT(*) AS num_rows
  //              FROM applications a
  //              ${commonSql}
  //              `,
  //             (error2, results2) => {
  //               if (error2) {
  //                 error = error2;
  //                 console.log(error);
  //               }
  //                callback(error, applications, results2[0].num_rows);
  //             }
  //           );
  //         }
  //       );
  // },
  getAllApplications: (offset, per_page, is_paginated, search, app_category_id , user, callback) => {
    const { tafuta, category } = search;
    const main_table_view = applicationView(app_category_id);
    const { sehemu, zone_id, district_code } = user;
    let filter = tafuta
      ? ` AND (a.tracking_number LIKE '%${tafuta}%' 
                          OR u.name LIKE '%${tafuta}%'
                          OR c.name LIKE '%${tafuta}%'
                 )`
      : ``;

   const commonSql = `FROM ${main_table_view} a
                      LEFT JOIN users u ON u.id = a.user_id
                      LEFT JOIN staffs s ON s.id = a.staff_id
                      LEFT JOIN roles c ON c.id = s.user_level
                      LEFT JOIN (SELECT m2.created_at AS maoni_created_at ,trackingNo
                                FROM maoni m2
                                #ORDER BY id DESC
                                WHERE m2.id = (SELECT MAX(m3.id) FROM maoni m3)
                                LIMIT 1) AS m
                      ON a.tracking_number = m.trackingNo
                      LEFT JOIN zones z ON (s.zone_id IS NOT NULL AND  z.id = s.zone_id) 
                      JOIN payment_statuses p ON p.id = a.payment_status_id
                      WHERE 1 = 1 
                      ${filter}
                      ${ sehemu == "k1" ? "AND s.zone_id = " + zone_id : ""}
                      ${ sehemu == "w1" ? "AND a.district_code = '" + district_code+"'" : ""}
                      `;
    db.query(
      `SELECT  a.tracking_number AS tracking_number , a.app_name AS application_category,  
                         u.name AS applicant_name , a.created_at AS application_created_at,
                         IFNULL(m.maoni_created_at , a.created_at) AS submitted_created_at,
                         a.school_name AS school_name,
                         category,
                         c.name AS title, 
                         a.region as region_name , 
                         a.district AS district_name,
                         a.ward AS ward_name,
                         a.street AS street_name,
                         a.zone_name AS zone_name,
                         a.is_approved AS status, 
                         p.status AS payment_status, p.id AS payment_status_id
                         #sr.registration_number AS registration_number,
                         #sr.reg_status AS reg_status
                  ${commonSql}
                  ORDER BY submitted_created_at DESC
                  ${is_paginated ? " LIMIT ?,?" : ""}`,
      is_paginated ? [offset, per_page] : [],
      (error, applications) => {
        if (error) console.log(error);
        console.log("finish");
        db.query(
          `SELECT COUNT(*) AS num_rows 
               ${commonSql}
               `,
          (error2, results2) => {
            if (error2) {
              error = error2;
              console.log(error);
            }
            callback(error, applications, results2[0].num_rows);
          }
        );
      }
    );
  },
};



