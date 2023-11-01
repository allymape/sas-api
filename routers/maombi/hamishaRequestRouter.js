require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const hamishaRequestRouter = express.Router();
const dateandtime = require("date-and-time");
var session = require("express-session"); 
const { isAuth, formatDate, permission, selectConditionByTitle, calculcateRemainDays } = require("../../utils");
const sharedModel = require("../../models/sharedModel");

hamishaRequestRouter.post(
  "/maombi-hamisha-shule",
  isAuth,
  permission("view-change-school-location"),
  (req, res) => {
   
        var obj = [];
        var obj1 = [];
        var obj2 = [];
        // var districtId = req.body.districtCode;
        const user = req.user;  
       sharedModel.maombiSummaryByCategoryAndStatus(user, 10 ,function (summaries) {
          db.query(
            "select school_categories.category as schoolCategory, applications.tracking_number as tracking_number, " +
              " applications.created_at as created_at, applications.user_id as user_id, " +
              " applications.foreign_token as foreign_token, " +
              " establishing_schools.school_name as school_name, regions.RegionName as RegionName, " +
              " districts.LgaName as LgaName FROM former_school_infos, establishing_schools, applications, " +
              " wards, districts, school_categories, regions WHERE school_categories.id = establishing_schools.school_category_id " +
              " AND regions.RegionCode = districts.RegionCode AND districts.LgaCode = wards.LgaCode AND " +
              " former_school_infos.establishing_school_id = establishing_schools.id AND " +
              " wards.WardCode = establishing_schools.ward_id AND former_school_infos.tracking_number = applications.tracking_number " +
              " AND application_category_id = 10 AND is_approved <> 2 AND payment_status_id = 2  "+selectConditionByTitle(user),
            function (error, results) {
              if (error) {
                console.log(error);
              }
              for (var i = 0; i < results.length; i++) {
                
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
                var remain_days = calculcateRemainDays(created_at);
             ;
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
                dataList: obj,
                dataSummary : summaries,
                message: "List of maombi  kuhamisha shule.",
              });
            }
          );
       
    });
    
  }
);

hamishaRequestRouter.post(
  "/view-hamisha-shule-details",
  isAuth,
  permission("view-change-school-location"),
  (req, res) => {
    var trackingNumber = req.body.TrackingNumber;
    const user = req.user; var userLevel = user.user_level;
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
      `SELECT registration_structures.structure as structure, establishing_schools.id as establishId,  
         school_sub_categories.subcategory as subcategory,former_school_infos.school_name as school_name_new,  
         former_school_infos.stream as streamOld,  
         establishing_schools.stream as streamNew, establishing_schools.area as area,  
         establishing_schools.school_size as school_size, languages.language as language,  
         school_categories.category as schoolCategory, applications.tracking_number as tracking_number,  
         applications.tracking_number as tracking_number, applications.created_at as created_at,  
         applications.registry_type_id as registry_type_id, application_category_id, establishing_schools.ward_id as WardIdOld, applications.user_id as user_id,  
         applications.foreign_token as foreign_token, establishing_schools.school_name as school_name,  
         wards.WardName as WardName, regions.RegionName as RegionName, districts.LgaName as LgaName 
         FROM  former_school_infos 
         LEFT JOIN establishing_schools ON former_school_infos.establishing_school_id = establishing_schools.id 
         LEFT JOIN school_sub_categories ON school_sub_categories.id = establishing_schools.school_sub_category_id 
         LEFT JOIN applications ON former_school_infos.tracking_number = applications.tracking_number  
         LEFT JOIN registration_structures ON establishing_schools.registration_structure_id = registration_structures.id
         LEFT JOIN wards ON wards.WardCode = establishing_schools.ward_id
         LEFT JOIN districts ON districts.LgaCode = wards.LgaCode
         LEFT JOIN school_categories ON school_categories.id = establishing_schools.school_category_id
         LEFT JOIN languages ON languages.id = establishing_schools.language_id
         LEFT JOIN regions  ON regions.RegionCode = districts.RegionCode 
         WHERE application_category_id = 10 AND applications.tracking_number = ?`,
      [trackingNumber],
      function (error, results, fields) {
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
          var WardIdOld = results[0].WardIdOld;
          var streamNew = results[0].streamNew;
          var foreign_token = results[0].foreign_token;
          var school_name_new = results[0].school_name_new;
          var school_name = results[0].school_name;
          var LgaName = results[0].LgaName;
          var RegionName = results[0].RegionName;
          var RegionName = results[0].RegionName;
          var registry = results[0].registry;
          var created_at = results[0].created_at;
          // created_at = dateandtime.format(new Date(created_at), "DD/MM/YYYY");
          var schoolCategory = results[0].schoolCategory;
          var language = results[0].language;
          var school_size = results[0].school_size;
          var area = results[0].area;
          var WardName = results[0].WardName;
          var structure = results[0].structure;
          var subcategory = results[0].subcategory;
          var establishId = results[0].establishId;
        }

        db.query(
          `SELECT  registration_structures.structure as structure, establishing_schools.id as establishId,  
                  school_sub_categories.subcategory as subcategory,former_school_infos.school_name as school_name_new,  
                  former_school_infos.stream as streamOld,  establishing_schools.stream as streamNew, establishing_schools.area as area,  
                  establishing_schools.school_size as school_size, languages.language as language,  school_categories.category as schoolCategory, applications.tracking_number as tracking_number,  
                  applications.tracking_number as tracking_number, applications.created_at as created_at,  applications.registry_type_id as registry_type_id,applications.user_id as user_id,  
                  applications.foreign_token as foreign_token, establishing_schools.school_name as school_name,  wards.WardName as WardName, former_school_infos.ward_id as WardIdNew,  
                  regions.RegionName as RegionName, districts.LgaName as LgaName 
            FROM  former_school_infos
            LEFT JOIN establishing_schools ON former_school_infos.establishing_school_id = establishing_schools.id 
            LEFT JOIN school_sub_categories ON school_sub_categories.id = establishing_schools.school_sub_category_id 
            LEFT JOIN applications ON former_school_infos.tracking_number = applications.tracking_number  
            LEFT JOIN registration_structures ON establishing_schools.registration_structure_id = registration_structures.id
            LEFT JOIN wards ON wards.WardCode = establishing_schools.ward_id
            LEFT JOIN districts ON districts.LgaCode = wards.LgaCode
            LEFT JOIN school_categories ON school_categories.id = establishing_schools.school_category_id
            LEFT JOIN languages ON languages.id = establishing_schools.language_id
            LEFT JOIN regions  ON regions.RegionCode = districts.RegionCode 
            WHERE application_category_id = 10 AND applications.tracking_number = ?`,
          [trackingNumber],
          function (error, results11, fields) {
            if (error) {
              console.log(error);
            }
            // console.log(results)
            if (results11.length > 0) {
              var WardNameNew = results11[0].WardName;
              var LgaNameNew = results11[0].LgaName;
              var RegionNameNew = results11[0].RegionName;
              var WardIdNew = results11[0].WardIdNew;
            }
            var remain_days = calculcateRemainDays(created_at);
            console.log("", created_at, trackingNumber);

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

            sharedModel.myStaffs(req.user, (staffs) => {
              objStaffs = staffs;

              sharedModel.myMaoni(trackingNumber, (maoni) => {
                objMaoni = maoni;
                sharedModel.getAttachmentTypes(
                  registry_type_id,
                  application_category_id,
                  "",
                  (attachement_types) => {
                    objAttachment = attachement_types;
                  }
                );
                sharedModel.getAttachments(trackingNumber, (attachments) => {
                  objAttachment1 = attachments;

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

                  obj.push({
                    tracking_number: tracking_number,
                    school_name: school_name,
                    LgaName: LgaName,
                    RegionName: RegionName,
                    user_id: user_id,
                    school_name_new: school_name_new,
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
                    WardIdNew: WardIdNew,
                    WardIdOld: WardIdOld,
                    mwombajiAddress: personal_address,
                    mwombajiPhoneNo: personal_phone_number,
                    WardNameNew: WardNameNew,
                    baruaPepe: personal_email,
                    language: language,
                    school_size: school_size,
                    LgaNameNew: LgaNameNew,
                    area: area,
                    WardName: WardName,
                    structure: structure,
                    RegionNameNew: RegionNameNew,
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
                    objAttachment2: objAttachment2,
                    message: "Taarifa za ombi kuanzisha shule.",
                  });
                });
              });
            });
          }
        );
      }
    );
  }
);


hamishaRequestRouter.post(
  "/tuma-badili-hamisha",
  isAuth,
  (req, res) => {
  const tracking_number = req.body.trackerId;
      sharedModel.findOneApplication(tracking_number, (app) => {
            const app_category = app["application_category_id"];
              if (app_category) {
                      sharedModel.tumaMaoni(req, app_category, (success) => {
                      if (req.body.haliombi == 2) {
                        db.query(
                          "UPDATE establishing_schools SET ward_id = ? WHERE id = ?",
                          [req.body.newstream, req.body.establishId],
                          function (error, results, fields) {
                            if (error) {
                              console.log(error);
                            }
                            if (req.body.ombitype == 1 && req.body.haliombi == 0) {
                              console.log("yes we can do it");
                            }
                            db.query(
                              "UPDATE former_school_infos SET ward_id = ? WHERE tracking_number = ?",
                              [req.body.oldstream, req.body.trackerId],
                              function (error, results, fields) {
                                if (error) {
                                  console.log(error);
                                }
                                if (req.body.ombitype == 1 && req.body.haliombi == 0) {
                                  console.log("yes we can do it");
                                }
                              }
                            );
                          }
                        );
                      }
                      return res.send({
                        error: success ? false : true,
                        statusCode: success ? 300 : 306,
                        data: success ? "success" : "fail",
                        message: success
                          ? "Majibu Successfully Recorded."
                          : "Kuna tatizo",
                      });
                    }
                  );
              }
      }
    );
  }
);


module.exports = hamishaRequestRouter;
