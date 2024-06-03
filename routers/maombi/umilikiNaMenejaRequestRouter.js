require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const umilikiNaMenejaRequestRouter = express.Router();
const { isAuth, permission, selectConditionByTitle, selectStaffsBySection, approvalStatuses, calculcateRemainDays } = require("../../utils");
const sharedModel = require("../../models/sharedModel");

umilikiNaMenejaRequestRouter.post("/maombi-mmiliki-shule", isAuth, permission('view-school-owners-and-managers'), (req, res) => {
  var obj = [];
  const per_page = parseInt(req.body.per_page);
  const page = parseInt(req.body.page);
  const offset = (page - 1) * per_page;
  const user = req.user;
  const status = req.body.status ?  req.body.status : "pending";
  const approvedStatus = approvalStatuses(req.body.status);
  const sqlStatus = ` AND is_approved IN ${
    approvedStatus ? approvedStatus : "(0,1)"
  }`;
  // console.log(status);
  sharedModel.maombiSummaryByCategoryAndStatus(user, 2, null, (summaries) => {
    const sqlSelect = `SELECT   applications.tracking_number as tracking_number,
          applications.created_at as created_at, applications.user_id as user_id, 
          applications.foreign_token as foreign_token, establishing_schools.school_name as school_name,
          regions.RegionName as RegionName, districts.LgaName as LgaName, is_approved , folio, 
          owners.is_manager AS is_manager
      `;
    const sqlFrom = `FROM establishing_schools
      INNER JOIN owners ON establishing_schools.id = owners.establishing_school_id 
      INNER JOIN applications ON  owners.tracking_number = applications.tracking_number
      INNER JOIN wards ON wards.WardCode = establishing_schools.ward_id
      INNER JOIN districts ON districts.LgaCode = wards.LgaCode 
      INNER JOIN regions ON  regions.RegionCode = districts.RegionCode 
      WHERE application_category_id = 2 AND payment_status_id = 2 ${
        ["pending", ""].includes(status) || user.ngazi.toLowerCase() != "wizara"
          ? selectConditionByTitle(user, false, false, status)
          : ""
      }  ${sqlStatus}
      ORDER BY applications.created_at DESC`;
    const sqlRows = `${sqlSelect} ${sqlFrom} LIMIT ?,?`;
    const sqlCount = `SELECT count(*) AS num_rows ${sqlFrom}`

    sharedModel.paginate(sqlRows , sqlCount , function (error, results , numRows) {
        if (error) {
          console.log(error);
          return res.send({
            error: true,
            statusCode: 300,
            dataList: [],
            dataSummary: null,
            message: "List of maombi kuanzisha shule.",
          });
        }
        
        for (var i = 0; i < results.length; i++) {
          var tracking_number = results[i].tracking_number;
          var registry_type_id = results[i].registry_type_id;
          var user_id = results[i].user_id;
          var school_name = results[i].school_name;
          var LgaName = results[i].LgaName;
          var RegionName = results[i].RegionName;
          var RegionName = results[i].RegionName;
          var registry = results[i].registry;
          var created_at = results[i].created_at;
          var schoolCategory = results[i].schoolCategory;
          var is_approved = results[i].is_approved;
          var is_manager = results[i].is_manager;
          var folio = results[i].folio;
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
            is_approved: is_approved,
            folio,
          });
        }
        return res.send({
          error: false,
          statusCode: 300,
          dataList: obj,
          dataSummary: summaries,
          numRows: numRows,
          message: "List of maombi kuanzisha shule.",
        });
      },
      [offset , per_page]
    );
  }
  );
});

umilikiNaMenejaRequestRouter.post(
  "/view-ombi-mmiliki-details",
  isAuth,
  permission('view-school-owners-and-managers'),
  (req, res) => {
    // console.log(req.body)
    var trackingNumber = req.body.TrackingNumber;
    var user = req.user;
    var userLevel = user.user_level;
    var office = req.body.office;

    var obj = [];
    var objMess = [];
    var objStaffs = [];
    var objApps = [];
    var objAttachment = [];
    var objAttachment1 = [];
    var objMaoni = [];
    var objRef = [];
    // console.log(user.cheo);
    db.query(
      `SELECT manager_first_name, manager_middle_name, authorized_person, application_category_id, registry_type_id, title, manager_last_name, 
          establishing_schools.area as area, education_level, expertise_level, is_approved,
          establishing_schools.tracking_number as old_tracking_number, establishing_schools.school_size as school_size, 
          applications.tracking_number as tracking_number, owner_email, purpose, house_number, street, 
          applications.created_at as created_at, managers.occupation as occupation, manager_phone_number, manager_email, 
          applications.user_id as user_id, applications.foreign_token as foreign_token, manager_cv, manager_certificate,
          establishing_schools.school_name as school_name, 
          s.StreetName as StreetName,w.WardName as WardName, r.RegionName as RegionName, d.LgaName as LgaName, 
          owners.owner_name as owner_name , 
          owners.phone_number as owner_phone_no
      FROM owners
      JOIN applications ON owners.tracking_number = applications.tracking_number
      JOIN managers ON managers.tracking_number = applications.tracking_number
      JOIN establishing_schools ON owners.establishing_school_id = establishing_schools.id
      LEFT JOIN  wards  w ON w.WardCode = managers.ward_id
      LEFT JOIN streets s ON s.StreetCode = managers.street
      LEFT JOIN districts d ON d.LgaCode = w.LgaCode
      LEFT JOIN regions r ON r.RegionCode = d.RegionCode
      WHERE  application_category_id = 2 AND applications.tracking_number = ?`,
      [trackingNumber],
      function (error, results) {
        if (error) {
          console.log(error);
        }

        if (results.length > 0) {
          var area = results[0].area;
          var education_level = results[0].education_level;
          var expertise_level = results[0].expertise_level;
          var school_size = results[0].school_size;
          var tracking_number = results[0].tracking_number;
          var title = results[0].title;
          var created_at = results[0].created_at;
          var user_id = results[0].user_id;
          var owner_phone_no = results[0].owner_phone_no;
          var school_name = results[0].school_name;
          var WardName = results[0].WardName;
          var registry_type_id = results[0].registry_type_id;
          var application_category_id = results[0].application_category_id;
          var managerRegionName = results[0].RegionName;
          var purpose = results[0].purpose;
          var owner_email = results[0].owner_email;
          var manager_phone_number = results[0].manager_phone_number;
          var manager_email = results[0].manager_email;
          var manager_cv = results[0].manager_cv;
          var manager_certificate = results[0].manager_certificate;
          var manager_street = results[0].StreetName;
          var house_number = results[0].house_number;
          var LgaName = results[0].LgaName;
          var owner_name = results[0].owner_name;
          var occupationManager = results[0].occupation;
          var WardName = results[0].WardName;
          var manager_first_name = results[0].manager_first_name;
          var manager_middle_name = results[0].manager_middle_name;
          var authorized_person = results[0].authorized_person;
          var manager_last_name = results[0].manager_last_name;
          var old_tracking_number = results[0].old_tracking_number;
          var is_approved = results[0].is_approved;
          var manager_name =
            manager_first_name +
            " " +
            manager_middle_name +
            " " +
            manager_last_name;

          var structure = results[0].structure;
          var subcategory = results[0].subcategory;
          var remain_days = calculcateRemainDays(created_at);
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
        sharedModel.myStaffs(user, (staffs) => {
          objStaffs = staffs;
        });
        sharedModel.getAttachmentTypes(registry_type_id , application_category_id , null , (types) => {
          objAttachment = types;
        });
        db.query(
          `SELECT * 
           FROM owners, referees, wards, districts, regions 
           WHERE regions.RegionCode = districts.RegionCode AND 
           districts.LgaCode = wards.LgaCode AND referees.ward_id = wards.WardCode 
           AND owners.id = referees.owner_id AND tracking_number = ?`,
          [trackingNumber],
          function (error, results) {
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
        sharedModel.getAttachments(trackingNumber , (attachments) => {
          objAttachment1 = attachments
          console.log(objAttachment1);
        });
        db.query(
          `SELECT * 
            FROM personal_infos p
            JOIN applications a ON a.foreign_token = p.secure_token  
            LEFT JOIN wards w ON w.WardCode = p.ward_id
            LEFT JOIN districts d ON w.LgaCode = d.LgaCode  
            LEFT JOIN regions r ON  d.RegionCode = r.RegionCode
            WHERE a.tracking_number = ?`,
          [trackingNumber],
          function (error1, results1) {
            if (error1) {
              console.log(error1);
            }
            if (results1.length > 0) {
              var first_name = results1[0].first_name;
              var middle_name = results1[0].middle_name;
              var last_name = results1[0].last_name;
              var occupation = results1[0].occupation;
              var personal_address = results1[0].personal_address;
              var personal_phone_number = results1[0].personal_phone_number;
              var personal_email = results1[0].personal_email;
              var WardNameMtu = results1[0].WardName;
              var LgaNameMtu = results1[0].LgaName;
              var RegionNameMtu = results1[0].RegionName;
              // console.log(old_tracking_number)
              var fullname = first_name + " " + middle_name + " " + last_name;
            }
            obj.push({
              tracking_number: tracking_number,
              school_name: school_name,
              authorized_person: authorized_person,
              title: title,
              LgaName: LgaName,
              RegionName: "",
              user_id: user_id,
              owner_email: owner_email,
              purpose: purpose,
              expertise_level: expertise_level,
              registry_type_id: "",
              registry: "",
              owner_name: owner_name,
              manager_name: manager_name,
              education_level: education_level,
              created_at: created_at,
              remain_days: remain_days,
              manager_phone_number: manager_phone_number,
              manager_email: manager_email,
              manager_cv: manager_cv,
              manager_certificate: manager_certificate,
              fullname: fullname,
              schoolCategory: "",
              occupation: occupation,
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
              house_number: house_number,
              subcategory: subcategory,
              WardNameMtu: WardNameMtu,
              LgaNameMtu: LgaNameMtu,
              attachment_path: "",
              RegionNameMtu: RegionNameMtu,
              owner_phone_no: owner_phone_no,
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
              Refferes: objRef,
              message: "Taarifa za ombi kuanzisha shule.",
            });
          }
        );
      }
    );
  }
);



umilikiNaMenejaRequestRouter.post("/tuma-mmiliki-majibu", isAuth, (req, res) => {
  const tracking_number = req.body.trackerId;
  var owner_name = req.body.owner_name;
  var authorized_person = req.body.authorized_person;
  var today = new Date();

  sharedModel.findOneApplication(tracking_number, (app) => {
    const app_category = app["application_category_id"];
    if (app_category) {
      sharedModel.tumaMaoni(req, app_category, (success) => {
        return res.send({
          error: success ? true : false,
          statusCode: success ? 300 : 306,
          data: success ? "success" : "Fail",
          message: success ? "Majibu Successfully Recorded." : "Fail",
        });
        // });
      });
    }
  });
});


module.exports = umilikiNaMenejaRequestRouter;
