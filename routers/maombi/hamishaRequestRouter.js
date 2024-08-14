require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const hamishaRequestRouter = express.Router();
const { isAuth, permission, selectConditionByTitle, calculcateRemainDays, approvalStatuses } = require("../../utils");
const sharedModel = require("../../models/sharedModel");

hamishaRequestRouter.post(
  "/maombi-hamisha-shule",
  isAuth,
  permission("view-change-school-location"),
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
        // console.log(page , per_page , offset)
        const sqlSelect = `select school_categories.category as schoolCategory, applications.tracking_number as tracking_number, 
              applications.created_at as created_at, applications.user_id as user_id, 
              applications.foreign_token as foreign_token, folio, is_approved,
              establishing_schools.school_name as school_name, regions.RegionName as RegionName, 
              districts.LgaName as LgaName`;

        const sqlFrom = `FROM former_school_infos
              JOIN applications ON former_school_infos.tracking_number = applications.tracking_number 
              JOIN establishing_schools ON former_school_infos.establishing_school_id = establishing_schools.id
              LEFT JOIN wards ON wards.WardCode = establishing_schools.ward_id
              JOIN districts ON districts.LgaCode = wards.LgaCode 
              JOIN school_categories ON school_categories.id = establishing_schools.school_category_id
              JOIN regions ON regions.RegionCode = districts.RegionCode 
              WHERE application_category_id = 10  AND payment_status_id = 2 
                ${
                  ["pending", ""].includes(status) ||
                  user.ngazi.toLowerCase() != "wizara"
                    ? selectConditionByTitle(user, false, false, status)
                    : ""
                } ${sqlStatus} ORDER BY applications.created_at DESC`;
        const sqlCount = `SELECT COUNT(*) AS num_rows ${sqlFrom}`;
        const sqlRows = `${sqlSelect} ${sqlFrom} LIMIT ?,?`;
      
       sharedModel.maombiSummaryByCategoryAndStatus(user, 10 , null,(summaries)  => {
          sharedModel.paginate(sqlRows , sqlCount,
            function (error, results , numRows) {
              if (error) {
                console.log(error);
              }
              for (var i = 0; i < results.length; i++) {
                var tracking_number = results[i].tracking_number;
                var folio = results[i].folio;
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
                var is_approved = results[i].is_approved;
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
                  schoolCategory: schoolCategory,
                  folio,
                  is_approved
                });
              }
              // console.log(obj)
              return res.send({
                error: false,
                statusCode: 300,
                dataList: obj,
                dataSummary: summaries,
                numRows : numRows,
                message: "List of maombi  kuhamisha shule.",
              });
            },
            [offset , per_page]
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
    const user = req.user; 
    var userLevel = user.user_level;
    const status = approvalStatuses(req.body.status);
    const sqlStatus = ` AND is_approved IN ${status ? status : "(0,1)"}`;
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
         former_school_infos.stream as streamOld, is_approved,
         establishing_schools.stream as streamNew, establishing_schools.area as area,  
         establishing_schools.school_size as school_size, languages.language as language,  
         school_categories.category as schoolCategory, applications.tracking_number as tracking_number,  
         applications.tracking_number as tracking_number, applications.created_at as created_at,  
         applications.registry_type_id as registry_type_id, application_category_id, establishing_schools.ward_id as WardIdOld, applications.user_id as user_id,  
         applications.foreign_token as foreign_token, establishing_schools.school_name as school_name,  
         streets.StreetName AS StreetName,
         wards.WardName as WardName, 
         regions.RegionName as RegionName, 
         districts.LgaName as LgaName,
         s.StreetName AS StreetNameNew,
         w.WardName as WardNameNew, 
         r.RegionName as RegionNameNew, 
         d.LgaName as LgaNameNew 
         FROM  former_school_infos 
         LEFT JOIN establishing_schools ON former_school_infos.establishing_school_id = establishing_schools.id 
         LEFT JOIN school_sub_categories ON school_sub_categories.id = establishing_schools.school_sub_category_id 
         LEFT JOIN applications ON former_school_infos.tracking_number = applications.tracking_number  
         LEFT JOIN registration_structures ON establishing_schools.registration_structure_id = registration_structures.id
         LEFT JOIN streets ON streets.StreetCode = establishing_schools.village_id
         LEFT JOIN wards ON wards.WardCode = establishing_schools.ward_id
         LEFT JOIN districts ON districts.LgaCode = wards.LgaCode
         LEFT JOIN regions  ON regions.RegionCode = districts.RegionCode 

         LEFT JOIN streets s ON s.StreetCode = former_school_infos.village_id
         LEFT JOIN wards w ON w.WardCode = former_school_infos.ward_id
         LEFT JOIN districts d ON d.LgaCode = w.LgaCode
         LEFT JOIN regions r  ON r.RegionCode = d.RegionCode 

         LEFT JOIN school_categories ON school_categories.id = establishing_schools.school_category_id
         LEFT JOIN languages ON languages.id = establishing_schools.language_id
         WHERE application_category_id = 10 AND applications.tracking_number = ? `,
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
          var WardIdOld = results[0].WardIdOld;
          var streamNew = results[0].streamNew;
          var is_approved = results[0].is_approved;
          var school_name_new = results[0].school_name_new;
          var school_name = results[0].school_name;
          var registry = results[0].registry;
          var created_at = results[0].created_at;
          // created_at = dateandtime.format(new Date(created_at), "DD/MM/YYYY");
          var schoolCategory = results[0].schoolCategory;
          var language = results[0].language;
          var school_size = results[0].school_size;
          var area = results[0].area;
          
          var structure = results[0].structure;
          var subcategory = results[0].subcategory;
          var establishId = results[0].establishId;
          var WardIdNew = results[0].WardIdNew;

          var StreetName = results[0].StreetName;
          var WardName = results[0].WardName;
          var LgaName = results[0].LgaName;
          var RegionName = results[0].RegionName;

          var StreetNameNew = results[0].StreetNameNew;
          var WardNameNew = results[0].WardNameNew;
          var LgaNameNew = results[0].LgaNameNew;
          var RegionNameNew = results[0].RegionNameNew;
        
        }
        var remain_days = calculcateRemainDays(created_at);
        // console.log("", created_at, trackingNumber);

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
              var fullname = first_name + " " + middle_name + " " + last_name;

              obj.push({
                tracking_number: tracking_number,
                is_approved,
                school_name: school_name,
                StreetNameNew : StreetNameNew,
                WardNameNew: WardNameNew,
                LgaNameNew: LgaNameNew,
                RegionNameNew: RegionNameNew,
                StreetName : StreetName,
                WardName: WardName,
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
                baruaPepe: personal_email,
                language: language,
                school_size: school_size,
                area: area,
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


hamishaRequestRouter.post(
  "/tuma-badili-hamisha",
  isAuth,
  (req, res) => {
  const tracking_number = req.body.trackerId;
      sharedModel.findOneApplication(tracking_number, (app) => {
            const app_category = app["application_category_id"];
              if (app_category) {
                 sharedModel.getFormerSchoolInfos(tracking_number , (found , school) => {
                if(found){
                  sharedModel.tumaMaoni(req, app_category, (success) => {
                    const {former_id , school_id , old_ward_id , old_village_id , new_ward_id , new_village_id} = school;
                    sharedModel.changeSchoolInfos(
                      req,
                      ` ward_id = ? , village_id = ?`,
                      [new_ward_id, new_village_id, school_id],
                      `ward_id = ? , village_id = ?`,
                      [old_ward_id , old_village_id , former_id],
                      (updated) => {
                        if (updated) console.log("school infos updated");
                      }
                    );
                    return res.send({
                      error: success ? false : true,
                      statusCode: success ? 300 : 306,
                      data: success ? "success" : "fail",
                      message: success
                        ? `Umethibitisha kuhamisha Shule.`
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
      }
    );
  }
);


module.exports = hamishaRequestRouter;
