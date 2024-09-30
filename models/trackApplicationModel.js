const db = require("../dbConnection");
const { schoolLocationsSqlJoin, applicationView } = require("../utils");

module.exports = {
  getAllApplications: (offset, per_page, search_value, user, callback) => {
    var searchQuery = "";
    var queryParams = [];
    const { sehemu, zone_id, district_code } = user;
    if (search_value) {
      searchQuery += ` AND (tracking_number LIKE ? OR 
                            school_name LIKE ? OR 
                            application_category LIKE ? OR
                            category LIKE ? OR
                            region_name LIKE ? OR
                            district_name LIKE ? OR
                            ward_name LIKE ? OR
                            street_name LIKE ? OR
                            applicant_name LIKE ? 
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
    let sql = ` FROM track_application_view a
                      LEFT JOIN staffs s ON s.id = a.staff_id 
                      LEFT JOIN roles r ON r.id = s.user_level
                      LEFT JOIN vyeo v ON v.id = r.vyeoId
                      WHERE 1=1
                      ${sehemu == "k1" ? "AND a.zone_id = " + zone_id : ""}
                      ${
                        sehemu == "w1"
                          ? "AND a.district_code = '" + district_code + "'"
                          : ""
                      }
                      ${searchQuery}
                      ORDER BY submitted_created_at DESC`;

    db.query(
      `SELECT tracking_number , application_category,  applicant_name ,   application_created_at,submitted_created_at,
              UPPER(school_name) AS school_name,category,title, region_name , district_name,ward_name,street_name,zone_name,
              status, payment_status, payment_status_id,v.rank_level AS rank
              ${sql}
              ${per_page > 0 ? "LIMIT ? , ?" : ""}`,
      per_page > 0 ? queryParams.concat([offset, per_page]) : queryParams,
      (error, applications) => {
        if(error) console.log(error)
        db.query(
          `SELECT COUNT(*) AS num_rows  ${sql}`,
          queryParams,
          (error2, result2) => {
            if (error2) {
              error = error2;
              console.log(error);
            }
            console.log(applications);
            callback(error, applications, result2[0].num_rows);
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



