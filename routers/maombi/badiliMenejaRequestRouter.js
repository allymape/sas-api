require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const badiliMenejaRequestRouter = express.Router();
const dateandtime = require("date-and-time");
var session = require("express-session"); 

const { isAuth, formatDate, permission, selectConditionByTitle, calculcateRemainDays, approvalStatuses } = require("../../utils");
const sharedModel = require("../../models/sharedModel");

badiliMenejaRequestRouter.post(
  "/maombi-badili-meneja-shule",
  isAuth,
  permission("view-change-of-school-manager"),
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
    // console.log(page , per_page , offset)
    const sqlSelect = `SELECT applications.tracking_number as tracking_number, folio, applications.created_at as created_at, 
                      CONCAT(former_managers.manager_first_name , ' ' , former_managers.manager_middle_name , ' ' , former_managers.manager_last_name  ) AS former_manager_name, 
                      CONCAT(managers.manager_first_name , ' ' , managers.manager_middle_name , ' ' , managers.manager_last_name  ) AS new_manager_name, 
                      wards.WardName as WardName, LgaName, former_managers.manager_last_name as authorized_person, 
                      RegionName, establishing_schools.school_name as school_name 
                      `;

    const sqlFrom = `FROM applications  
                      JOIN former_managers ON applications.tracking_number = former_managers.tracking_number
                      JOIN establishing_schools ON establishing_schools.id = former_managers.establishing_school_id 
                      JOIN managers ON managers.establishing_school_id = establishing_schools.id
                      JOIN wards ON establishing_schools.ward_id = wards.WardCode
                      JOIN districts ON districts.LgaCode = wards.LgaCode
                      JOIN regions ON regions.RegionCode = districts.RegionCode 
                      WHERE  application_category_id = 8  AND  payment_status_id = 2
                      ${
                        ["pending", ""].includes(status) ||
                        user.ngazi.toLowerCase() != "wizara"
                          ? selectConditionByTitle(user)
                          : ""
                      } ${sqlStatus}`;

    const sqlCount = `SELECT COUNT(*) AS num_rows ${sqlFrom}`;
    const sqlRows = `${sqlSelect} ${sqlFrom} LIMIT ?,?`;
    sharedModel.maombiSummaryByCategoryAndStatus(user, 8 , null, (summaries)  => {
      sharedModel.paginate(sqlRows , sqlCount,
        function (error, results , numRows) {
          if (error) {
            console.log(error);
          }
          // //  console.log(results);
          // for (var i = 0; i < results.length; i++) {
          //   //  console.log(results);
          //   var tracking_number = results[i].tracking_number;
          //   var former_manager_name = results[i].former_manager_name;
          //   var new_manager_name = results[i].new_manager_name;
          //   var WardName = results[i].WardName;
          //   var LgaName = results[i].LgaName;
          //   var RegionName = results[i].RegionName;
          //   var registry_type_id = results[i].registry_type_id;
          //   var user_id = results[i].user_id;
          //   var foreign_token = results[i].foreign_token;
          //   var school_name = results[i].school_name;
          //   var registry = results[i].registry;
          //   var authorized_person = results[i].authorized_person;
          //   var created_at = results[i].created_at;
          //   var schoolCategory = results[i].schoolCategory;
          //   var applicantname;
          //   var folio = results[i].folio;
          //   var today = new Date();

          //   var diffInSeconds = Math.abs(today - created_at) / 1000;
          //   var days = Math.floor(diffInSeconds / 60 / 60 / 24);
          //   var hours = Math.floor((diffInSeconds / 60 / 60) % 24);
          //   var minutes = Math.floor((diffInSeconds / 60) % 60);
          //   var seconds = Math.floor(diffInSeconds % 60);
          //   var milliseconds = Math.round(
          //     (diffInSeconds - Math.floor(diffInSeconds)) * 1000
          //   );

          //   var remain_days;
          //   if (days > 0) {
          //     remain_days = "Siku " + days;
          //   } else if (days <= 0 && hours <= 0 && minutes <= 0) {
          //     remain_days = "Sek " + seconds + " zilizopita";
          //   } else if (days <= 0 && hours <= 0) {
          //     remain_days = "Dakika " + minutes + " zilizopita";
          //   } else if (days <= 0) {
          //     remain_days = "Saa " + hours;
          //   }
          //   obj.push({
          //     tracking_number: tracking_number,
          //     school_name: school_name,
          //     new_manager_name: new_manager_name,
          //     former_manager_name: former_manager_name,
          //     authorized_person: authorized_person,
          //     LgaName: LgaName,
          //     RegionName: RegionName,
          //     user_id: user_id,
          //     WardName: WardName,
          //     registry_type_id: registry_type_id,
          //     registry: registry,
          //     created_at: created_at,
          //     remain_days: remain_days,
          //     schoolCategory: schoolCategory,
          //     folio
          //   });
          // }
          // console.log(obj)
          return res.send({
            error: false,
            statusCode: 300,
            dataList: results,
            dataSummary: summaries,
            numRows : numRows,
            message: "List of maombi kubadili meneja.",
          });
        },
        [offset , per_page]
      );
    });
  }
);


badiliMenejaRequestRouter.post(
  "/view-ombi-badili-meneja-details",
  isAuth,
  permission("view-change-of-school-manager"),
  (req, res, ) => {
    var trackingNumber = req.body.TrackingNumber;
    const user = req.user; 
    // console.log(req.body);
    var obj = [];
    var objMess = [];
    var objStaffs = [];
    var objApps = [];
    var objAttachment = [];
    var objAttachment1 = [];
    var objMaoni = [];
    var objRef = [];

    db.query(
      ` SELECT fm.manager_first_name AS manager_first_name, fm.manager_middle_name AS manager_middle_name , fm.manager_last_name AS manager_last_name, 
               fm.manager_phone_number as manager_phone_no , fm.manager_email as manager_email, fm.manager_cv AS manager_cv,
               m.manager_first_name AS old_manager_first_name, m.manager_middle_name AS old_manager_middle_name , m.manager_last_name AS old_manager_last_name,
               m.manager_phone_number as old_manager_phone_no , m.manager_email as old_manager_email, m.manager_cv as old_manager_cv,
              fm.manager_first_name AS manager_first_name, fm.manager_middle_name AS manager_middle_name , fm.manager_last_name AS manager_last_name,
              registry_type_id , application_category_id,  
              e.area as area, fm.establishing_school_id as establishing_school_id,  
              e.tracking_number as old_tracking_number, e.school_size as school_size,  
              applications.tracking_number as tracking_number,  
              applications.created_at as created_at,  
              applications.user_id as user_id, applications.foreign_token as foreign_token,  
              e.school_name as school_name, wards.WardName as WardName, regions.RegionName as RegionName,  
              districts.LgaName as LgaName
       FROM establishing_schools e
       LEFT JOIN former_managers fm ON fm.establishing_school_id = e.id
       LEFT JOIN applications ON  fm.tracking_number = applications.tracking_number
       LEFT JOIN managers  m ON  m.establishing_school_id = e.id
       LEFT JOIN wards ON wards.WardCode = e.ward_id
       LEFT JOIN districts ON districts.LgaCode = wards.LgaCode 
       LEFT JOIN regions ON regions.RegionCode = districts.RegionCode
       WHERE application_category_id = 8   AND applications.tracking_number = ?`,
      [trackingNumber],
      function (error, results) {
        if (error) {
          console.log(error);
        }
        if (results.length > 0) {
          var area = results[0].area;
          var registry_type_id = results[0].registry_type_id;
          var application_category_id = results[0].application_category_id;
          var education_level = "";
          var expertise_level = "";
          var school_size = results[0].school_size;
          var tracking_number = results[0].tracking_number;
          var title = results[0].title;
          var created_at = results[0].created_at;
          var user_id = results[0].user_id;
          var establishing_school_id = results[0].establishing_school_id;
          var manager_phone_no = results[0].manager_phone_no;
          var manager_email = results[0].manager_email;
          var school_name = results[0].school_name;
          var WardName = results[0].WardName;
          var managerRegionName = results[0].RegionName;
          var purpose = "";
          var manager_email = "";
          var manager_street = "";
          var LgaName = results[0].LgaName;
          var manager_first_name = results[0].manager_first_name;
          var manager_middle_name = results[0].manager_middle_name;
          var manager_last_name = results[0].manager_last_name;
          var manager_email = results[0].manager_email;
          var manager_cv = results[0].manager_cv;
          var manager_phone_no = results[0].manager_phone_no;
          var former_manager_first_name = results[0].old_manager_first_name;
          var former_manager_middle_name = results[0].old_manager_middle_name;
          var former_manager_last_name = results[0].old_manager_last_name;
          var former_manager_email = results[0].old_manager_email;
          var former_manager_cv = results[0].old_manager_cv;
          var former_manager_phone_no = results[0].old_manager_phone_no;
          var occupationManager = "";
          var WardName = results[0].WardName;
          var authorized_person = results[0].authorized_person;
          var old_tracking_number = results[0].old_tracking_number;
          var manager_full_name = `${manager_first_name} ${manager_middle_name} ${manager_last_name}`;
          var former_manager_full_name = `${former_manager_first_name} ${former_manager_middle_name} ${former_manager_last_name}`;
          var structure = results[0].structure;
          var subcategory = results[0].subcategory;
        }

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
                var coments = resultsMaoni[i].coments;
                objMess.push({ coments: coments });
              }
            }
          }
        );

        sharedModel.myMaoni(trackingNumber, (maoni) => {
          objMaoni = maoni;
        });
        sharedModel.getAttachmentTypes(
          registry_type_id,
          application_category_id,
          "",
          (attachment_types) => {
            objAttachment = attachment_types;
          }
        );

        db.query(
          "SELECT * from former_owner_referees, former_owners, wards, districts, " +
            " regions WHERE regions.RegionCode = districts.RegionCode AND " +
            " districts.LgaCode = wards.LgaCode AND former_owner_referees.ward_id = wards.WardCode " +
            " AND former_owners.id = former_owner_referees.former_owner_id AND tracking_number = ?",
          [trackingNumber],
          function (error, results, fields) {
            if (error) {
              console.log(error);
            }
            for (var i = 0; i < results.length; i++) {
              var first_name = results[i].first_name;
              var middle_name = results[i].middle_name;
              var last_name = results[i].last_name;
              var occupation = results[i].occupation;
              var address = results[i].address;
              var phone_number = results[i].phone_number;
              var email = results[i].email;
              var WardName = results[i].WardName;
              var LgaName = results[i].LgaName;
              var RegionName = results[i].RegionName;
              var ref_full_name =
                first_name + " " + middle_name + " " + last_name;
              objRef.push({
                ref_full_name: ref_full_name,
                occupation: occupation,
                address: address,
                phone_number: phone_number,
                email: email,
                WardName: WardName,
                LgaName: LgaName,
                RegionName: RegionName,
              });
            }
          }
        );

        sharedModel.getAttachments(trackingNumber, (attachments) => {
          objAttachment1 = attachments;
        });
        sharedModel.myStaffs(user, (staffs) => {
          objStaffs = staffs;
        });
        var remain_days = calculcateRemainDays(created_at);
        db.query(
          "select * from managers " + " WHERE establishing_school_id = ?",
          [establishing_school_id],
          function (error1, results1, fields1) {
            if (error1) {
              console.log(error1);
            }
            var personal_address = results1[0] ? results1[0].id : "";
            var personal_phone_number = results1[0] ? results1[0].id : "";
            var personal_email = results1[0] ? results1[0].manager_email : "";
            var WardNameMtu = results1[0] ? results1[0].id : "";
            var LgaNameMtu = results1[0] ? results1[0].id : "";
            var RegionNameMtu = results1[0] ? results1[0].id : "";
            obj.push({
              manager_full_name: manager_full_name,
              former_manager_full_name: former_manager_full_name,
              manager_phone_no: manager_phone_no,
              manager_email: manager_email,
              manager_cv: manager_cv,
              former_manager_phone_no: former_manager_phone_no,
              former_manager_email: former_manager_email,
              former_manager_cv: former_manager_cv,
              manager_cv : manager_cv,
              former_manager_cv : former_manager_cv,
              tracking_number: tracking_number,
              school_name: school_name,
              authorized_person: authorized_person,
              title: title,
              LgaName: LgaName,
              RegionName: "",
              user_id: user_id,
              manager_email: manager_email,
              purpose: purpose,
              expertise_level: expertise_level,
              registry_type_id: "",
              registry: "",
              manager_first_name: manager_first_name,
              manager_first_name: manager_first_name,
              education_level: education_level,
              created_at: created_at,
              remain_days: remain_days,
              manager_email: manager_email,
              schoolCategory: "",
              occupation: "",
              occupationManager: occupationManager,
              mwombajiAddress: personal_address,
              mwombajiPhoneNo: personal_phone_number,
              old_tracking_number: old_tracking_number,
              baruaPepe: personal_email,
              language: "",
              school_size: school_size,
              managerRegionName: managerRegionName,
              area: area,
              WardName: WardName,
              structure: structure,
              manager_street: manager_street,
              subcategory: subcategory,
              WardNameMtu: WardNameMtu,
              LgaNameMtu: LgaNameMtu,
              RegionNameMtu: RegionNameMtu,
              manager_phone_no: manager_phone_no,
            });

            // console.log(obj);
            return res.send({
              error: false,
              statusCode: 300,
              data: obj,
              maoni: objMess,
              staffs: objStaffs,
              status: objApps,
              Maoni: objMaoni,
              objAttachment: objAttachment,
              objAttachment1 : objAttachment1,
              Refferes: objRef,
              message: "Taarifa za ombi kuanzisha shule.",
            });
          }
        );

        // });
      }
    );
  }
);

badiliMenejaRequestRouter.post("/tuma-meneja-majibu", isAuth, (req, res) => {
  const tracking_number = req.body.trackerId;
  sharedModel.findOneApplication(tracking_number, (app) => {
    const app_category = app["application_category_id"];
    if (app_category) {
      sharedModel.getFormerManagers(tracking_number, (found, manager) => {
        //  console.log(manager);
        if (found) {
          sharedModel.tumaMaoni(req, app_category, (success) => {
            const {
              former_manager_id,
              manager_id,
              old_first_name,
              new_first_name,
              old_middle_name,
              new_middle_name,
              old_last_name,
              new_last_name,
              old_phone_number,
              new_phone_number,
              old_email,
              new_email
            } = manager;
            sharedModel.changeManager(
              req,
              ` manager_first_name = ? , manager_middle_name = ?, manager_last_name = ? , manager_phone_number = ? , manager_email = ?`,
              [new_first_name, new_middle_name, new_last_name, new_phone_number , new_email, manager_id],
              ` manager_first_name = ? , manager_middle_name = ?, manager_last_name = ? , manager_phone_number = ? , manager_email = ?`,
              [old_first_name, old_last_name, old_last_name,old_phone_number , old_email, former_manager_id],
              (updated) => {
                if (updated) console.log("school manager changed");
              }
            );
            return res.send({
              error: success ? false : true,
              statusCode: success ? 300 : 306,
              data: success ? "success" : "fail",
              message: success
                ? `Umethibitisha kubadili meneja kutoka kwa ${old_first_name}${old_middle_name}${old_last_name} kwenda kwa ${new_first_name}${new_middle_name}${new_last_name} .`
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
      });
    }
  });
});
module.exports = badiliMenejaRequestRouter;
