require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const sajiliBinafsiRequestRouter = express.Router();
const dateandtime = require("date-and-time");
var session = require("express-session");
const { isAuth, formatDate, permission, selectConditionByTitle, selectStaffsBySection } = require("../../utils");
const sharedModel = require("../../models/sharedModel");

sajiliBinafsiRequestRouter.post(
    "/maombi-usajili-shule", 
    isAuth, 
    permission('view-school-owners-and-managers'), 
(req, res) => {
    var obj = [];
    var obj1 = [];
    var obj2 = [];
    // var districtId = req.body.districtCode;
    const user = req.user;
    var UserLevel = user.user_level;
    var Office = req.body.Office;

    // console.log(UserLevel); 
    sharedModel.maombiSummaryByCategoryAndStatus(user , 4 , (summary) => {
    // if (UserLevel == 33) {
      db.query(
        "SELECT school_categories.category as schoolCategory, applications.tracking_number as tracking_number, " +
          " applications.created_at as created_at, applications.user_id as user_id, " +
          " applications.foreign_token as foreign_token, " +
          " establishing_schools.school_name as school_name, regions.RegionName as RegionName, " +
          " districts.LgaName as LgaName from school_registrations, establishing_schools, applications, " +
          " wards, districts, school_categories, regions WHERE school_categories.id = establishing_schools.school_category_id " +
          " AND regions.RegionCode = districts.RegionCode AND districts.LgaCode = wards.LgaCode AND " +
          " school_registrations.establishing_school_id = establishing_schools.id AND " +
          " wards.WardCode = establishing_schools.ward_id AND school_registrations.tracking_number = applications.tracking_number " +
          " AND application_category_id = 4 AND applications.registry_type_id <> 3"+
            selectConditionByTitle(user)
        ,function (error, results) {
          if (error) {
            console.log(error);
          }
          for (var i = 0; i < results.length; i++) {
            console.log(results);
            var tracking_number = results[i].tracking_number;
            var registry_type_id = "";
            var user_id = results[i].user_id;
            var foreign_token = results[i].foreign_token;
            var school_name = results[i].school_name;
            var LgaName = results[i].LgaName;
            var RegionName = results[i].RegionName;
            var RegionName = results[i].RegionName;
            var registry = results[i].registry;
            var created_at = results[i].created_at;
            var schoolCategory = results[i].schoolCategory;
            var applicantname;
            var today = new Date();

            var diffInSeconds = Math.abs(today - created_at) / 1000;
            var days = Math.floor(diffInSeconds / 60 / 60 / 24);
            var hours = Math.floor((diffInSeconds / 60 / 60) % 24);
            var minutes = Math.floor((diffInSeconds / 60) % 60);
            var seconds = Math.floor(diffInSeconds % 60);
            var milliseconds = Math.round(
              (diffInSeconds - Math.floor(diffInSeconds)) * 1000
            );

            var remain_days;
            if (days > 0) {
              remain_days = "Siku " + days;
            } else if (days <= 0 && hours <= 0 && minutes <= 0) {
              remain_days = "Sek " + seconds + " zilizopita";
            } else if (days <= 0 && hours <= 0) {
              remain_days = "Dakika " + minutes + " zilizopita";
            } else if (days <= 0) {
              remain_days = "Saa " + hours;
            }
            obj.push({
              tracking_number: tracking_number,
              school_name: school_name,
              LgaName: LgaName,
              RegionName: RegionName,
              user_id: user_id,
              registry_type_id: registry_type_id,
              registry: registry,
              created_at: created_at,
              remain_days: remain_days,
              schoolCategory: schoolCategory,
            });
          }
          // console.log(obj)
          return res.send({
            error: false,
            statusCode: 300,
            dataSummary: summary,
            dataList: obj,
            message: "List of maombi kuanzisha shule.",
          });
        }
      );
    });
});

sajiliBinafsiRequestRouter.post(
    "/view-ombi-kusajili-details",
    isAuth, 
    permission('view-school-owners-and-managers'), 
    (req, res) => {
      var trackingNumber = req.body.TrackingNumber;
      const user = req.user;
      var userLevel = user.user_level;
      var office = req.body.office;
      console.log(req.body);
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
        "SELECT establishing_schools.id as schoolId, application_category_id," +
          " school_registrations.registration_number as reg_no, " +
          " school_registrations.updated_at as approved_at, number_of_teachers, gender_type, teacher_student_ratio_recommendation, " +
          " registration_structures.structure as structure, school_opening_date, number_of_students, " +
          " school_sub_categories.subcategory as subcategory, establishing_schools.tracking_number as tracking_number_old, " +
          " establishing_schools.area as area, school_phone, file_number, school_folio, folio, " +
          " establishing_schools.school_size as school_size, languages.language as language, school_email, po_box, website, " +
          " school_categories.id as schoolCategoryID, school_categories.category as schoolCategory, " +
          " applications.tracking_number as tracking_number, is_seminary, " +
          " applications.tracking_number as tracking_number, applications.created_at as created_at, teacher_information, " +
          " applications.registry_type_id as registry_type_id, applications.user_id as user_id, stream, " +
          " applications.foreign_token as foreign_token, establishing_schools.school_name as school_name, " +
          " wards.WardName as WardName, regions.RegionName as RegionName, districts.LgaName as LgaName " +
          " FROM school_gender_types, school_registrations, school_sub_categories, establishing_schools, applications, " +
          " registration_structures, wards, districts, school_categories, languages, regions " +
          " WHERE school_gender_types.id = establishing_schools.school_gender_type_id " +
          " AND school_registrations.establishing_school_id = establishing_schools.id AND " +
          " school_sub_categories.id = establishing_schools.school_sub_category_id AND " +
          " languages.id = establishing_schools.language_id AND school_categories.id = establishing_schools.school_category_id " +
          " AND regions.RegionCode = districts.RegionCode AND districts.LgaCode = wards.LgaCode AND " +
          " wards.WardCode = establishing_schools.ward_id AND school_registrations.tracking_number = applications.tracking_number " +
          " AND application_category_id = ? AND applications.tracking_number = ?",
        [4, trackingNumber],
        function (error, results, fields) {
          if (error) {
            console.log(error);
          }
          console.log(results);
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
            var finalFileNumber = file_number + "/" + school_folio + "/" + folio;
            var schoolCategoryID = results[0].schoolCategoryID;
            var school_email = results[0].school_email;
            var school_name = results[0].school_name;
            var gender_type = results[0].gender_type;
            var application_category_id = results[0].application_category_id;
            var LgaName = results[0].LgaName;
            var reg_no = results[0].reg_no;
            var RegionName = results[0].RegionName;
            var teacherInformation = results[0].teacher_information;
            var certificate = results[0].certificate;
            var Stream = results[0].stream;
            var approved_at = results[0].approved_at;
            approved_at = dateandtime.format(new Date(approved_at), "DD/MM/YYYY");
            var tracking_number_old = results[0].tracking_number_old;
            var school_phone = results[0].school_phone;
            var numberOfStudents = results[0].number_of_students;
            var schoolOpeningDate = results[0].school_opening_date;
            schoolOpeningDate = dateandtime.format(
              new Date(schoolOpeningDate),
              "DD/MM/YYYY"
            );
            var registry = "";
            var created_at = results[0].created_at;
            created_at = dateandtime.format(new Date(created_at), "DD/MM/YYYY");
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
  
          var today = new Date();
  
          var diffInSeconds = Math.abs(today - created_at) / 1000;
          var days = Math.floor(diffInSeconds / 60 / 60 / 24);
          var hours = Math.floor((diffInSeconds / 60 / 60) % 24);
          var minutes = Math.floor((diffInSeconds / 60) % 60);
          var seconds = Math.floor(diffInSeconds % 60);
          var milliseconds = Math.round(
            (diffInSeconds - Math.floor(diffInSeconds)) * 1000
          );
  
          db.query(
            "select * from maoni WHERE trackingNo = ?",
            [trackingNumber],
            function (error, resultsMaoni, fields) {
              if (error) {
                console.log(error);
              }
              if (resultsMaoni.length <= 0) {
                objMess.push({ count: 0 });
              } else {
                for (var i = 0; i < resultsMaoni.length; i++) {
                  // console.log(resultsMaoni)
                  var coments = resultsMaoni[i].coments;
                  objMess.push({ coments: coments });
                }
              }
            }
          );
            db.query(
              `SELECT r.id as vyeoId, s.id as userId, email, user_level, last_login, 
                        s.name as name, phone_no, r.name as role_name 
                FROM staffs s
                JOIN roles r ON r.id = s.user_level
                JOIN vyeo v ON v.id = r.vyeoId
                WHERE s.user_status = 1 AND v.id = ${
                  user.section_id
                } ${selectStaffsBySection(user)}
                ORDER BY name ASC`,
              function (error, results, fields) {
                if (error) {
                  console.log(error);
                }
                for (var i = 0; i < results.length; i++) {
                  var userId = results[i].userId;
                  var email = results[i].email;
                  var user_level = results[i].user_level;
                  var last_login = results[i].last_login;
                  var name = results[i].name;
                  var phone_no = results[i].phone_no;
                  var role_name = results[i].role_name;
                  var vyeoId = results[i].vyeoId;
                  objStaffs.push({
                    userId: userId,
                    name: name,
                    email: email,
                    phoneNumber: phone_no,
                    roleId: user_level,
                    role: role_name,
                    last_login: last_login,
                    vyeoId: vyeoId,
                  });
                }
              }
            );
            // console.log(application_category_id , registry_type_id)
          db.query(
            `SELECT attachment_types.id as id, file_size, file_format, UPPER(attachment_name) as attachment_name 
              FROM attachment_types
              WHERE status_id = 1 AND (registry_type_id = ${registry_type_id} OR registry_type_id = 0) 
                    AND application_category_id = ${application_category_id}`,
            function (error, results, fields) {
              if (error) {
                console.log(error);
              }
              for (var i = 0; i < results.length; i++) {
                var file_format = results[i].file_format;
                var app_id = results[i].id;
                var attachment_name = results[i].attachment_name;
                var registry = results[i].registry;
                var application_name = results[i].app_name;
                objAttachment.push({
                  file_format: file_format,
                  attachment_name: attachment_name,
                  registry_id: app_id,
                  registry: registry,
                  application_name: application_name,
                });
              }
            }
          );
  
          db.query(
            "SELECT attachment_types.id as id, file_size, file_format, " +
              " attachment_name, attachments.created_at as created_at, attachment_path " +
              " FROM attachment_types, " +
              " attachments WHERE attachments.attachment_type_id = attachment_types.id AND " +
              " attachments.tracking_number = ?",
            [trackingNumber],
            function (error1, results1, fields1) {
              if (error1) {
                console.log(error1);
              }
              if (results1.length > 0) {
                for (var i = 0; i < results1.length; i++) {
                  var file_format1 = results1[i].file_format;
                  var app_id1 = results1[i].id;
                  var attachment_name1 = results1[i].attachment_name;
                  // var registry1 = results[i].registry;
                  var attachment_path = results1[i].attachment_path;
                  var created_at = results1[i].created_at;
                  var file_size1 = results1[i].file_size;
                  objAttachment1.push({
                    file_format: file_format1,
                    attachment_name: attachment_name1,
                    registry_id: app_id1,
                    file_size: file_size1,
                    registry: "registry1",
                    application_name: "application_name1",
                    created_at: created_at,
                    attachment_path: attachment_path,
                  });
                }
              } else {
                objAttachment1.push({
                  file_format: "",
                  attachment_name: "",
                  registry_id: "",
                  file_size: "",
                  registry: "",
                  application_name: "",
                  created_at: "",
                  attachment_path: "",
                });
              }
              // console.log(objAttachment1)
            }
          );
  
          db.query(
            "SELECT * from application_statuses",
            function (error, results, fields) {
              if (error) {
                console.log(error);
              }
              for (var i = 0; i < results.length; i++) {
                var id = results[i].id;
                var statusName = results[i].status;
                objApps.push({ statusName: statusName, statusId: id });
              }
            }
          );
  
          db.query(`SELECT staffs.name AS name, user_from, user_to, coments, maoni.created_at as created_at, 
                    roles.name AS cheo 
                    FROM maoni, staffs, roles 
                    WHERE staffs.id = maoni.user_from AND roles.id = staffs.user_level 
                    AND trackingNo = ? 
                    ORDER BY maoni.id DESC`,
            [trackingNumber],
            function (error, results) {
              if (error) {
                console.log(error);
              }
              for (var i = 0; i < results.length; i++) {
                var name = results[i].name;
                var user_from = results[i].user_from;
                var user_to = results[i].user_to;
                var coments = results[i].coments;
                var rank_name = results[i].cheo;
                var created_at = results[i].created_at;
                // created_at = dateandtime.format( new Date(created_at),'DD/MM/YYYY');
                objMaoni.push({
                  user_from: user_from,
                  name: name,
                  user_to: user_to,
                  coments: coments,
                  created_at: created_at,
                  rank_name: rank_name,
                });
              }
            }
          );
  
          var remain_days;
          if (days > 0) {
            remain_days = "Siku " + days;
          } else if (days <= 0 && hours <= 0 && minutes <= 0) {
            remain_days = "Sek " + seconds + " zilizopita";
          } else if (days <= 0 && hours <= 0) {
            remain_days = "Dakika " + minutes + " zilizopita";
          } else if (days <= 0) {
            remain_days = "Saa " + hours;
          }
          db.query(
            "select registry_type_id from applications WHERE tracking_number = ?",
            [tracking_number_old],
            function (error1, results1, fields1) {
              var registry_type_id_old = results1[0].registry_type_id;
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
                    }else{
                      if(results1.length > 0){
                    var first_name = results1[0].first_name;
                    var middle_name = results1[0].middle_name;
                    var last_name = results1[0].last_name;
                    var occupation = "";
                    var personal_address = results1[0].personal_address;
                    var personal_phone_number = results1[0].personal_phone_number;
                    var personal_email = results1[0].personal_email;
                    var WardNameMtu = results1[0].WardName;
                    var LgaNameMtu = results1[0].LgaName;
                    var RegionNameMtu = results1[0].RegionName;
                    var fullname =
                      first_name + " " + middle_name + " " + last_name;
                    }if(results1.length == 0){
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
                        first_name + " " + middle_name + " " + last_name;
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
                      WardName: WardName,
                      structure: structure,
                      isSeminary: isSeminary,
                      numberOfStudents: numberOfStudents,
                      subcategory: subcategory,
                      WardNameMtu: WardNameMtu,
                      LgaNameMtu: LgaNameMtu,
                      RegionNameMtu: RegionNameMtu,
                      finalFileNumber: finalFileNumber,
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
                      WardName: WardName,
                      structure: structure,
                      isSeminary: isSeminary,
                      numberOfStudents: numberOfStudents,
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
    }
);


module.exports = sajiliBinafsiRequestRouter;
