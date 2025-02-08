require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const sajiliBinafsiRequestRouter = express.Router();
const dateandtime = require("date-and-time");
const { isAuth, formatDate, permission, selectConditionByTitle, selectStaffsBySection, approvalStatuses, calculcateRemainDays, topSearch } = require("../../utils");
const sharedModel = require("../../models/sharedModel");

sajiliBinafsiRequestRouter.post(
    "/maombi-usajili-shule", 
    isAuth, 
(req, res) => {
    var obj = [];
    const user = req.user;
    const status = req.body.status ?  req.body.status : "pending";
    const approvedStatus = approvalStatuses(req.body.status);
    let sqlFilter = ` AND is_approved IN ${
      approvedStatus ? approvedStatus : "(0,1)"
    }`;
    sqlFilter = topSearch(req, sqlFilter);
    const per_page = parseInt(req.body.per_page);
    const page = parseInt(req.body.page);
    const offset = (page - 1) * per_page;
    const sqlSelect = `SELECT school_categories.category as schoolCategory, registration_number, applications.tracking_number as tracking_number,
                          applications.created_at as created_at, is_approved, applications.user_id as user_id,
                          applications.foreign_token as foreign_token, folio, 
                          establishing_schools.school_name as school_name, regions.RegionName as RegionName, 
                          districts.LgaName as LgaName , wards.WardName AS WardName , streets.StreetName AS StreetName`;

    const sqlFrom = ` FROM school_registrations
                      JOIN applications ON school_registrations.tracking_number = applications.tracking_number 
                      JOIN establishing_schools ON school_registrations.establishing_school_id = establishing_schools.id 
                      LEFT JOIN streets ON streets.StreetCode = establishing_schools.village_id
                      LEFT JOIN wards ON wards.WardCode = establishing_schools.ward_id
                      LEFT JOIN districts ON districts.LgaCode = wards.LgaCode 
                      LEFT JOIN school_categories ON school_categories.id = establishing_schools.school_category_id
                      LEFT JOIN regions ON  regions.RegionCode = districts.RegionCode
                      WHERE  application_category_id = 4 AND applications.registry_type_id <> 3 
                            AND payment_status_id = 2
                            AND is_complete = 1
                            ${
                              ["pending", ""].includes(status) ||
                              user.ngazi.toLowerCase() != "wizara"
                                ? selectConditionByTitle(
                                    user,
                                    false,
                                    false,
                                    status
                                  )
                                : ""
                            } ${sqlFilter}
                        ORDER BY applications.created_at DESC`;
    const sqlCount = `SELECT COUNT(*) AS num_rows ${sqlFrom}`;
    const sqlRows = `${sqlSelect} ${sqlFrom} LIMIT ?,?`;
    
    sharedModel.maombiSummaryByCategoryAndStatus(user , 4 , '(1,2)' , (summary) => {
      sharedModel.paginate(sqlRows , sqlCount, function (error, results , numRows) {
          if (error) {
            console.log(error);
          }
          for (var i = 0; i < results.length; i++) {
            // console.log(results);
            var tracking_number = results[i].tracking_number;
            var folio = results[i].folio;
            var registry_type_id = "";
            var user_id = results[i].user_id;
            var foreign_token = results[i].foreign_token;
            var is_approved = results[i].is_approved;
            var school_name = results[i].school_name;
            var LgaName = results[i].LgaName;
            var RegionName = results[i].RegionName;
            var WardName = results[i].WardName;
            var StreetName = results[i].StreetName;
            var registry = results[i].registry;
            var registration_number = results[i].registration_number;
            var created_at = results[i].created_at;
            var schoolCategory = results[i].schoolCategory;
            var remain_days = calculcateRemainDays(created_at);
            obj.push({
              tracking_number: tracking_number,
              school_name: school_name,
              StreetName: StreetName,
              WardName: WardName,
              LgaName: LgaName,
              RegionName: RegionName,
              user_id: user_id,
              registry_type_id: registry_type_id,
              registration_number: registration_number,
              registry: registry,
              created_at: created_at,
              remain_days: remain_days,
              schoolCategory: schoolCategory,
              folio,
              is_approved,
            });
          }
          // console.log(obj)
          return res.send({
            error: false,
            statusCode: 300,
            dataSummary: summary,
            dataList: obj,
            numRows : numRows,
            message: "List of maombi kuanzisha shule.",
          });
        },
        [offset , per_page]
      );
    });
});

sajiliBinafsiRequestRouter.post(
    "/view-ombi-kusajili-details",
    isAuth, 
    (req, res) => {
      var trackingNumber = req.body.TrackingNumber;
      const user = req.user;
      var userLevel = user.user_level;
      var office = req.body.office;
      // console.log(req.body);
      var todaydate = dateandtime.format(new Date(), "DD/MM/YYYY");
      var obj = [];
      var objMess = [];
      var objStaffs = [];
      var objApps = [];
      var objAttachment = [];
      var objMaoni = [];
      var objAttachment1 = [];
      var SeminaryValue;
      var SeminaryTitle;
      db.query(
        ` SELECT establishing_schools.id as schoolId, 
		  application_category_id, is_approved,
          school_registrations.registration_number as reg_no, 
          school_registrations.updated_at as approved_at, 
          number_of_teachers, 
          gender_type, 
          teacher_student_ratio_recommendation,
          registration_structures.structure as structure, 
          school_opening_date, number_of_students,
          school_sub_categories.subcategory as subcategory, 
          establishing_schools.tracking_number as tracking_number_old,
          establishing_schools.area as area, 
          school_phone, file_number, school_folio, folio,
          establishing_schools.school_size as school_size, 
          languages.language as language, 
          school_email, po_box, website,
          sharti,
          school_categories.id as schoolCategoryID, 
          school_categories.category as schoolCategory,
          applications.tracking_number as tracking_number, is_seminary,applications.tracking_number as tracking_number, 
          applications.created_at AS created_at, 
          teacher_information,
          applications.registry_type_id AS registry_type_id, applications.user_id AS user_id, stream,
          applications.foreign_token as foreign_token, 
          establishing_schools.school_name as school_name,
          streets.StreetName as StreetName, 
          wards.WardName as WardName, 
          regions.RegionName as RegionName, 
          districts.LgaName as LgaName
          FROM school_registrations
          JOIN applications ON school_registrations.tracking_number = applications.tracking_number
          JOIN establishing_schools ON school_registrations.establishing_school_id = establishing_schools.id
          LEFT JOIN school_gender_types ON school_gender_types.id = establishing_schools.school_gender_type_id 
          LEFT JOIN school_sub_categories ON school_sub_categories.id = establishing_schools.school_sub_category_id 
          LEFT JOIN registration_structures ON registration_structures.id = establishing_schools.registration_structure_id 
          LEFT JOIN streets ON streets.StreetCode = establishing_schools.village_id
          LEFT JOIN wards ON wards.WardCode = establishing_schools.ward_id 
          LEFT JOIN districts ON districts.LgaCode = wards.LgaCode 
          LEFT JOIN school_categories ON school_categories.id = establishing_schools.school_category_id
          LEFT JOIN languages ON languages.id = establishing_schools.language_id 
          LEFT JOIN regions ON regions.RegionCode = districts.RegionCode
          WHERE application_category_id = ? AND applications.tracking_number = ?`,
        [4, trackingNumber],
        function (error, results) {
          if (error) {
            console.log(error);
          }
        
          if (results.length > 0) {
            var tracking_number = results[0].tracking_number;
            var registry_type_id = results[0].registry_type_id;
            var user_id = results[0].user_id;
            var schoolId = results[0].schoolId;
            var staffname = "";
            var TeacherRatioStudent =
              results[0].teacher_student_ratio_recommendation;
            var foreign_token = results[0].foreign_token;
            var website = results[0].website;
            var file_number = results[0].file_number;
            var school_folio = results[0].school_folio;
            var folio = results[0].folio;
            var finalFileNumber =
              file_number + "/" + school_folio + "/" + folio;
            var schoolCategoryID = results[0].schoolCategoryID;
            var school_email = results[0].school_email;
            var school_name = results[0].school_name;
            var gender_type = results[0].gender_type;
            var application_category_id = results[0].application_category_id;
            var WardName = results[0].WardName;
            var StreetName = results[0].StreetName;
            var LgaName = results[0].LgaName;
            var reg_no = results[0].reg_no;
            var RegionName = results[0].RegionName;
            var teacherInformation = results[0].teacher_information;
            var certificate = results[0].certificate;
            var Stream = results[0].stream;
            var sharti = results[0].sharti;
            var approved_at = results[0].approved_at;
            approved_at = dateandtime.format(
              new Date(approved_at),
              "DD/MM/YYYY"
            );
            var tracking_number_old = results[0].tracking_number_old;
            var school_phone = results[0].school_phone;
            var numberOfStudents = results[0].number_of_students;
            var schoolOpeningDate = results[0].school_opening_date;
            schoolOpeningDate = dateandtime.format(
              new Date(schoolOpeningDate),
              "DD/MM/YYYY"
            );
            var is_approved = results[0].is_approved;
            var registry = "";
            var created_at = results[0].created_at;
            var school_address = results[0].school_address;
            var schoolCategory = results[0].schoolCategory;
            var po_box = results[0].po_box;
            var language = results[0].language;
            var school_size = results[0].school_size;
            var area = results[0].area;
            var WardName = results[0].WardName;
            var numberOfTeachers = results[0].number_of_teachers;
            var structure = results[0].structure;
            var subcategory = results[0].subcategory;
            var lessons_and_courses = results[0].lessons_and_courses;
            var isSeminary = results[0].is_seminary;
            var signature = "";
            if (signature == undefined) {
              signature = "-";
            }
            if (signature == "") {
              signature = "-";
            }
            if (isSeminary == 1) {
              SeminaryValue = 1;
              SeminaryTitle = "Seminari";
            } else if (isSeminary == 0) {
              SeminaryValue = 0;
              SeminaryTitle = "Kawaida";
            }
            // console.log(tracking_number_old)
          }

          var remain_days = calculcateRemainDays(created_at);

          sharedModel.getAttachments(trackingNumber, (attachments) => {
            objAttachment1 = attachments;
            sharedModel.myMaoni(trackingNumber, (maoni) => {
              objMaoni = maoni;
              sharedModel.myStaffs(user, (staffs) => {
                objStaffs = staffs;
                db.query(
                  "select registry_type_id from applications WHERE tracking_number = ?",
                  [tracking_number_old],
                  function (error1, results1) {
                    if (error1) {
                      console.log(error1);
                    }
                    var registry_type_id_old = results1[0].registry_type_id;
                    sharedModel.getAttachmentTypes(
                      registry_type_id,
                      application_category_id,
                      null,
                      (attachment_types) => {
                        objAttachment = attachment_types;
                        if (registry_type_id_old == 1) {
                          db.query(
                            "select * from personal_infos, applications, wards, districts, regions " +
                              " WHERE districts.RegionCode = regions.RegionCode AND wards.LgaCode = districts.LgaCode " +
                              " AND wards.WardCode = personal_infos.ward_id " +
                              " AND applications.foreign_token = personal_infos.secure_token AND applications.tracking_number = ?",
                            [tracking_number_old],
                            function (error1, results1, fields1) {
                              if (error1) {
                                console.log(error1);
                              } else {
                                if (results1.length > 0) {
                                  var first_name = results1[0].first_name;
                                  var middle_name = results1[0].middle_name;
                                  var last_name = results1[0].last_name;
                                  var occupation = "";
                                  var personal_address =
                                    results1[0].personal_address;
                                  var personal_phone_number =
                                    results1[0].personal_phone_number;
                                  var personal_email =
                                    results1[0].personal_email;
                                  var WardNameMtu = results1[0].WardName;
                                  var LgaNameMtu = results1[0].LgaName;
                                  var RegionNameMtu = results1[0].RegionName;
                                  var fullname =
                                    first_name +
                                    " " +
                                    middle_name +
                                    " " +
                                    last_name;
                                }
                                if (results1.length == 0) {
                                  var first_name = "";
                                  var middle_name = "";
                                  var last_name = "";
                                  var occupation = "";
                                  var personal_address = "";
                                  var personal_phone_number = "";
                                  var personal_email = "";
                                  var WardNameMtu = "";
                                  var LgaNameMtu = "";
                                  var RegionNameMtu = "";
                                  var fullname =
                                    first_name +
                                    " " +
                                    middle_name +
                                    " " +
                                    last_name;
                                }

                                obj.push({
                                  schoolId: schoolId,
                                  staffname: staffname,
                                  reg_no: reg_no,
                                  tracking_number: tracking_number,
                                  school_name: school_name,
                                  schoolOpeningDate: schoolOpeningDate,
                                  LgaName: LgaName,
                                  RegionName: RegionName,
                                  user_id: user_id,
                                  school_phone: school_phone,
                                  todaydate: todaydate,
                                  registry_type_id: registry_type_id,
                                  registry: registry,
                                  school_address: school_address,
                                  Stream: Stream,
                                  created_at: created_at,
                                  remain_days: remain_days,
                                  po_box: po_box,
                                  school_email: school_email,
                                  gender_type: gender_type,
                                  fullname: fullname,
                                  schoolCategory: schoolCategory,
                                  Certificate: certificate,
                                  numberOfTeachers: numberOfTeachers,
                                  occupation: occupation,
                                  Website: website,
                                  sharti: sharti,
                                  application_category_id:
                                    application_category_id,
                                  teacherInformation: teacherInformation,
                                  approved_at: approved_at,
                                  lessons_and_courses: lessons_and_courses,
                                  TeacherRatioStudent: TeacherRatioStudent,
                                  schoolCategoryID: schoolCategoryID,
                                  mwombajiAddress: personal_address,
                                  signature: signature,
                                  mwombajiPhoneNo: personal_phone_number,
                                  SeminaryTitle: SeminaryTitle,
                                  baruaPepe: personal_email,
                                  language: language,
                                  school_size: school_size,
                                  SeminaryValue: SeminaryValue,
                                  area: area,
                                  StreetName: StreetName,
                                  WardName: WardName,
                                  structure: structure,
                                  isSeminary: isSeminary,
                                  numberOfStudents: numberOfStudents,
                                  subcategory: subcategory,
                                  WardNameMtu: WardNameMtu,
                                  LgaNameMtu: LgaNameMtu,
                                  RegionNameMtu: RegionNameMtu,
                                  finalFileNumber: finalFileNumber,
                                  is_approved,
                                });
                                return res.send({
                                  error: false,
                                  statusCode: 300,
                                  data: obj,
                                  maoni: objMess,
                                  staffs: objStaffs,
                                  status: objApps,
                                  Maoni: objMaoni,
                                  objAttachment: objAttachment,
                                  objAttachment1: objAttachment1,
                                  message: "Taarifa za ombi kuanzisha shule.",
                                });
                              }
                            }
                          );
                        }
                        if (registry_type_id_old == 2) {
                          db.query(
                            "select institute_infos.id as id, institute_infos.name as name, institute_infos.address as address, " +
                              " institute_infos.institute_phone as institute_phone, institute_infos.institute_email as institute_email " +
                              " from institute_infos, applications WHERE " +
                              " applications.foreign_token = institute_infos.secure_token AND applications.tracking_number = ?",
                            [trackingNumber],
                            function (error1, results1, fields1) {
                              if (error1) {
                                console.log(error1);
                              }
                              var instId = results1[0].id;
                              var name = results1[0].name;
                              var address = results1[0].address;
                              var institute_phone = results1[0].institute_phone;
                              var institute_email = results1[0].institute_email;

                              obj.push({
                                schoolId: schoolId,
                                staffname: staffname,
                                reg_no: reg_no,
                                tracking_number: tracking_number,
                                school_name: school_name,
                                schoolOpeningDate: schoolOpeningDate,
                                StreetName: StreetName,
                                WardName: WardName,
                                LgaName: LgaName,
                                RegionName: RegionName,
                                user_id: user_id,
                                school_phone: school_phone,
                                todaydate: todaydate,
                                registry_type_id: registry_type_id,
                                registry: registry,
                                school_address: school_address,
                                Stream: Stream,
                                created_at: created_at,
                                remain_days: remain_days,
                                po_box: po_box,
                                school_email: school_email,
                                gender_type: gender_type,
                                fullname: name,
                                schoolCategory: schoolCategory,
                                Certificate: certificate,
                                numberOfTeachers: numberOfTeachers,
                                occupation: "",
                                Website: website,
                                teacherInformation: teacherInformation,
                                approved_at: approved_at,
                                finalFileNumber: finalFileNumber,
                                lessons_and_courses: lessons_and_courses,
                                TeacherRatioStudent: TeacherRatioStudent,
                                schoolCategoryID: schoolCategoryID,
                                signature: signature,
                                mwombajiAddress: address,
                                mwombajiPhoneNo: institute_phone,
                                SeminaryTitle: SeminaryTitle,
                                baruaPepe: "",
                                language: language,
                                school_size: school_size,
                                SeminaryValue: SeminaryValue,
                                area: area,
                                structure: structure,
                                isSeminary: isSeminary,
                                numberOfStudents: numberOfStudents,
                                subcategory: subcategory,
                                WardNameMtu: "",
                                LgaNameMtu: "",
                                RegionNameMtu: "",
                                is_approved,
                              });
                              return res.send({
                                error: false,
                                statusCode: 300,
                                data: obj,
                                maoni: objMess,
                                staffs: objStaffs,
                                status: objApps,
                                Maoni: objMaoni,
                                objAttachment: objAttachment,
                                objAttachment1: objAttachment1,
                                message: "Taarifa za ombi kuanzisha shule.",
                              });
                            }
                          );
                        }
                        if (registry_type_id_old == 3) {
                          obj.push({
                            schoolId: schoolId,
                            staffname: staffname,
                            reg_no: reg_no,
                            tracking_number: tracking_number,
                            school_name: school_name,
                            schoolOpeningDate: schoolOpeningDate,
                            LgaName: LgaName,
                            RegionName: RegionName,
                            user_id: user_id,
                            school_phone: school_phone,
                            todaydate: todaydate,
                            registry_type_id: registry_type_id,
                            registry: registry,
                            school_address: school_address,
                            Stream: Stream,
                            created_at: created_at,
                            remain_days: remain_days,
                            po_box: po_box,
                            school_email: school_email,
                            gender_type: gender_type,
                            fullname: "Mkurugenzi wa Halmashauri",
                            schoolCategory: schoolCategory,
                            Certificate: certificate,
                            numberOfTeachers: numberOfTeachers,
                            occupation: "",
                            Website: website,
                            teacherInformation: teacherInformation,
                            approved_at: approved_at,
                            finalFileNumber: finalFileNumber,
                            lessons_and_courses: lessons_and_courses,
                            TeacherRatioStudent: TeacherRatioStudent,
                            schoolCategoryID: schoolCategoryID,
                            mwombajiAddress: "",
                            mwombajiPhoneNo: "",
                            SeminaryTitle: SeminaryTitle,
                            baruaPepe: "",
                            language: language,
                            school_size: school_size,
                            SeminaryValue: SeminaryValue,
                            area: area,
                            WardName: WardName,
                            structure: structure,
                            isSeminary: isSeminary,
                            numberOfStudents: numberOfStudents,
                            signature: signature,
                            subcategory: subcategory,
                            WardNameMtu: "",
                            LgaNameMtu: "",
                            RegionNameMtu: "",
                          });
                          return res.send({
                            error: false,
                            statusCode: 300,
                            data: obj,
                            maoni: objMess,
                            staffs: objStaffs,
                            status: objApps,
                            Maoni: objMaoni,
                            objAttachment: objAttachment,
                            objAttachment1: objAttachment1,
                            message: "Taarifa za ombi kuanzisha shule.",
                          });
                        }
                      }
                    );
                  }
                );
              });
            });
          });
        });
    }
);


module.exports = sajiliBinafsiRequestRouter;
