const db = require("../dbConnection");
const { schoolLocationsSqlJoin, establishedApplicationRegisteredSchoolsSqlJoin, applicationEstablishedRegisteredSchoolsSqlJoin, formatDate } = require("../utils");

module.exports = {
  //******** GET A LIST OF REGISTERED SCHOOLS *******************************
  getAllSchools: (offset, per_page, searchKeyword, typeKeyword, ownerKeyword, callback) => {
    const  keyword  = db.escape(`%${searchKeyword}%`);
    const  type     = db.escape(Number(typeKeyword));
    const  owner    = db.escape(Number(ownerKeyword));

    const sqlQuery = `FROM school_registrations s 
                      JOIN establishing_schools e ON s.establishing_school_id = e.id
                      JOIN applications a ON a.tracking_number = e.tracking_number
                      JOIN school_categories sc ON sc.id = e.school_category_id
                      LEFT JOIN registry_types rt ON rt.id = a.registry_type_id
                      ${ schoolLocationsSqlJoin() }
                      WHERE  s.reg_status = 1
                      `;
    //  console.log(sqlQuery);
    const searchByKeywordQuery =  searchKeyword ? `AND (e.school_name LIKE ${keyword} OR 
                                                        s.registration_number LIKE ${keyword})` : '';
    const searchByTypeQuery    =  typeKeyword    ? `AND  e.school_category_id = ${type}` : '';
    const searchByOwnerQuery   =  ownerKeyword   ? `AND a.registry_type_id = ${owner}` : '';
     
    // console.log(searchByKeywordQuery, searchByTypeQuery, searchByOwnerQuery);
   
    db.query(
      `SELECT e.tracking_number AS id,
              school_name AS name, 
              registration_number AS reg_no, 
              rt.registry AS ownership,
              sc.category AS category,
              IFNULL(school_opening_date , '') AS opening_date, 
              r.RegionName AS region, 
              d.LgaName AS lga,
              w.WardName AS ward, 
              st.StreetName AS street,
              IFNULL(DATE(s.updated_at) , '') AS reg_date, 
              s.updated_at AS updated_at, 
              s.reg_status AS status
              ${sqlQuery}
              ${searchByKeywordQuery}
              ${searchByTypeQuery}
              ${searchByOwnerQuery}
              LIMIT ?, ?`,
      [offset, per_page],
      (error, schools) => {
        db.query(
          `SELECT COUNT(*) AS num_rows 
              ${sqlQuery}  
              ${searchByKeywordQuery}
              ${searchByTypeQuery}
              ${searchByOwnerQuery}`,
          (error2, result) => {
            if (error2) {
              console.log(error2);
              error = error2;
            }
            callback(error, schools, result[0].num_rows);
          }
        );
      }
    );
  },
  // SCHOOLS FILTERS
  getSchoolsFilters: (callback) => {
     var success = false;
      db.query(`SELECT id , category AS name FROM school_categories` , (error , categories) => {
            if(error){
                console.log("Can't get school categories due to ", error);
            }
            db.query(`SELECT id, registry AS name FROM registry_types` , (error2 , ownerships) => {
              if(error2){
                 console.log("Can't get ownerships due to ", error2);
              }
              if(ownerships && categories){
                    success = true;
              }
              callback(success , categories , ownerships);
            })
      });
  },
  // LOOK FOR SCHOOLS
  lookForSchools : (offset , per_page , search, callback) => {
        const keyword = db.escape(`%${search}%`);
        const searchSql = search
          ? ` WHERE (e.school_name LIKE ${keyword} OR s.registration_number LIKE ${keyword} OR e.tracking_number LIKE ${keyword}) `
          : "";
          
        const sql = `SELECT e.tracking_number AS id, e.school_name AS text , s.registration_number AS registration_number,
                    r.RegionName AS region, d.LgaName AS district, w.WardName AS ward
                            FROM applications a
                            ${applicationEstablishedRegisteredSchoolsSqlJoin()} 
                            ${schoolLocationsSqlJoin()}
                            ${searchSql}
                            ORDER BY school_name ASC
                            LIMIT ? , ?`;
        // console.log(sql);
      db.query(
        sql,
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
       `INSERT INTO establishing_schools (id, school_name, secure_token,school_phone, tracking_number, is_for_disabled, is_hostel, stage,ward_id, village_id, school_email, po_box ,school_category_id , created_at , updated_at) VALUES ? 
       ON DUPLICATE KEY UPDATE school_name = VALUES(school_name), school_phone =  VALUES(school_phone), ward_id = VALUES(ward_id), village_id = VALUES(village_id), updated_at = VALUES(updated_at), tracking_number = VALUES(tracking_number) , school_category_id = VALUES(school_category_id)`,
       [established_schools],
       (err, established) => {
         if (err) {
           console.log(err);
         }
         if (established) {
           db.query(
             `INSERT INTO applications (id,userId,secure_token,foreign_token,tracking_number,user_id,application_category_id,registry_type_id,is_approved,status_id,is_complete,created_at,updated_at) VALUES ? ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), userId=VALUES(userId), tracking_number=VALUES(tracking_number), is_approved=VALUES(is_approved), application_category_id=VALUES(application_category_id), registry_type_id=VALUES(registry_type_id), updated_at=VALUES(updated_at)`,
             [applications],
             (err2, application) => {
               if (err2) {
                 console.log(err2);
               }
               if (application) {
                 db.query(
                   `SET sql_mode = "NO_ZERO_IN_DATE"`,
                   (modeError) => {
                     if(modeError){
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
                         if (registered) {
                           success = true;
                         }
                         callback(success);
                       }
                     );
                   }
                 );
               }
             }
           );
         }
       }
     );
  },
  // Edit School
  editSchool : (tracking_number , callback) => {
        db.query(`SELECT e.id AS id, e.school_name AS name, e.school_category_id AS category, 
                  IFNULL(DATE(s.created_at) , null) AS registration_date,
                  a.registry_type_id AS ownership, e.tracking_number AS tracking_number,
                  s.registration_number AS registration_number, e.village_id AS street, 
                  w.WardCode AS ward, d.LgaCode AS lga, r.RegionCode AS region 
                  FROM establishing_schools e
                  ${ establishedApplicationRegisteredSchoolsSqlJoin() }
                  ${ schoolLocationsSqlJoin() }
                  WHERE a.tracking_number = ? ` , [tracking_number] , (error , school) => {
                          if(error){
                            console.log(error);
                          }
                  callback(error , school[0])
        });
  },
  updateSchool : (tracking_number , data , callback) => {
    const {school_name , kata , mtaa, category ,registration_date, registration_number , ownership} = data;
    const currentDate = formatDate(new Date());
    const values = [
      school_name,
      kata,
      mtaa,
      category,
      ownership,
      registration_date,
      registration_number,
      currentDate,
      currentDate,
      currentDate,
      tracking_number,
    ];
      //  console.log(values , data)
        db.query(`UPDATE applications a
                  ${applicationEstablishedRegisteredSchoolsSqlJoin()}
                  SET e.school_name = ?,
                      e.ward_id = ?,
                      e.village_id = ?,
                      e.school_category_id = ?,
                      a.registry_type_id = ?,
                      s.created_at = ?,
                      s.registration_number = ?,
                      s.updated_at = ?,
                      e.updated_at = ?,
                      a.updated_at = ?
                  WHERE e.tracking_number = ?
                  ` ,
                  values
                  , (error , result) => {
          if(error){
            console.log(error)
          }
          callback(error);
        })
  }
};
