require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const badiliMmilikiRequestRouter = express.Router();
const dateandtime = require("date-and-time");
var session = require("express-session"); 

const { isAuth, formatDate, permission, selectConditionByTitle, approvalStatuses } = require("../../utils");
const sharedModel = require("../../models/sharedModel");

badiliMmilikiRequestRouter.post(
  "/maombi-badili-mmiliki-shule",
  isAuth,
  permission("view-change-of-school-owner"),
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
        const sqlSelect = `SELECT applications.tracking_number as tracking_number, folio, applications.created_at as created_at,
        former_owners.owner_name as owner_name, wards.WardName as WardName, LgaName, former_owners.authorized_person as authorized_person,
        RegionName, establishing_schools.school_name as school_name 
            `;

        const sqlFrom = `FROM regions, applications, former_owners, establishing_schools, wards, 
        districts WHERE districts.LgaCode = wards.LgaCode AND applications.tracking_number = former_owners.tracking_number
        AND establishing_schools.id = former_owners.establishing_school_id AND establishing_schools.ward_id = wards.WardCode
        AND regions.RegionCode = districts.RegionCode AND application_category_id = 7 AND payment_status_id = 2
          ${
            ["pending", ""].includes(status) ||
            user.ngazi.toLowerCase() != "wizara"
              ? selectConditionByTitle(user)
              : ""
          } ${sqlStatus} ORDER BY applications.created_at DESC`;

        const sqlCount = `SELECT COUNT(*) AS num_rows ${sqlFrom}`;
        const sqlRows = `${sqlSelect} ${sqlFrom} LIMIT ?,?`;
       sharedModel.maombiSummaryByCategoryAndStatus(user, 7 , null,(summaries)  => {
          sharedModel.paginate(sqlRows , sqlCount,
            function (error, results , numRows) {
              if (error) {
                console.log(error);
              }
            //  console.log(results)
              for (var i = 0; i < results.length; i++) {
                // console.log(results);
                var tracking_number = results[i].tracking_number;
                var owner_name = results[i].owner_name;
                var WardName = results[i].WardName;
                var LgaName = results[i].LgaName;
                var RegionName = results[i].RegionName;
                var registry_type_id = results[i].registry_type_id;
                var user_id = results[i].user_id;
                var foreign_token = results[i].foreign_token;
                var school_name = results[i].school_name;
                var registry = results[i].registry;
                var authorized_person = results[i].authorized_person;
                var created_at = results[i].created_at;
                var schoolCategory = results[i].schoolCategory;
                var applicantname;
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
                  authorized_person: authorized_person,
                  LgaName: LgaName,
                  RegionName: RegionName,
                  user_id: user_id,
                  WardName: WardName,
                  registry_type_id: registry_type_id,
                  registry: registry,
                  owner_name: owner_name,
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
                dataSummary : summaries,
                numRows: numRows,
                message: "List of maombi kuanzisha shule.",
              });
            },
            [offset , per_page]
          );
    });
  }
);

badiliMmilikiRequestRouter.post(
  "/view-ombi-badili-mmiliki-details",
  isAuth,
  permission("view-change-of-school-owner"),
  (req, res, next) => {
    var trackingNumber = req.body.TrackingNumber;
    const user = req.user; var userLevel = user.user_level;
    var office = req.body.office;

    var obj = [];
    var objMess = [];
    var objStaffs = [];
    var objApps = [];
    var objAttachment = [];
    var objAttachment1 = [];
    var objMaoni = [];
    var objRef = [];
  
    db.query(
      `SELECT authorized_person, title, registry_type_id, application_category_id,  
				 establishing_schools.area as area, former_owners.establishing_school_id as establishing_school_id,  
				 establishing_schools.tracking_number as old_tracking_number, establishing_schools.school_size as school_size,  
				 applications.tracking_number as tracking_number, owner_email, purpose,  
				 applications.created_at as created_at,  
				 applications.user_id as user_id, applications.foreign_token as foreign_token,  
				 establishing_schools.school_name as school_name, wards.WardName as WardName, regions.RegionName as RegionName,  
				 districts.LgaName as LgaName, former_owners.owner_name as owner_name, former_owners.phone_number as owner_phone_no 
     FROM former_owners
     LEFT JOIN applications ON former_owners.tracking_number = applications.tracking_number
     LEFT JOIN establishing_schools ON former_owners.establishing_school_id = establishing_schools.id
		 LEFT JOIN wards ON wards.WardCode = establishing_schools.ward_id
		 LEFT JOIN districts ON districts.LgaCode = wards.LgaCode 
		 LEFT JOIN regions ON regions.RegionCode = districts.RegionCode
     WHERE application_category_id = 7 AND applications.tracking_number = ?`,
      [trackingNumber],
      function (error, results, fields) {
        if (error) {
          console.log(error);
        }
        if (results.length > 0) {
          var area = results[0].area;
          var education_level = "";
          var expertise_level = "";
          var school_size = results[0].school_size;
          var tracking_number = results[0].tracking_number;
          var title = results[0].title;
          var created_at = results[0].created_at;
          var user_id = results[0].user_id;
          var establishing_school_id = results[0].establishing_school_id;
          var owner_phone_no = results[0].owner_phone_no;
          var school_name = results[0].school_name;
          var WardName = results[0].WardName;
          var managerRegionName = results[0].RegionName;
          var purpose = results[0].purpose;
          var owner_email = results[0].owner_email;
          var manager_phone_number = "";
          var manager_email = "";
          var manager_street = "";
          var LgaName = results[0].LgaName;
          var owner_name = results[0].owner_name;
          var occupationManager = "";
          var WardName = results[0].WardName;
          var manager_first_name = "";
          var manager_middle_name = "";
          var authorized_person = results[0].authorized_person;
          var manager_last_name = "";
          var old_tracking_number = results[0].old_tracking_number;
          var registry_type_id = results[0].registry_type_id;
          var application_category_id = results[0].application_category_id;
          var manager_name =
            manager_first_name +
            " " +
            manager_middle_name +
            " " +
            manager_last_name;

          var structure = results[0].structure;
          var subcategory = results[0].subcategory;
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
                var coments = resultsMaoni[i].coments;
                objMess.push({ coments: coments });
              }
            }
          }
        );

        sharedModel.myStaffs(user, (staffs) => {
          objStaffs = staffs;
        });

        sharedModel.myMaoni(trackingNumber, (maoni) => {
          objMaoni = maoni;
        });

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
        });
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
          "select * from owners " + " WHERE establishing_school_id = ?",
          [establishing_school_id],
          function (error1, results1, fields1) {
            if (error1) {
              console.log(error1);
            }

            var owner_name_old = results1[0].owner_name;
            var authorized_person_old = results1[0].authorized_person;
            var owner_email_old = results1[0].owner_email;
            var phone_number_old = results1[0].phone_number;
            var personal_address = results1[0].id;
            var personal_phone_number = results1[0].id;
            var personal_email = results1[0].id;
            var WardNameMtu = results1[0].id;
            var LgaNameMtu = results1[0].id;
            var RegionNameMtu = results1[0].id;
            var fullname = owner_name_old;
            obj.push({
              owner_name_old: owner_name_old,
              tracking_number: tracking_number,
              school_name: school_name,
              authorized_person: authorized_person,
              title: title,
              LgaName: LgaName,
              RegionName: "",
              user_id: user_id,
              owner_email_old: owner_email_old,
              owner_email: owner_email,
              purpose: purpose,
              expertise_level: expertise_level,
              registry_type_id: "",
              registry: "",
              owner_name: owner_name,
              manager_name: manager_name,
              education_level: education_level,
              created_at: created_at,
              remain_days: "",
              manager_phone_number: manager_phone_number,
              manager_email: manager_email,
              fullname: fullname,
              schoolCategory: "",
              occupation: "",
              phone_number_old: phone_number_old,
              occupationManager: occupationManager,
              owner_email_old: owner_email_old,
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
              authorized_person_old: authorized_person_old,
              subcategory: subcategory,
              WardNameMtu: WardNameMtu,
              LgaNameMtu: LgaNameMtu,
              RegionNameMtu: RegionNameMtu,
              owner_phone_no: owner_phone_no,
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

badiliMmilikiRequestRouter.post("/tuma-mmiliki-badili-majibu", isAuth, (req, res) => {
  const tracking_number = req.body.trackerId;
  sharedModel.findOneApplication(tracking_number, (app) => {
    const app_category = app["application_category_id"];
    if (app_category) {
 sharedModel.getFormerOwners(tracking_number, (found, owner) => {
   console.log(owner);
   if (found) {
     sharedModel.tumaMaoni(req, app_category, (success) => {
       const { former_owner_id, owner_id , former_owner_name , new_owner_name } = owner;
       sharedModel.changeOwner(
         req,
         ` owner_name = ?`,
         [new_owner_name, owner_id],
         "owner_name = ?",
         [former_owner_name, former_owner_id],
         (updated) => {
           if (updated) console.log("school infos updated");
         }
       );
       return res.send({
         error: success ? false : true,
         statusCode: success ? 300 : 306,
         data: success ? "success" : "fail",
         message: success
           ? `Umethibitisha kubadili jina la shule kutoka ${former_owner_name} kuwa ${new_owner_name} .`
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

//total application of the month


module.exports = badiliMmilikiRequestRouter;
