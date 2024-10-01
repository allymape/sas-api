require("dotenv").config();
const express = require("express");
const db = require("../../dbConnection");
const sajiliSerikaliRequestRouter = express.Router();

const {
  isAuth,
  formatDate,
  permission,
  selectConditionByTitle,
  selectStaffsBySection,
  approvalStatuses,
  calculcateRemainDays,
} = require("../../utils");
const sharedModel = require("../../models/sharedModel");

sajiliSerikaliRequestRouter.post(
  "/maombi-usajili-ser-shule",
  isAuth,
  permission("view-school-registration-government"),
  (req, res, next) => {
    var obj = [];
    const user = req.user;
    const status = req.body.status ?  req.body.status : "pending";
    const approvedStatus = approvalStatuses(req.body.status);
    const sqlStatus = ` AND is_approved IN ${
      approvedStatus ? approvedStatus : "(0,1)"
    }`;
    const per_page = parseInt(req.body.per_page);
    const page = parseInt(req.body.page);
    const offset = (page - 1) * per_page;

    sharedModel.maombiSummaryByCategoryAndStatus(
      user,
      4,
      "(3)",
      (summaries) => {
        const sqlFrom = `FROM school_registrations
                      JOIN applications ON school_registrations.tracking_number = applications.tracking_number 
                      JOIN establishing_schools ON school_registrations.establishing_school_id = establishing_schools.id 
                      LEFT JOIN wards ON wards.WardCode = establishing_schools.ward_id
                      LEFT JOIN districts ON districts.LgaCode = wards.LgaCode 
                      LEFT JOIN school_categories ON school_categories.id = establishing_schools.school_category_id
                      LEFT JOIN regions ON  regions.RegionCode = districts.RegionCode
                      WHERE application_category_id = 4 AND 
                            applications.registry_type_id = 3 AND 
                            payment_status_id = 2 AND 
                            is_complete = 1
                    ${
                      ["pending", ""].includes(status) ||
                      user.ngazi.toLowerCase() != "wizara"
                        ? selectConditionByTitle(user, false, false, status)
                        : ""
                    }  ${sqlStatus}
                    ORDER BY applications.created_at DESC `;

        sharedModel.paginate(
          ` SELECT school_categories.category as schoolCategory, registration_number, applications.tracking_number as tracking_number, 
              applications.created_at as created_at, applications.user_id as user_id, 
              applications.foreign_token as foreign_token, folio, is_approved,
              establishing_schools.school_name as school_name, regions.RegionName as RegionName, 
              districts.LgaName as LgaName 
              ${sqlFrom}
              LIMIT ?, ?
              `,
          `SELECT COUNT(*) AS num_rows ${sqlFrom}`,
          (error, results, numRows) => {
            if (error) console.log(error);
            for (var i = 0; i < results.length; i++) {
              // console.log(results);
              var tracking_number = results[i].tracking_number;
              var registry_type_id = "";
              var user_id = results[i].user_id;
              var foreign_token = results[i].foreign_token;
              var school_name = results[i].school_name;
              var LgaName = results[i].LgaName;
              var RegionName = results[i].RegionName;
              var RegionName = results[i].RegionName;
              var registry = results[i].registry;
              var registration_number = results[i].registration_number;
              var created_at = results[i].created_at;
              var schoolCategory = results[i].schoolCategory;
              var folio = results[i].folio;
              var applicantname;
              var is_approved = results[0].is_approved;
              var remain_days = calculcateRemainDays(created_at);
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
                registration_number: registration_number,
                schoolCategory: schoolCategory,
                folio,
                is_approved,
              });
            }
            // console.log(obj)
            return res.send({
              error: false,
              statusCode: 300,
              dataSummary: summaries,
              dataList: obj,
              numRows: numRows,
              message: "List of maombi kuanzisha shule.",
            });
          },
          [offset, per_page]
        );
      }
    );
  }
);

sajiliSerikaliRequestRouter.post(
  "/view-ombi-kusajili-ser-details",
  isAuth,
  permission("view-school-registration-government"),
  (req, res, next) => {
    var trackingNumber = req.body.TrackingNumber;
    const user = req.user;
    var obj = [];
    var objMess = [];
    var objStaffs = [];
    var objApps = [];
    var objAttachment = [];
    var objMaoni = [];
    var objAttachment1 = [];
    var SeminaryValue;
    var SeminaryTitle;
    var DisabledValue;
    var DisabledTitle;
    // console.log(trackingNumber);
    db.query(
      `SELECT manager_first_name, owner_name, number_of_teachers, gender_type,
        is_for_disabled, building, teacher_student_ratio_recommendation,
        registration_structures.structure as structure, school_opening_date, number_of_students,
        school_sub_categories.subcategory as subcategory,
        is_approved,
        sharti,
        establishing_schools.tracking_number as tracking_number_old,
        establishing_schools.area as area, school_phone,
        establishing_schools.school_size as school_size,
        languages.language as language, school_email, po_box, website,
        school_categories.id as schoolCategoryID, school_categories.category as schoolCategory,
        applications.tracking_number as tracking_number, is_seminary,
        applications.created_at as created_at, teacher_information,
        applications.registry_type_id as registry_type_id, application_category_id, applications.user_id as user_id, stream,
        applications.foreign_token as foreign_token, establishing_schools.school_name as school_name,
        wards.WardName as WardName, regions.RegionName as RegionName, districts.LgaName as LgaName
        FROM managers
        LEFT JOIN establishing_schools ON managers.establishing_school_id = establishing_schools.id 
        LEFT JOIN  owners ON owners.establishing_school_id = establishing_schools.id 
        LEFT JOIN building_structures ON building_structures.id = establishing_schools.building_structure_id 
        LEFT JOIN school_sub_categories ON school_sub_categories.id = establishing_schools.school_sub_category_id 
        LEFT JOIN school_gender_types ON school_gender_types.id = establishing_schools.school_gender_type_id
        LEFT JOIN school_registrations ON school_registrations.establishing_school_id = establishing_schools.id
        LEFT JOIN applications ON  school_registrations.tracking_number = applications.tracking_number 
        LEFT JOIN registration_structures ON registration_structures.id = establishing_schools.registration_structure_id 
        LEFT JOIN wards ON wards.WardCode = establishing_schools.ward_id 
        LEFT JOIN districts  ON districts.LgaCode = wards.LgaCode 
        LEFT JOIN school_categories ON school_categories.id = establishing_schools.school_category_id  
        LEFT JOIN languages ON languages.id = establishing_schools.language_id  
        LEFT JOIN regions ON regions.RegionCode = districts.RegionCode 
        WHERE application_category_id = 4 AND applications.tracking_number = ?`,
      [trackingNumber],
      function (error, results) {
        if (error) {
          console.log(error);
        }
        // console.log("results");

        if (results.length > 0) {
          var tracking_number = results[0].tracking_number;
          var registry_type_id = results[0].registry_type_id;
          var application_category_id = results[0].application_category_id;
          var user_id = results[0].user_id;
          var TeacherRatioStudent =
            results[0].teacher_student_ratio_recommendation;
          var manager_first_name = results[0].manager_first_name;
          var website = results[0].website;
          var schoolCategoryID = results[0].schoolCategoryID;
          var school_email = results[0].school_email;
          var school_name = results[0].school_name;
          var gender_type = results[0].gender_type;
          var LgaName = results[0].LgaName;
          var RegionName = results[0].RegionName;
          var RegionName = results[0].RegionName;
          var teacherInformation = results[0].teacher_information;
          var certificate = results[0].certificate;
          var Stream = results[0].stream;
          var sharti = results[0].sharti;
          var isForDisabled = results[0].is_for_disabled;
          var tracking_number_old = results[0].tracking_number_old;
          var school_phone = results[0].school_phone;
          var numberOfStudents = results[0].number_of_students;
          var schoolOpeningDate = results[0].school_opening_date;
          schoolOpeningDate = formatDate(schoolOpeningDate);
          var registry = "";
          var created_at = results[0].created_at;
          var is_approved = results[0].is_approved;
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
          var building = results[0].building;
          var specialization = results[0].specialization;
          var owner_name = results[0].owner_name;
          var remain_days = calculcateRemainDays(created_at);
          if (isSeminary == 1) {
            SeminaryValue = 1;
            SeminaryTitle = "Seminari";
          } else if (isSeminary == 0) {
            SeminaryValue = 0;
            SeminaryTitle = "Kawaida";
          }
          if (isForDisabled == 1) {
            DisabledValue = 1;
            SeminaryTitle = "Maalum";
          } else if (isForDisabled == 0) {
            DisabledValue = 0;
            DisabledTitle = "Jumuishi";
          }
        }
        db.query(
          "select * from maoni WHERE trackingNo = ?",
          [trackingNumber],
          function (error, resultsMaoni) {
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
            sharedModel.myMaoni(trackingNumber, (objMaoni) => {
              sharedModel.getAttachmentTypes(
                registry_type_id,
                application_category_id,
                null,
                (attachment_types) => {
                  objAttachment = attachment_types;
                }
              );
              sharedModel.getAttachments(trackingNumber, (objAttachment1) => {
                // objAttachment1 = attachments;
                sharedModel.myStaffs(user, (objStaffs) => {
                  db.query(
                    `SELECT * 
          FROM personal_infos
          LEFT JOIN applications ON applications.foreign_token = personal_infos.secure_token
          LEFT JOIN wards ON wards.WardCode = personal_infos.ward_id
          LEFT JOIN districts ON wards.LgaCode = districts.LgaCode 
          LEFT JOIN regions ON districts.RegionCode = regions.RegionCode
          WHERE applications.tracking_number = ?`,
                    [trackingNumber],
                    function (error1, results1) {
                      if (error1) {
                        console.log(error1);
                      } else {
                        if (results1.length > 0) {
                          var first_name = results1[0].first_name;
                          var middle_name = results1[0].middle_name;
                          var last_name = results1[0].last_name;
                          var occupation = results1[0].occupation;
                          var personal_address = results1[0].personal_address;
                          var personal_phone_number =
                            results1[0].personal_phone_number;
                          var personal_email = results1[0].personal_email;
                          var WardNameMtu = results1[0].WardName;
                          var LgaNameMtu = results1[0].LgaName;
                          var RegionNameMtu = results1[0].RegionName;
                          var fullname =
                            first_name + " " + middle_name + " " + last_name;
                        } else {
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
                          tracking_number: tracking_number,
                          school_name: school_name,
                          schoolOpeningDate: schoolOpeningDate,
                          LgaName: LgaName,
                          RegionName: RegionName,
                          user_id: user_id,
                          school_phone: school_phone,
                          owner_name: owner_name,
                          registry_type_id: registry_type_id,
                          registry: registry,
                          school_address: school_address,
                          Stream: Stream,
                          created_at: created_at,
                          remain_days: remain_days,
                          po_box: po_box,
                          school_email: school_email,
                          gender_type: gender_type,
                          fullname: "",
                          schoolCategory: schoolCategory,
                          Certificate: certificate,
                          numberOfTeachers: numberOfTeachers,
                          occupation: "",
                          Website: website,
                          sharti: sharti,
                          application_category_id: application_category_id,
                          teacherInformation: teacherInformation,
                          specialization: specialization,
                          lessons_and_courses: lessons_and_courses,
                          TeacherRatioStudent: TeacherRatioStudent,
                          schoolCategoryID: schoolCategoryID,
                          is_approved,
                          mwombajiAddress: "",
                          mwombajiPhoneNo: "",
                          SeminaryTitle: SeminaryTitle,
                          DisabledTitle: DisabledTitle,
                          building: building,
                          baruaPepe: "",
                          language: language,
                          school_size: school_size,
                          SeminaryValue: SeminaryValue,
                          managerName: manager_first_name,
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
                    }
                  );
                });
              });
            });
          }
        );
    });
  }
);

module.exports = sajiliSerikaliRequestRouter;
