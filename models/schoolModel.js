const db = require("../dbConnection");
const { schoolLocationsSqlJoin, establishedApplicationRegisteredSchoolsSqlJoin, applicationEstablishedRegisteredSchoolsSqlJoin, formatDate, registeredSchoolsEstablishedApplicationSqlJoin } = require("../utils");

module.exports = {
  //******** GET A LIST OF REGISTERED SCHOOLS *******************************
  getAllSchools: (offset, per_page, searchKeyword, typeKeyword, ownerKeyword, compare , callback) => {
    const  keyword  = db.escape(compare == 'LIKE' ? `%${searchKeyword}%` : `${searchKeyword}`);
    const  type     = db.escape(Number(typeKeyword));
    const  owner    = db.escape(Number(ownerKeyword));
    const  sign     = db.escape(compare);
    const sqlQuery = `FROM school_registrations s 
                      JOIN establishing_schools e ON s.establishing_school_id = e.id
                      JOIN applications a ON a.tracking_number = s.tracking_number
                      JOIN school_categories sc ON sc.id = e.school_category_id
                      LEFT JOIN registry_types rt ON rt.id = a.registry_type_id
                      ${ schoolLocationsSqlJoin() }
                      WHERE  s.reg_status IN (1,2,3)
                      `;
  
    const searchByKeywordQuery =  searchKeyword ? `AND 
                  ( ${ (sign == '=' ? 'e.school_name='+keyword : 'e.school_name LIKE '+keyword) }  
                    OR 
                    ${ sign == '=' ? 's.registration_number='+keyword : 's.registration_number LIKE '+keyword }
                  )` : '';
    //  console.log(sign , searchByKeywordQuery , keyword);
    const searchByTypeQuery    =  typeKeyword    ? `AND  e.school_category_id = ${type}` : '';
    const searchByOwnerQuery   =  ownerKeyword   ? `AND a.registry_type_id = ${owner}` : '';
     
    // console.log(searchByKeywordQuery, searchByTypeQuery, searchByOwnerQuery);
   
    db.query(
      `SELECT s.tracking_number AS id,
              school_name AS name, 
              registration_number AS reg_no, 
              rt.registry AS ownership,
              sc.category AS category,
              IFNULL(school_opening_date , '') AS opening_date, 
              r.RegionName AS region, 
              d.LgaName AS lga,
              w.WardName AS ward, 
              st.StreetName AS street,
              IFNULL(registration_date , '') AS reg_date, 
              DATE_FORMAT(s.updated_at , '%Y-%m-%d %H:%i:%s') AS updated_at, 
              CASE 
                  WHEN s.reg_status = 1 THEN 'Imesajiliwa'
                  WHEN s.reg_status = 2 THEN 'Imefutiwa Usajili'
                  ELSE 'Unknown'
              END AS status,
              reg_status
              ${sqlQuery}
              ${searchByKeywordQuery}
              ${searchByTypeQuery}
              ${searchByOwnerQuery}
              LIMIT ?, ?`,
      [offset, per_page],
      (error, schools) => {
        if (error) console.log(error);
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
            console.log(result[0].num_rows);
            callback(error, schools, result[0].num_rows);
          }
        );
      }
    );
  },
  // LOOK FOR SCHOOLS
  lookForSchools : (offset , per_page , search, callback) => {
        const keyword = db.escape(`%${search}%`);
        const searchSql = search
          ? ` WHERE (e.school_name LIKE ${keyword} OR s.registration_number LIKE ${keyword} OR e.tracking_number LIKE ${keyword}) `
          : "";
        const sql = `SELECT e.tracking_number AS id, e.school_name AS text , s.registration_number AS registration_number,
                    r.RegionName AS region, d.LgaName AS district, w.WardName AS ward
                            FROM school_registrations s
                            ${registeredSchoolsEstablishedApplicationSqlJoin()} 
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
          console.log(schools)
          callback(error, schools);
        }
      );
  },
  //******** STORE SCHOOLS *******************************
  storeSchools: (established_schools , applications , school_registrations, owners, applicants, callback) => {
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
  checkIfExistSchool : (reg_number , callback) =>{
       var exist = false;
       db.query(`SELECT * FROM school_registrations s WHERE registration_number = ?` , [reg_number] , (error , res) => {
             if(error) console.log(error)
              if(res.length > 0){
                  exist = true;
              }
              callback(exist)
       });
  }, 
  // find last id
  lastSchoolId : (callback) => {
      db.query(`SELECT MAX(id) AS id FROM applications` , (err , res) => {
         if(err) console.log(err)
         var id = 0;
          if(res.length > 0){
            id = res[0].id;
          }
         callback(id);
      })
  },
  // Edit School
  editSchool : (tracking_number , callback) => {
        db.query(
          `SELECT e.id AS id, e.school_name AS name, e.school_category_id AS category, 
                  IFNULL(DATE(s.registration_date) , null) AS registration_date,
                  a.registry_type_id AS ownership, e.tracking_number AS tracking_number,
                  s.registration_number AS registration_number, e.village_id AS street, 
                  w.WardCode AS ward, d.LgaCode AS lga, r.RegionCode AS region 
                  FROM school_registrations s
                  ${registeredSchoolsEstablishedApplicationSqlJoin()}
                  ${schoolLocationsSqlJoin()}
                  WHERE s.tracking_number = ? `,
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
  updateSchool : (tracking_number , data , callback) => {
    var {school_name , kata , mtaa, category ,registration_date, registration_number , ownership} = data;
    var message = '';
    registration_number = registration_number.replace(/\s+/g,'');
    db.query(`SELECT id 
              FROM school_registrations s 
              WHERE s.registration_number = ? AND s.tracking_number <> ?` , 
      [registration_number , tracking_number] , 
      (err , results) => {
             if(err) console.log(err)
              // Update
              if(results.length == 0){
                 const currentDate = formatDate(new Date());
                 const values = [
                   school_name,
                   kata,
                   mtaa,
                   category,
                   4,
                   ownership,
                   registration_number,
                   registration_date,
                   currentDate,
                   currentDate,
                   currentDate,
                   currentDate,
                   tracking_number,
                 ];
                 //  console.log(values , data)
                //  remove space reg number
                // db.query(`UPDATE school_registrations SET registration_number = REPLACE(registration_number , ' ', '')`, 
                //   function (e) {
                //     if(e) console.log(e);
                //   });
                 db.query(
                   `UPDATE  school_registrations s
                  ${registeredSchoolsEstablishedApplicationSqlJoin()}
                  SET e.school_name = ?,
                      e.ward_id = ?,
                      e.village_id = ?,
                      e.school_category_id = ?,
                      a.application_category_id = ?,
                      a.registry_type_id = ?,
                      s.registration_number = ?,
                      s.registration_date = ?,
                      s.created_at = ?,
                      s.updated_at = ?,
                      e.updated_at = ?,
                      a.updated_at = ?
                  WHERE s.tracking_number = ?
                  `,
                   values,
                   (error , result) => {
                     if (error) {
                       console.log(error);
                       message = "Haujafanikiwa kuna tatizo.";
                     }else{
                       if(result.affectedRows > 0) {
                        message = "Umefanikiwa kufanya mabadiliko.";
                       }else{
                        message = "Haujafanikiwa kuna tatizo.";
                       }
                     }
                     callback(error , message);
                   }
                 );
              }else{
                callback(true , "Namba ya usajili uliyoingiza imeshatumika.");
              }
    })
  },

  changeSchoolName : (req , callback) => {
    db.query(
            "UPDATE establishing_schools SET school_name = ? WHERE tracking_number = ?",
            [req.body.newName, req.body.trackingId],
            function (error, results, fields) {
              if (error) {
                console.log(error);
              }
              const success = results.affectedRows > 0
              callback(success);
            }
          );
  }
};
