require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const badiliBweniRequestRouter = express.Router();
const dateandtime = require("date-and-time");
const { isAuth, formatDate, permission, selectConditionByTitle, approvalStatuses, calculcateRemainDays } = require("../../utils");
const sharedModel = require("../../models/sharedModel");

badiliBweniRequestRouter.post(
  "/maombi-badili-bweni",
  isAuth,
  permission("view-addition-of-domitory"),
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
    const sqlSelect = `SELECT school_categories.category as schoolCategory, folio, applications.tracking_number as tracking_number, 
        applications.created_at as created_at, applications.user_id as user_id, 
        applications.foreign_token as foreign_token, is_approved,
        establishing_schools.school_name AS school_name, regions.RegionName AS RegionName, 
        districts.LgaName as LgaName`;

    const sqlFrom = `FROM former_school_infos, establishing_schools, applications, 
        wards, districts, school_categories, regions WHERE school_categories.id = establishing_schools.school_category_id
        AND regions.RegionCode = districts.RegionCode AND districts.LgaCode = wards.LgaCode AND 
        former_school_infos.establishing_school_id = establishing_schools.id AND
        wards.WardCode = establishing_schools.ward_id AND former_school_infos.tracking_number = applications.tracking_number 
        AND application_category_id = 14 AND payment_status_id = 2
        ${
          ["pending", ""].includes(status) ||
          user.ngazi.toLowerCase() != "wizara"
            ? selectConditionByTitle(user, false, false, status)
            : ""
        } ${sqlStatus}
        ORDER BY applications.created_at DESC
        `;

    const sqlCount = `SELECT COUNT(*) AS num_rows ${sqlFrom}`;
    const sqlRows = `${sqlSelect} ${sqlFrom} LIMIT ?,?`;
       sharedModel.maombiSummaryByCategoryAndStatus(user, 14  , null, (summaries)  => {
        sharedModel.paginate(sqlRows , sqlCount, 
          function (error, results , numRows) {
            if (error) {
              console.log(error);
            }
            // console.log(results);
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
      }
    );
  }
);

badiliBweniRequestRouter.post(
  "/view-bweni-details",
  isAuth,
  permission("view-addition-of-domitory"),
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
      `SELECT  establishing_schools.id as establishId,  
              essc.subcategory as Newsubcategory,  
              former_school_infos.school_sub_category_id as NewSubCatId, 
              establishing_schools.school_sub_category_id as OldSubCatId,  
              fssc.subcategory as subcategory, is_approved,
              former_school_infos.stream as streamOld, establishing_schools.stream as streamNew,  
              establishing_schools.area as area, establishing_schools.school_size as school_size,  
              languages.language as language, school_categories.category as schoolCategory,  
              applications.tracking_number as tracking_number, applications.tracking_number as tracking_number,  
              applications.created_at as created_at, applications.registry_type_id as registry_type_id, application_category_id,  
              applications.user_id as user_id,  applications.foreign_token as foreign_token,  
              establishing_schools.school_name as school_name, wards.WardName as WardName,  
              regions.RegionName as RegionName, districts.LgaName as LgaName  
      FROM former_school_infos
      LEFT JOIN establishing_schools ON former_school_infos.establishing_school_id = establishing_schools.id 
      LEFT JOIN school_sub_categories essc ON essc.id = establishing_schools.school_sub_category_id 
      LEFT JOIN school_sub_categories fssc ON fssc.id = former_school_infos.school_sub_category_id 
      LEFT JOIN applications ON former_school_infos.tracking_number = applications.tracking_number  
      LEFT JOIN wards ON wards.WardCode = establishing_schools.ward_id
      LEFT JOIN districts ON districts.LgaCode = wards.LgaCode
      LEFT JOIN school_categories ON school_categories.id = establishing_schools.school_category_id
      LEFT JOIN languages ON languages.id = establishing_schools.language_id
      LEFT JOIN regions  ON regions.RegionCode = districts.RegionCode
			WHERE  application_category_id = 14 AND applications.tracking_number = ?`,
      [trackingNumber],
      function (error, results) {
        if (error) {
          console.log(error);
        }

        if (results.length > 0) {
          var tracking_number = results[0].tracking_number;
          var registry_type_id = results[0].registry_type_id;
          var application_category_id = results[0].application_category_id;
          var user_id = results[0].user_id;
          var streamOld = results[0].OldSubCatId;
          var streamNew = results[0].NewSubCatId;
          var Newsubcategory = results[0].Newsubcategory;
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
          var Oldsubcategory = results[0].subcategory;
          // var Oldsubcategory = results[0].subcategory;
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
                objMess.push({ coments: coments });
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
              obj.push({
                tracking_number: tracking_number,
                school_name: school_name,
                LgaName: LgaName,
                RegionName: RegionName,
                is_approved,
                user_id: user_id,
                registry_type_id: registry_type_id,
                registry: registry,
                created_at: created_at,
                remain_days: remain_days,
                Newsubcategory: Newsubcategory,
                fullname: "",
                occupation: "-",
                mwombajiAddress: "",
                establishId: establishId,
                mwombajiPhoneNo: "",
                baruaPepe: "",
                schoolCategory: schoolCategory,
                language: language,
                school_size: school_size,
                streamOld: streamOld,
                streamNew: streamNew,
                area: area,
                WardName: WardName,
                structure: structure,
                subcategory: Oldsubcategory,
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

badiliBweniRequestRouter.post(
  "/tuma-badili-bweni",
  isAuth,
  (req, res) => {
            const tracking_number = req.body.trackerId;
            sharedModel.findOneApplication(tracking_number, (app) => {
              const app_category = app["application_category_id"];
            if (app_category) {
                 sharedModel.getFormerSchoolInfos(
                   tracking_number,
                   (found, school) => {
                     if (found) {
                       sharedModel.tumaMaoni(req, app_category, (success) => {
                         const { former_id, school_id, old_bweni, new_bweni } =
                           school;
                         sharedModel.changeSchoolInfos(
                                req,
                                `school_sub_category_id = ?`,
                                [new_bweni, school_id],
                                "school_sub_category_id = ?",
                                [old_bweni, former_id],
                                (updated) => {
                                  if (updated) console.log("school bweni updated");
                                }
                         );
                         return res.send({
                           error: success ? false : true,
                           statusCode: success ? 300 : 306,
                           data: success ? "success" : "fail",
                           message: success
                             ? `Ombi la kubadili bweni limethibitishwa.`
                             : "Kuna tatizo",
                         });
                       });
                     } else {
                       return res.send({
                         error: false,
                         statusCode: 306,
                         data: "fail",
                         message: "Kuna tatizo error 404",
                       });
                     }
                   }
                 );
            }
      }
    );
  }
);


module.exports = badiliBweniRequestRouter;
