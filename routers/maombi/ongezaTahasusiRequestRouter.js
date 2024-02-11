require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const ongezaTahasusiRequestRouter = express.Router();
const dateandtime = require("date-and-time");
var session = require("express-session");
const { isAuth, formatDate, permission, selectConditionByTitle, approvalStatuses, calculcateRemainDays } = require("../../utils");
const sharedModel = require("../../models/sharedModel");

ongezaTahasusiRequestRouter.post(
    "/maombi-badili-tahasusi", 
    isAuth,
    permission('view-school-owners-and-managers'), 
    (req, res) => {
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
    const sqlSelect = `SELECT school_categories.category as schoolCategory, applications.tracking_number as tracking_number, 
          applications.created_at as created_at, applications.user_id as user_id, 
          applications.foreign_token as foreign_token, folio,is_approved, 
          establishing_schools.school_name as school_name, regions.RegionName as RegionName, 
          districts.LgaName as LgaName 
        `;

    const sqlFrom = `FROM former_school_combinations, establishing_schools, applications, 
                      wards, districts, school_categories, regions WHERE school_categories.id = establishing_schools.school_category_id
                      AND regions.RegionCode = districts.RegionCode AND districts.LgaCode = wards.LgaCode AND 
                      former_school_combinations.establishing_school_id = establishing_schools.id AND
                      wards.WardCode = establishing_schools.ward_id AND former_school_combinations.tracking_number = applications.tracking_number
                      AND application_category_id = 12 AND payment_status_id = 2 
                      ${
                        ["pending", ""].includes(status) ||
                        user.ngazi.toLowerCase() != "wizara"
                          ? selectConditionByTitle(user, false, false, status)
                          : ""
                      } ${sqlStatus}
                      ORDER BY applications.created_at DESC`;
    const sqlCount = `SELECT COUNT(*) AS num_rows ${sqlFrom}`;
    const sqlRows = `${sqlSelect} ${sqlFrom} LIMIT ?,?`;
    sharedModel.maombiSummaryByCategoryAndStatus(user, 12 , null , (summaries)  => {
      sharedModel.paginate(sqlRows , sqlCount,
        function (error, results , numRows) {
          if (error) {
            console.log(error);
          }

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
            var created_at = results[i].created_at;
            var schoolCategory = results[i].schoolCategory;
            var folio = results[i].folio;
            var is_approved = results[i].is_approved;
            var remain_days = calculcateRemainDays(created_at)
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
              folio,
              is_approved
            });
          }
          // console.log(obj)
          return res.send({
            error: false,
            statusCode: 300,
            dataSummary: summaries,
            dataList: obj,
            numRows : numRows,
            message: "List of maombi kuanzisha shule.",
          });
        },
        [offset , per_page]
      );
    });
});

ongezaTahasusiRequestRouter.post(
    "/view-ongeza-tahasusi-details",
    isAuth,
    permission('view-school-owners-and-managers'), 
    (req, res) => {
      var trackingNumber = req.body.TrackingNumber;
      const user = req.user;
      var userLevel = user.user_level;
      var office = req.body.office;
  
      var obj = [];
      var objMess = [];
      var objStaffs = [];
      var objApps = [];
      var objAttachment = [];
      var objMaoni = [];
      var objAttachment1 = [];
      var objAttachment2 = [];
      db.query(
        `SELECT  	school_registrations.id as school_id, registration_structures.structure as structure,  
                  establishing_schools.id as establishId,  is_approved,
                  school_sub_categories.subcategory as subcategory, combination as streamOld,  
                  former_school_combinations.combination_id as streamNew, establishing_schools.area as area,  
                  establishing_schools.school_size as school_size, languages.language as language,  
                  school_categories.category as schoolCategory, applications.tracking_number as tracking_number,  
                  applications.tracking_number as tracking_number, applications.created_at as created_at,  
                  applications.registry_type_id as registry_type_id,application_category_id,applications.user_id as user_id,  
                  applications.foreign_token as foreign_token, establishing_schools.school_name as school_name,  
                  wards.WardName as WardName, regions.RegionName as RegionName, districts.LgaName as LgaName  
      FROM school_registrations
       LEFT JOIN establishing_schools ON establishing_schools.id = school_registrations.establishing_school_id
       LEFT JOIN former_school_combinations  ON former_school_combinations.establishing_school_id = establishing_schools.id   
		   LEFT JOIN combinations ON combinations.id = former_school_combinations.combination_id
		   LEFT JOIN school_sub_categories ON school_sub_categories.id = establishing_schools.school_sub_category_id 
		   LEFT JOIN applications ON former_school_combinations.tracking_number = applications.tracking_number 
		   LEFT JOIN registration_structures ON  registration_structures.id = establishing_schools.registration_structure_id
		   LEFT JOIN wards ON wards.WardCode = establishing_schools.ward_id 
       LEFT JOIN districts ON districts.LgaCode = wards.LgaCode
		   LEFT JOIN school_categories ON school_categories.id = establishing_schools.school_category_id 
		   LEFT JOIN languages ON languages.id = establishing_schools.language_id 
		   LEFT JOIN regions  ON regions.RegionCode = districts.RegionCode
       WHERE application_category_id = 12 AND applications.tracking_number = ?`,
        [trackingNumber],
        function (error, results) {
          if (error) {
            console.log(error);
          }
          // console.log(results)
          if (results.length > 0) {
            var tracking_number = results[0].tracking_number;
            var registry_type_id = results[0].registry_type_id;
            var application_category_id = results[0].application_category_id;
            var user_id = results[0].user_id;
            var streamOld = results[0].streamOld;
            var streamNew = results[0].streamNew;
            var school_id = results[0].school_id;
            var is_approved = results[0].is_approved;
            var school_name = results[0].school_name;
            var LgaName = results[0].LgaName;
            var RegionName = results[0].RegionName;
            var RegionName = results[0].RegionName;
            var registry = results[0].registry;
            var created_at = results[0].created_at;
            var schoolCategory = results[0].schoolCategory;
            var language = results[0].language;
            var school_size = results[0].school_size;
            var area = results[0].area;
            var WardName = results[0].WardName;
            var structure = results[0].structure;
            var subcategory = results[0].subcategory;
            var establishId = results[0].establishId;
          }
          var remain_days = calculcateRemainDays(created_at)
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
                  objMess.push({
                    count: resultsMaoni.length,
                    coments: coments,
                  });
                }
              }
            }
          );
          sharedModel.myStaffs(user, (staffs) => {
            objStaffs = staffs;
            sharedModel.myMaoni(trackingNumber, (maoni) => {
              objMaoni = maoni;
              sharedModel.getAttachmentTypes(
                registry_type_id,
                application_category_id,
                "",
                (attachment_types) => {
                  objAttachment = attachment_types;
                }
              );
              sharedModel.getAttachments(trackingNumber, (attachments) => {
                objAttachment1 = attachments;
                var remain_days;
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
                var fullname = first_name + " " + middle_name + " " + last_name;
                obj.push({
                  tracking_number: tracking_number,
                  school_name: school_name,
                  LgaName: LgaName,
                  RegionName: RegionName,
                  user_id: user_id,
                  registry_type_id: registry_type_id,
                  registry: registry,
                  establishId: establishId,
                  created_at: created_at,
                  remain_days: remain_days,
                  streamOld: streamOld,
                  streamNew: streamNew,
                  fullname: fullname,
                  schoolCategory: schoolCategory,
                  occupation: occupation,
                  mwombajiAddress: personal_address,
                  mwombajiPhoneNo: personal_phone_number,
                  baruaPepe: personal_email,
                  language: language,
                  school_size: school_size,
                  area: area,
                  WardName: WardName,
                  structure: structure,
                  school_id: school_id,
                  subcategory: subcategory,
                  WardNameMtu: WardNameMtu,
                  LgaNameMtu: LgaNameMtu,
                  RegionNameMtu: RegionNameMtu,
                  is_approved
                });
                objAttachment2.push({
                  file_format: "",
                  attachment_name: "",
                  registry_id: "",
                  file_size: "",
                  registry: "",
                  application_name: "",
                  created_at: "",
                  attachment_path: "",
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
              });
            });
          });
        }
      );
});

ongezaTahasusiRequestRouter.post("/tuma-ongeza-tahasusi", isAuth, (req, res) => {
  const tracking_number = req.body.trackerId;
  sharedModel.findOneApplication(tracking_number, (app) => {
    const app_category = app["application_category_id"];
    if (app_category) {
       sharedModel.getSchoolCombinations(tracking_number , (found , schoolCombinations) => {
                if(found){
                  sharedModel.tumaMaoni(req, app_category, (success) => {
                    const new_combinations = [];
                    const old_combinations = [];
                    schoolCombinations.forEach((comb) =>
                      new_combinations.push([
                        comb.combination_id,
                        comb.school_registration_id,
                      ])
                    );
                    // console.log(new_combinations);
                    sharedModel.changeSchoolCombinations(req , new_combinations, old_combinations, 
                    (updated) => {
                        if(updated) console.log('school combinations updated')
                    })
                    return res.send({
                      error: success ? false : true,
                      statusCode: success ? 300 : 306,
                      data: success ? "success" : "fail",
                      message: success
                        ? `Umethibitisha kubadili tahasusi .`
                        : "Kuna tatizo",
                    });
                  });
                }else{
                  return res.send({
                      error: false,
                      statusCode: 306,
                      data: "fail",
                      message: "Kuna tatizo error 404",
                    });
                }
              })
    }
  });
});


module.exports = ongezaTahasusiRequestRouter;
