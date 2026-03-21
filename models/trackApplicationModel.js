const db = require("../config/database");
const { schoolLocationsSqlJoin, applicationView } = require("../utils");

module.exports = {
  getAllApplications: (offset, per_page, search_value, school_id, user, callback) => {
    var searchQuery = "";
    var queryParams = [];
    const { sehemu, zone_id, district_code } = user;
    if (search_value) {
      searchQuery += ` AND (app.tracking_number LIKE ? OR 
	                            e.school_name LIKE ? OR 
	                            ac.app_name LIKE ? OR
	                            sc.category LIKE ? OR
	                            r.RegionName LIKE ? OR
	                            d.LgaName LIKE ? OR
	                            w.WardName LIKE ? OR
	                            st.StreetName LIKE ? OR
	                            u.name LIKE ? 
	                            )`;
      queryParams.push(
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`
      );
    }
    if (school_id) {
      searchQuery += ` AND app.establishing_school_id = ?`;
      queryParams.push(Number(school_id));
    }

    const lastMaoniSql = `
      SELECT m2.trackingNo AS trackingNo, m2.created_at AS maoni_created_at
      FROM maoni m2
      JOIN (
        SELECT trackingNo, MAX(id) AS max_id
        FROM maoni
        GROUP BY trackingNo
      ) mx ON mx.trackingNo = m2.trackingNo AND mx.max_id = m2.id
    `;

    let sql = ` FROM applications app
                      LEFT JOIN application_categories ac ON ac.id = app.application_category_id
                      LEFT JOIN users u ON u.id = app.user_id
                      LEFT JOIN staffs s ON s.id = app.staff_id 
                      LEFT JOIN roles rr ON rr.id = s.user_level
                      LEFT JOIN vyeo v ON v.id = rr.vyeoId
                      LEFT JOIN (${lastMaoniSql}) m ON m.trackingNo = app.tracking_number
                      LEFT JOIN payment_statuses p ON p.id = app.payment_status_id
                      LEFT JOIN registry_types rt ON rt.id = app.registry_type_id
                      LEFT JOIN establishing_schools e_tn ON e_tn.tracking_number = app.tracking_number
                      LEFT JOIN owners o ON o.tracking_number = app.tracking_number
                      LEFT JOIN former_owners fo ON fo.tracking_number = app.tracking_number
                      LEFT JOIN former_managers fm ON fm.tracking_number = app.tracking_number
                      LEFT JOIN former_school_combinations fsc ON fsc.tracking_number = app.tracking_number
                      LEFT JOIN former_school_infos fsi ON fsi.tracking_number = app.tracking_number
                      LEFT JOIN establishing_schools e ON e.id = COALESCE(
                        app.establishing_school_id,
                        e_tn.id,
                        o.establishing_school_id,
                        fo.establishing_school_id,
                        fm.establishing_school_id,
                        fsc.establishing_school_id,
                        fsi.establishing_school_id
                      )
                      LEFT JOIN school_categories sc ON sc.id = e.school_category_id
                      ${schoolLocationsSqlJoin()}
                      WHERE 1=1 AND app.is_complete = 1
                      ${sehemu == "k1" ? "AND r.zone_id = " + zone_id : ""}
                      ${sehemu == "w1" ? "AND d.LgaCode = '" + district_code + "'" : ""}
                      ${searchQuery}
                      ORDER BY IFNULL(m.maoni_created_at, app.created_at) DESC`;

    db.query(
      `SELECT app.tracking_number AS tracking_number , ac.app_name AS application_category,  UPPER(u.name) AS applicant_name ,   app.created_at AS application_created_at,
                IFNULL(m.maoni_created_at, app.created_at) AS submitted_created_at,
	              UPPER(e.school_name) AS school_name,sc.category AS category,UPPER(rr.name) AS title, r.RegionName AS region_name , d.LgaName AS district_name,w.WardName AS ward_name,st.StreetName AS street_name,UPPER(z.zone_name) AS zone_name,
	              app.is_approved AS status, v.overdue AS overdue, p.status AS payment_status, app.payment_status_id AS payment_status_id,v.rank_level AS ngazi, rt.registry AS registry,
	              d.LgaCode AS district_code, r.zone_id AS zone_id, app.staff_id AS staff_id
	              ${sql}
	              ${per_page > 0 ? "LIMIT ? , ?" : ""}`,
      per_page > 0 ? queryParams.concat([offset, per_page]) : queryParams,
      (error, applications) => {
        if (error) console.log(error);
        db.query(
          `SELECT COUNT(*) AS num_rows  ${sql}`,
          queryParams,
          (error2, result2) => {
            if (error2) {
              error = error2;
              console.log(error);
            }
            db.query(`SELECT overdue FROM vyeo WHERE UPPER(rank_name) = 'W1'`, (error3, vyeo) => {
              error3 ? console.log(error3) : "";
              var overdue = 1;
              if(vyeo.length > 0){
                overdue = vyeo[0].overdue;
              }
              callback(error, applications, result2[0].num_rows , overdue);
            });
            // console.log(applications);
          }
        );
      }
    );
  },
  // Duplicate
  getMaoni: (tracking_number, callback) => {
    db.query(
      `SELECT * 
              FROM maoni 
              WHERE tacking_number = ?`,
      [tracking_number],
      (error, comments) => {
        error ? console.log(error) : "";
        callback(error ? false : true, comments);
      }
    );
  },
};

