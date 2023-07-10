const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF REGISTERED SCHOOLS *******************************
  getAllSchools: (offset, per_page, callback) => {
    db.query(
      "",
      [offset, per_page],
      (error, Schools, fields) => {
        db.query(
          "SELECT COUNT(*) AS num_rows FROM Schools",
          (error2, result, fields2) => {
            callback(error, Schools, result[0].num_rows);
          }
        );
      }
    );
  },
  // LOOK FOR SCHOOLS
  lookForSchools : (offset , per_page , search, callback) => {
        const keyword = db.escape(`%${search}%`);
        const searchSql = search
          ? ` WHERE e.school_name LIKE ${keyword} OR s.registration_number LIKE ${keyword} OR e.tracking_number LIKE ${keyword} `
          : "";
      db.query(
        `SELECT e.tracking_number AS id, e.school_name AS text , s.registration_number AS registration_number,
        r.RegionName AS region, d.LgaName AS district, w.WardName AS ward
                FROM establishing_schools e
                JOIN school_registrations s ON s.tracking_number = e.tracking_number 
                JOIN streets st ON st.StreetCode = e.village_id
                JOIN wards w ON w.WardCode = st.WardCode
                JOIN districts d ON d.LgaCode = w.LgaCode
                JOIN regions r ON r.RegionCode = d.RegionCode
                ${searchSql}
                ORDER BY school_name ASC
                LIMIT ? , ?`,
        [offset, per_page],
        (error, schools) => {
          if (error) {
            console.log(error);
          }
          callback(error, schools);
        }
      );
  },
  //******** STORE SCHOOLS *******************************
  storeSchools: (established_schools , applications , school_registrations, callback) => {
    var success = false;
     db.query(
       `INSERT INTO establishing_schools (id, school_name, secure_token,school_phone, tracking_number, is_for_disabled, is_hostel, stage,ward_id, village_id, school_email, po_box ,school_category_id , created_at , updated_at) VALUES ? ON DUPLICATE KEY UPDATE school_name = VALUES(school_name), school_phone =  VALUES(school_phone), ward_id = VALUES(ward_id), village_id = VALUES(village_id), updated_at = VALUES(updated_at), tracking_number = VALUES(tracking_number)`,
       [established_schools],
       (err, established) => {
         if (err) {
           console.log(err);
         }
         if (established) {
           db.query(
             `INSERT INTO applications (id,userId,secure_token,foreign_token,tracking_number,user_id,application_category_id,registry_type_id,is_approved,status_id,is_complete,created_at,updated_at) VALUES ? ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), userId=VALUES(userId), tracking_number=VALUES(tracking_number), is_approved=VALUES(is_approved), application_category_id=VALUES(application_category_id), updated_at=VALUES(updated_at)`,
             [applications],
             (err2, application) => {
               if (err2) {
                 console.log(err2);
               }
               if (application) {
                 db.query(
                   `INSERT INTO school_registrations (id,secure_token,establishing_school_id,tracking_number,school_opening_date,registration_number, reg_status, created_at, updated_at) VALUES ? ON DUPLICATE KEY UPDATE establishing_school_id=VALUES(establishing_school_id), secure_token=VALUES(secure_token), registration_number=VALUES(registration_number), tracking_number=VALUES(tracking_number), reg_status=VALUES(reg_status),updated_at=VALUES(updated_at)`,
                   [school_registrations],
                   (err3, registered) => {
                     if (err || err2 || err3) {
                       console.log(err, err2, err3);
                     }
                        if (registered) {
                            success = true;
                        }
                     callback(success);
                   }
                 );
               }
             }
           );
         }
       }
     );
  },
};
