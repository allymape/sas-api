const db = require("../dbConnection");
const { schoolLocationsSqlJoin, establishedApplicationRegisteredSchoolsSqlJoin, applicationEstablishedRegisteredSchoolsSqlJoin, formatDate, registeredSchoolsEstablishedApplicationSqlJoin } = require("../utils");

module.exports = {
  //******** GET A LIST OF REGISTERED SCHOOLS *******************************
  getSchoolInfo: (tracking_number, callback) => {
        db.query(
          `SELECT s.id AS id,s.tracking_number AS tracking_number,school_opening_date,registration_date,
                  level_of_education,is_seminary,registration_number,reg_status,sharti,school_category_id,
                  school_sub_category_id,school_name,school_size,area,stream,website,language_id,building_structure_id,
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
            callback(results[0]);
          }
        );
  },
  
};
