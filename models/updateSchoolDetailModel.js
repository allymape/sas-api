const db = require("../dbConnection");
const { schoolLocationsSqlJoin, establishedApplicationRegisteredSchoolsSqlJoin, applicationEstablishedRegisteredSchoolsSqlJoin, formatDate, registeredSchoolsEstablishedApplicationSqlJoin } = require("../utils");

module.exports = {
  //******** GET A LIST OF REGISTERED SCHOOLS *******************************
  getSchoolInfo: (tracking_number, callback) => {
        db.query(
          `SELECT s.id AS id,s.tracking_number AS tracking_number,school_opening_date,registration_date,
                  level_of_education,is_seminary,registration_number,reg_status,sharti,
                  school_category_id, language_id,certificate_type_id, school_sub_category_id,school_name,school_size,area,stream,website,language_id,building_structure_id,
                  school_gender_type_id,school_specialization_id,ward_id,village_id,registration_structure_id,curriculum_id,
                  certificate_type_id,sect_name_id,school_phone,school_email,po_box,school_address,number_of_students,
                  lessons_and_courses,number_of_teachers,teacher_student_ratio_recommendation,teacher_information,is_for_disabled,
                  is_hostel,file_number,school_folio,max_folio
                  FROM school_registrations s 
                  INNER JOIN establishing_schools e ON e.id = s.establishing_school_id
                  WHERE s.tracking_number = ?`,
          [tracking_number],
          (error, results) => {
            if (error) console.log(error);
            db.query(`SELECT o.*
                      FROM school_registrations s 
                      INNER JOIN establishing_schools e ON e.id = s.establishing_school_id
                      INNER JOIN owners o ON o.establishing_school_id = e.id
                      WHERE s.tracking_number = ?` , [tracking_number] , (error2 , owners) => {
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
                                          callback(results[0], owners[0], managers[0]);
                                        }
                                      );
                      });
          }
        );
  },
  // 
  updateSchoolInfo: (tracking_number, data, callback) => {
    console.log(data)
    const {
      school_sub_category_id,
      registration_structure_id,
      building_structure_id,
      school_gender_id,
      language_id,
      school_specialization_id,
      curriculum_id,
      certificate_id,
      sect_name_id,
      stream,
      is_hostel,
    } = data;
    var success = false
      db.query(
        `UPDATE school_registrations AS s 
                INNER JOIN establishing_schools AS e ON e.id = s.establishing_school_id
                SET e.school_sub_category_id = ?,
                    e.registration_structure_id = ?,
                    e.building_structure_id = ?,
                    e.school_gender_type_id = ?, 
                    e.language_id = ?,
                    e.school_specialization_id = ?, 
                    e.curriculum_id = ?, 
                    e.certificate_type_id = ?, 
                    e.sect_name_id = ?,
                    e.stream = ?,
                    e.is_hostel = ?
                WHERE s.tracking_number = ?`,
        [
          school_sub_category_id,
          registration_structure_id,
          building_structure_id,
          school_gender_id,
          language_id ? language_id : null,
          school_specialization_id ? school_specialization_id : null,
          curriculum_id ? curriculum_id : null,
          certificate_id ? certificate_id : null,
          sect_name_id ? sect_name_id : null,
          stream,
          is_hostel == "on" ? 1 : 0,
          tracking_number,
        ],
        (error, result) => {
          if (error) {
            console.log(error);
          }
          if (result.affectedRows > 0) {
            success = true;
          }
          callback(error, success);
        }
      );
  },
};
