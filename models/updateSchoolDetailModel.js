const db = require("../dbConnection");
const { schoolLocationsSqlJoin, establishedApplicationRegisteredSchoolsSqlJoin, applicationEstablishedRegisteredSchoolsSqlJoin, formatDate, registeredSchoolsEstablishedApplicationSqlJoin } = require("../utils");

module.exports = {
  //******** GET A LIST OF REGISTERED SCHOOLS *******************************
  getSchoolInfo: (req, callback) => {
     const tracking_number = req.params.tracking_number; 
     const { sehemu, zone_id, district_code } = req.user;
        db.query(
          `SELECT s.id AS id, e.tracking_number AS establish_tracking_number, 
                  s.tracking_number AS tracking_number,school_opening_date,registration_date,registry_type_id,
                  level_of_education,is_seminary,registration_number,reg_status,sharti,
                  r.RegionName AS region, d.LgaName AS district, w.WardName AS ward, st.StreetName AS street,
                  school_category_id, language_id,certificate_type_id, school_sub_category_id,school_name,school_size,area,stream,website,language_id,building_structure_id,
                  school_gender_type_id,school_specialization_id,ward_id,village_id,registration_structure_id,curriculum_id,
                  certificate_type_id,sect_name_id,school_phone,school_email,po_box,school_address,number_of_students,
                  lessons_and_courses,number_of_teachers,teacher_student_ratio_recommendation,teacher_information,is_for_disabled,
                  is_hostel,file_number,school_folio,max_folio
                  FROM school_registrations s 
                  INNER JOIN establishing_schools e ON e.id = s.establishing_school_id
                  INNER JOIN applications a ON a.tracking_number = s.tracking_number
                  ${schoolLocationsSqlJoin()}
                  WHERE  s.reg_status IN (1)
                  ${sehemu == "k1" ? "AND zone_id = " + zone_id : ""}
                        ${
                          sehemu == "w1"
                            ? "AND d.LgaCode = '" + district_code + "'"
                            : ""
                        }
                  AND s.tracking_number = ?`,
          [tracking_number],
          (error, results) => {
            if (error) console.log(error);
            db.query(
              `SELECT o.*
                      FROM school_registrations s 
                      INNER JOIN establishing_schools e ON e.id = s.establishing_school_id
                      INNER JOIN owners o ON o.establishing_school_id = e.id
                      WHERE s.tracking_number = ?`,
              [tracking_number],
              (error2, owners) => {
                if (error2) console.log(error2);
                db.query(
                  `SELECT m.*
                                    FROM school_registrations s 
                                    INNER JOIN establishing_schools e ON e.id = s.establishing_school_id
                                    INNER JOIN managers m ON m.establishing_school_id = e.id
                                    WHERE s.tracking_number = ?`,
                  [tracking_number],
                  (error2, managers) => {
                    if (error2) console.log(error2);
                    db.query(
                      `SELECT combination_id
                                                    FROM school_combinations  sc
                                                    INNER JOIN school_registrations s ON sc.school_registration_id = s.id
                                                    WHERE s.tracking_number = ?`,
                      [tracking_number],
                      (error3, school_combinations) => {
                        if (error3) console.log(error3);
                        const combinationIds = school_combinations.map(
                          (row) => row.combination_id
                        );
                        // console.log(results);
                        callback(
                          results[0],
                          owners[0],
                          managers[0],
                          combinationIds
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
  // 
  updateSchoolInfo: (tracking_number, data, callback) => {
    // console.log(data)
    const {
      school_sub_category_id,
      registry_type_id,
      registration_structure_id,
      building_structure_id,
      school_gender_id,
      language_id,
      curriculum_id,
      certificate_id,
      sect_name_id,
      stream,
      // school_size,
      area,
      is_for_disabled,
      is_seminary,
      website,
      school_phone,
      school_address,
      po_box,
      number_of_students,
      number_of_teachers,
      is_hostel,
    } = data;

    const {combinations , school_specialization_id,} = data

    var success = false
      db.query(
        `UPDATE school_registrations AS s 
                INNER JOIN establishing_schools AS e ON e.id = s.establishing_school_id
                INNER JOIN applications a ON a.tracking_number = e.tracking_number
                SET e.school_sub_category_id = ?,
                    a.registry_type_id = ?,
                    e.registration_structure_id = ?,
                    e.building_structure_id = ?,
                    e.school_gender_type_id = ?, 
                    e.language_id = ?,
                    e.school_specialization_id = ?, 
                    e.curriculum_id = ?, 
                    e.certificate_type_id = ?, 
                    e.sect_name_id = ?,
                    e.stream = ?,
                    e.area = ?,
                    e.is_for_disabled = ?,
                    s.is_seminary = ?,
                    e.website = ?,
                    e.school_phone = ?,
                    e.school_address = ?,
                    e.po_box = ?,
                    e.number_of_students = ?,
                    e.number_of_teachers = ?,
                    e.is_hostel = ?
                WHERE s.tracking_number = ?`,
        [
          school_sub_category_id ? school_sub_category_id : null,
          registry_type_id ? registry_type_id : null,
          registration_structure_id ? registration_structure_id : null,
          building_structure_id ? building_structure_id : null,
          school_gender_id ? school_gender_id : null,
          language_id ? language_id : null,
          school_specialization_id && [2, 6].includes(Number(certificate_id))
            ? school_specialization_id
            : null,
          curriculum_id ? curriculum_id : null,
          certificate_id ? certificate_id : null,
          sect_name_id ? sect_name_id : null,
          stream ? stream : null,
          // school_size ? school_size : null,
          area ? area : null,
          is_for_disabled == "on" ? 1 : 0,
          is_seminary == "on" ? 1 : 0,
          website,
          school_phone,
          school_address,
          po_box,
          number_of_students ? number_of_students : null,
          number_of_teachers ? number_of_teachers : null,
          is_hostel == "on" ? 1 : 0,
          tracking_number,
        ],
        (error, result) => {
          if (error) {
            console.log(error);
          }
          if (result.affectedRows > 0) {
            success = true;
            //insert combinations
            db.query(
              `SELECT s.id AS school_registration_id , establishing_school_id AS school_id, a.foreign_token AS secure_token
                      FROM school_registrations s 
                      LEFT JOIN establishing_schools e ON e.id = s.establishing_school_id
                      LEFT JOIN applications a ON a.tracking_number = e.tracking_number
                      WHERE s.tracking_number = ?`,
              [tracking_number],
              (error2, school) => {
                if (error2) {
                  console.log(error2);
                  error = error2;
                }
                const school_id = school[0].school_id;
                const secure_token = school[0].secure_token;
                const school_registration_id = school[0].school_registration_id;
                if(secure_token && registry_type_id == 2){
                  const {
                    institution_name,
                    company_registration_number,
                    company_box,
                  } = data;
                  const institution_values = [
                      [
                        secure_token,
                        institution_name || null,
                        company_registration_number || null,
                        company_box || null,
                      ],
                  ];
                  db.query(
                    `INSERT INTO institute_infos(secure_token, name, registration_number, box) VALUES(?,?,?,?)
                            ON DUPLICATE KEY UPDATE 
                            name = VALUES(name), 
                            registration_number = VALUES(registration_number), 
                            box = VALUES(box)`,
                            institution_values[0],
                    (errInst, resInst) => {
                      if (errInst)
                        console.log(`${errInst}`);
                      else 
                        console.log(
                          "Institution stored successfully:",
                          institution_name,
                          company_registration_number,
                          company_box,
                          secure_token
                        );
                    }
                  );
                }else{
                  if(secure_token){
                    db.query(
                      `DELETE FROM institute_infos WHERE secure_token = ?`,
                      [secure_token], (errDelIns , deletInstRes) => {
                         if(errDelIns) console.log(errDelIns);
                      }
                    );
                  }
                }
                db.query(
                  `DELETE FROM school_combinations WHERE school_registration_id = ?`,
                  [school_registration_id],
                  (errDelete) => {
                    if (errDelete)
                      console.log(
                        "Unable to delete school combinations due to ".errDelete
                      );
                    if (
                      Array.isArray(combinations) &&
                      combinations.length > 0
                    ) {
                      const school_combination_values = combinations.map(
                        (combination_id) => [
                          school_registration_id,
                          Number(combination_id),
                          formatDate(new Date()),
                          formatDate(new Date()),
                        ]
                      );
                      if ([2, 6].includes(Number(certificate_id))) {
                        db.query(
                          `INSERT INTO school_combinations (school_registration_id , combination_id , created_at, updated_at) VALUES ? `,
                          [school_combination_values],
                          (combError) => {
                            if (combError)
                              console.log(
                                "Unable to insert combinations due to "
                                  .combError
                              );
                          }
                        );
                      }
                    }
                    // db.query(`INSERT INTO school_combinations VALUES(?)` , )
                  }
                );
                const {
                  owner_name,
                  authorized_person,
                  title,
                  owner_email,
                  phone_number,
                  is_manager,
                  ownership_sub_type_id,
                  denomination_id,
                } = data;
                const {
                  manager_first_name,
                  manager_middle_name,
                  manager_last_name,
                  occupation,
                  manager_email,
                  manager_phone_number,
                } = data;
                if (school.length > 0) {
                  //check if owner exist
                  db.query(
                    `SELECT * FROM owners WHERE establishing_school_id = ?`,
                    [school_id],
                    (error3, existOwner) => {
                      if (error3) {
                        error = error3;
                        console.log(error3);
                      }
                      if (existOwner.length > 0) {
                        //update owner
                        db.query(
                          `UPDATE owners 
                              SET 
                              owner_name = ?,
                              authorized_person = ?,
                              title = ?,
                              owner_email = ?,
                              phone_number = ?,
                              is_manager = ?,
                              ownership_sub_type_id = ?,
                              denomination_id = ?
                              WHERE establishing_school_id = ?`,
                          [
                            owner_name,
                            authorized_person,
                            title,
                            owner_email,
                            phone_number,
                            is_manager == "on" ? 1 : 0,
                            ownership_sub_type_id
                              ? ownership_sub_type_id
                              : null,
                            denomination_id ? denomination_id : null,
                            school_id,
                          ],
                          (error4, updateOwner) => {
                            if (error4) {
                              console.log(
                                "Unable to update owners due to " + error4
                              );
                              error = error4;
                            } else {
                              if (updateOwner.affectedRows) {
                                console.log("Owner updated successfully");
                              }
                            }
                          }
                        );
                      } else {
                        //insert owner
                        db.query(
                          `INSERT INTO owners (establishing_school_id, 
                                      owner_name,
                                      authorized_person, 
                                      title, owner_email ,
                                      phone_number,
                                      is_maneger,
                                      ownership_sub_type_id,
                                      denomination_id) VALUES(?)`,
                          [
                            school_id,
                            owner_name,
                            authorized_person,
                            title,
                            owner_email,
                            phone_number,
                            is_manager,
                            ownership_sub_type_id,
                            denomination_id,
                          ],
                          (error5, insertOwner) => {
                            if (error5) {
                              console.log(
                                "Unable to insert owner due to " + error5
                              );
                              error = error5;
                            } else {
                              if (insertOwner.affectedRows) {
                                console.log("Owner inserted successfully");
                              }
                            }
                          }
                        );
                      }
                    }
                  );
                  //check if manager exist
                  db.query(
                    `SELECT * FROM managers WHERE establishing_school_id = ?`,
                    [school_id],
                    (error3, existManager) => {
                      if (error3) {
                        error = error3;
                        console.log(error3);
                      }
                      if (existManager.length > 0) {
                        //update owner
                        db.query(
                          `UPDATE managers 
                              SET 
                              manager_first_name = ?,
                              manager_middle_name = ?,
                              manager_last_name = ?,
                              occupation = ?,
                              manager_phone_number = ?,
                              manager_email = ?
                              WHERE establishing_school_id = ?`,
                          [
                            manager_first_name,
                            manager_middle_name,
                            manager_last_name,
                            occupation,
                            manager_phone_number,
                            manager_email,
                            school_id,
                          ],
                          (error6, updateManager) => {
                            if (error6) {
                              console.log(
                                "Unable to update manager due to " + error4
                              );
                              error = error6;
                            } else {
                              if (updateManager.affectedRows) {
                                console.log("Manager updated successfully");
                              }
                            }
                          }
                        );
                      } else {
                        //insert owner
                        db.query(
                          `INSERT INTO managers (
                                    establishing_school_id, 
                                    manager_first_name,
                                    manager_middle_name, 
                                    manager_last_name, 
                                    occupation ,
                                    manager_phone_number,
                                    manager_email) VALUES (?)`,
                          [
                            [
                              school_id,
                              manager_first_name,
                              manager_middle_name,
                              manager_last_name,
                              occupation,
                              manager_phone_number,
                              manager_email,
                            ],
                          ],
                          (error7, insertManager) => {
                            if (error7) {
                              console.log(error7);
                              console.log(
                                "Unable to insert manager due to " + error7
                              );
                              error = error7;
                            } else {
                              if (insertManager.affectedRows > 0) {
                                console.log("Manager inserted successfully");
                              }
                            }
                          }
                        );
                      }
                    }
                  );
                } else {
                  success = false;
                  error = true;
                }
              }
            );
          }
          callback(error, success);
        }
      );
  },
};
