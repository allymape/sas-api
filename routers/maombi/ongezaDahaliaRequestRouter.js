require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const ongezaDahaliaRequestRouter = express.Router();
const dateandtime = require("date-and-time");
var session = require("express-session"); 
const { isAuth, formatDate, permission, selectConditionByTitle, approvalStatuses } = require("../../utils");
const sharedModel = require("../../models/sharedModel");

ongezaDahaliaRequestRouter.post(
  "/maombi-ongeza-dahalia",
  isAuth,
  permission("view-change-of-hostel"),
  (req, res) => {
    var obj = [];
    const user = req.user;
    const status = req.body.status ? req.body.status : "";
    const approvedStatus = approvalStatuses(req.body.status);
    const sqlStatus = ` AND is_approved IN ${
      approvedStatus ? approvedStatus : "(0,1)"
    }`;
    const per_page = parseInt(req.body.per_page);
    const page = parseInt(req.body.page);
    const offset = (page - 1) * per_page;
    const sqlSelect = `SELECT  school_categories.category as schoolCategory, applications.tracking_number as tracking_number, 
                        applications.created_at as created_at, applications.user_id as user_id, 
                        applications.foreign_token as foreign_token, folio,
                        establishing_schools.school_name as school_name, regions.RegionName as RegionName, 
                        districts.LgaName as LgaName`;

    const sqlFrom = `FROM former_school_infos, establishing_schools, applications,
                    wards, districts, school_categories, regions 
                    WHERE school_categories.id = establishing_schools.school_category_id
                    AND regions.RegionCode = districts.RegionCode AND districts.LgaCode = wards.LgaCode AND
                    former_school_infos.establishing_school_id = establishing_schools.id AND 
                    wards.WardCode = establishing_schools.ward_id AND former_school_infos.tracking_number = applications.tracking_number 
                    AND application_category_id = 13 AND payment_status_id = 2
                    ${
                      ["pending", ""].includes(status) || user.ngazi.toLowerCase() != "wizara"
                        ? selectConditionByTitle(user)
                        : ""
                    } ${sqlStatus}`;

    const sqlCount = `SELECT COUNT(*) AS num_rows ${sqlFrom}`;
    const sqlRows = `${sqlSelect} ${sqlFrom} LIMIT ?,?`;
    sharedModel.maombiSummaryByCategoryAndStatus(user , 13 , null , (summaries)  => {
        sharedModel.paginate(sqlRows, sqlCount,
          function (error, results ,  numRows) {
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
                folio
              });
            }
            // console.log(obj)
            return res.send({
              error: false,
              statusCode: 300,
              dataList: obj,
              dataSummary: summaries,
              numRows : numRows,
              message: "List of maombi kuanzisha shule.",
            });
          },
          [offset , per_page]
        );
      }
    );
  }
);

ongezaDahaliaRequestRouter.post(
  "/view-badili-dahalia",
  isAuth,
  permission("view-change-of-combinations"),
  (req, res) => {
    var trackingNumber = req.body.TrackingNumber;
    const user = req.user;
    var userLevel = user.user_level;
    var office = req.body.office;
    // console.log("=====-==--++")
    var obj = [];
    var objMess = [];
    var objStaffs = [];
    var objApps = [];
    var objAttachment = [];
    var objMaoni = [];
    var objAttachment1 = [];
    var objAttachment2 = [];
  
    db.query(
      `SELECT registration_structures.structure as structure, establishing_schools.id as establishId,  
         school_sub_categories.subcategory as subcategory, former_school_infos.stream as streamOld,  
         establishing_schools.stream as streamNew, establishing_schools.area as area,  
         establishing_schools.school_size as school_size, languages.language as language,  
         school_categories.category as schoolCategory, applications.tracking_number as tracking_number,  
         applications.tracking_number as tracking_number, applications.created_at as created_at,  
         applications.registry_type_id as registry_type_id,applications.user_id as user_id,  
         applications.foreign_token as foreign_token, establishing_schools.school_name as school_name,  
         wards.WardName as WardName, regions.RegionName as RegionName, districts.LgaName as LgaName  
        FROM former_school_infos
        LEFT JOIN establishing_schools ON former_school_infos.establishing_school_id = establishing_schools.id 
        LEFT JOIN school_sub_categories ON school_sub_categories.id = establishing_schools.school_sub_category_id 
        LEFT JOIN applications ON former_school_infos.tracking_number = applications.tracking_number  
        LEFT JOIN registration_structures ON establishing_schools.registration_structure_id = registration_structures.id
        LEFT JOIN wards ON wards.WardCode = establishing_schools.ward_id
        LEFT JOIN districts ON districts.LgaCode = wards.LgaCode
        LEFT JOIN school_categories ON school_categories.id = establishing_schools.school_category_id
        LEFT JOIN languages ON languages.id = establishing_schools.language_id
        LEFT JOIN regions  ON regions.RegionCode = districts.RegionCode 
      WHERE application_category_id = 13 AND applications.tracking_number = ?`,
      [trackingNumber],
      function (error, results) {
        if (error) {
          console.log(error);
        }
        // console.log(results);
        if (results.length > 0) {
          var tracking_number = results[0].tracking_number;
          var registry_type_id = results[0].registry_type_id;
          var user_id = results[0].user_id;
          var streamOld = results[0].streamOld;
          var streamNew = results[0].streamNew;
          var foreign_token = results[0].foreign_token;
          var school_name = results[0].school_name;
          var LgaName = results[0].LgaName;
          var RegionName = results[0].RegionName;
          var RegionName = results[0].RegionName;
          var registry = results[0].registry;
          var created_at = results[0].created_at;
          created_at = dateandtime.format(new Date(created_at), "DD/MM/YYYY");
          var schoolCategory = results[0].schoolCategory;
          var language = results[0].language;
          var school_size = results[0].school_size;
          var area = results[0].area;
          var WardName = results[0].WardName;
          var structure = results[0].structure;
          var subcategory = results[0].subcategory;
          var establishId = results[0].establishId;
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
                objMess.push({ count: resultsMaoni.length, coments: coments });
              }
            }
          }
        );

        sharedModel.myStaffs(user, function (staffs) {
          objStaffs = staffs;

          sharedModel.myMaoni(trackingNumber, function (maoni) {
            objMaoni = maoni;
          });

          sharedModel.getAttachmentTypes(
            registry_type_id,
            13,
            "",
            function (attachment_types) {
              objAttachment = attachment_types;
            }
          );

          sharedModel.getAttachments(trackingNumber, function (attachments) {
            objAttachment1 = attachments;
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
              subcategory: subcategory,
              WardNameMtu: WardNameMtu,
              LgaNameMtu: LgaNameMtu,
              RegionNameMtu: RegionNameMtu,
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
      }
    );
  }
);

module.exports = ongezaDahaliaRequestRouter;
