require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const badiliMmilikiRequestRouter = express.Router();
const dateandtime = require("date-and-time");
var session = require("express-session"); 

const { isAuth, formatDate, permission } = require("../../utils");

badiliMmilikiRequestRouter.post(
  "/maombi-badili-mmiliki-shule",
  isAuth,
  permission("view-change-of-school-owner"),
  (req, res) => {
       console.log("hiaiiaia")
        var obj = [];
        var obj1 = [];
        var obj2 = [];
        // var districtId = req.body.districtCode;
        var UserLevel = req.user.user_level;
        var Office = req.body.Office;
        // console.log("UserLevel")
        db.query("select count(*) as total_month " +
          " from applications " +
          " WHERE application_category_id = ? AND MONTH(applications.created_at) = MONTH(CURRENT_DATE())",
        [7],
        function (error1, summary, fields1) {
          if (error1) {
            console.log(error1);
          }
          var total_month = summary[0].total_month;
        if (UserLevel == 1 || UserLevel == 3) {
          db.query(
            "SELECT applications.tracking_number as tracking_number, applications.created_at as created_at, " +
              " former_owners.owner_name as owner_name, wards.WardName as WardName, LgaName, former_owners.authorized_person as authorized_person, " +
              " RegionName, establishing_schools.school_name as school_name FROM " +
              " regions, applications, former_owners, establishing_schools, wards, " +
              " districts WHERE districts.LgaCode = wards.LgaCode AND applications.tracking_number = former_owners.tracking_number " +
              " AND establishing_schools.id = former_owners.establishing_school_id AND establishing_schools.ward_id = wards.WardCode " +
              " AND regions.RegionCode = districts.RegionCode AND application_category_id = ? AND is_approved <> ?   AND payment_status_id = ?",
            [7, 2, 2],
            function (error, results, fields) {
              if (error) {
                console.log(error);
              }
           
              for (var i = 0; i < results.length; i++) {
                console.log(results);
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
                });
              }
              // console.log(obj)
              return res.send({
                error: false,
                statusCode: 300,
                dataList: obj,
                dataSummary : total_month,
                message: "List of maombi kuanzisha shule.",
              });
            }
          );
        } else if (UserLevel == 2 || UserLevel == 4) {
          db.query(
            "SELECT applications.tracking_number as tracking_number, applications.created_at as created_at, " +
              " former_owners.owner_name as owner_name, wards.WardName as WardName, LgaName, former_owners.authorized_person as authorized_person, " +
              " RegionName, establishing_schools.school_name as school_name FROM " +
              " regions, applications, former_owners, establishing_schools, wards, " +
              " districts where districts.LgaCode = wards.LgaCode AND applications.tracking_number = former_owners.tracking_number " +
              " AND establishing_schools.id = former_owners.establishing_school_id AND establishing_schools.ward_id = wards.WardCode " +
              " AND regions.RegionCode = districts.RegionCode AND application_category_id = ? " +
              " AND is_approved <> ? AND regions.zone_code = ? AND status_id = ? AND payment_status_id = ?",
            [7, 2, Office, UserLevel, 2],
            function (error, results, fields) {
              if (error) {
                console.log(error);
              }
              for (var i = 0; i < results.length; i++) {
                console.log(results);
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
                });
              }
              // console.log(obj)
              return res.send({
                error: false,
                statusCode: 300,
                dataList: obj,
                dataSummary : total_month,
                message: "List of maombi kuanzisha shule.",
              });
            }
          );
        } else if (UserLevel == 11) {
          db.query(
            "SELECT applications.tracking_number as tracking_number, applications.created_at as created_at, " +
              " former_owners.owner_name as owner_name, wards.WardName as WardName, LgaName, former_owners.authorized_person as authorized_person, " +
              " RegionName, establishing_schools.school_name as school_name FROM " +
              " regions, applications, former_owners, establishing_schools, wards, " +
              " districts where districts.LgaCode = wards.LgaCode AND applications.tracking_number = former_owners.tracking_number " +
              " AND establishing_schools.id = former_owners.establishing_school_id AND establishing_schools.ward_id = wards.WardCode " +
              " AND regions.RegionCode = districts.RegionCode AND application_category_id = ? AND is_approved <> ?",
            [7, 2],
            function (error, results, fields) {
              if (error) {
                console.log(error);
              }
              for (var i = 0; i < results.length; i++) {
                console.log(results);
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
                });
              }
              // console.log(obj)
              return res.send({
                error: false,
                statusCode: 300,
                dataList: obj,
                dataSummary : total_month,
                message: "List of maombi kuanzisha shule.",
              });
            }
          );
        } else {
          db.query(
            "SELECT applications.tracking_number as tracking_number, applications.created_at as created_at, " +
              " former_owners.owner_name as owner_name, wards.WardName as WardName, LgaName, former_owners.authorized_person as authorized_person, " +
              " RegionName, establishing_schools.school_name as school_name FROM " +
              " regions, applications, former_owners, establishing_schools, wards, " +
              " districts where districts.LgaCode = wards.LgaCode AND applications.tracking_number = former_owners.tracking_number " +
              " AND establishing_schools.id = former_owners.establishing_school_id AND establishing_schools.ward_id = wards.WardCode " +
              " AND regions.RegionCode = districts.RegionCode AND application_category_id = ? AND is_approved <> ? AND status_id = ? AND payment_status_id = ?",
            [7, 2, UserLevel, 2],
            function (error, results, fields) {
              if (error) {
                console.log(error);
              }
              for (var i = 0; i < results.length; i++) {
                console.log(results);
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
                });
              }
              // console.log(obj)
              return res.send({
                error: false,
                statusCode: 300,
                dataList: obj,
                dataSummary : total_month,
                message: "List of maombi kuanzisha shule.",
              });
            }
          );
        }
    });
  }
);

badiliMmilikiRequestRouter.post(
  "/view-ombi-badili-mmiliki-details",
  isAuth,
  permission("view-change-of-school-owner"),
  (req, res, next) => {
    var trackingNumber = req.body.TrackingNumber;
    var userLevel = req.user.user_level;
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
      "select authorized_person, title, " +
        " establishing_schools.area as area, former_owners.establishing_school_id as establishing_school_id, " +
        " establishing_schools.tracking_number as old_tracking_number, establishing_schools.school_size as school_size, " +
        " applications.tracking_number as tracking_number, owner_email, purpose, " +
        " applications.created_at as created_at, " +
        " applications.user_id as user_id, applications.foreign_token as foreign_token, " +
        " establishing_schools.school_name as school_name, wards.WardName as WardName, regions.RegionName as RegionName, " +
        " districts.LgaName as LgaName, former_owners.owner_name as owner_name, former_owners.phone_number as owner_phone_no" +
        " FROM former_owners, establishing_schools, applications, wards, districts, regions WHERE " +
        " regions.RegionCode = districts.RegionCode AND districts.LgaCode = wards.LgaCode AND " +
        " wards.WardCode = establishing_schools.ward_id AND former_owners.tracking_number = applications.tracking_number " +
        " AND application_category_id = ? AND former_owners.establishing_school_id = establishing_schools.id " +
        " AND applications.tracking_number = ?",
      [7, trackingNumber],
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
        //w1
        if (userLevel == 1) {
          db.query(
            "SELECT vyeo.id as vyeoId, staffs.id as userId, email, user_level, last_login, " +
              " staffs.name as name, phone_no, vyeo.rank_name as role_name FROM staffs, " +
              " vyeo where user_status = ? AND vyeo.id = staffs.user_level " +
              " AND staffs.user_level IN (?) AND staffs.office = ?",
            [1, 3, office],
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
        }
        //ofsaw1
        if (userLevel == 3) {
          db.query(
            "SELECT vyeo.id as vyeoId, staffs.id as userId, email, user_level, last_login, " +
              " staffs.name as name, phone_no, vyeo.rank_name as role_name FROM staffs, " +
              " vyeo where user_status = ? AND vyeo.id = staffs.user_level AND staffs.user_level IN (?) AND staffs.office = ?",
            [1, 1, office],
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
        }
        //k1
        if (userLevel == 2) {
          db.query(
            "SELECT vyeo.id as vyeoId, staffs.id as userId, email, user_level, last_login, " +
              " staffs.name as name, phone_no, vyeo.rank_name as role_name FROM staffs, " +
              " vyeo where user_status = ? AND vyeo.id = staffs.user_level AND staffs.user_level IN (?) AND office = ?",
            [1, 4, office],
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
        }
        //ofsak1
        if (userLevel == 4) {
          db.query(
            "SELECT vyeo.id as vyeoId, staffs.id as userId, email, user_level, last_login, " +
              " staffs.name as name, phone_no, vyeo.rank_name as role_name FROM staffs, " +
              " vyeo where user_status = ? AND vyeo.id = staffs.user_level AND staffs.user_level IN (?)",
            [1, 2],
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
        }
        //adsa
        if (userLevel == 5) {
          db.query(
            "SELECT vyeo.id as vyeoId, staffs.id as userId, email, user_level, last_login, " +
              " staffs.name as name, phone_no, vyeo.rank_name as role_name FROM staffs, " +
              " vyeo where user_status = ? AND vyeo.id = staffs.user_level AND staffs.user_level IN (?)",
            [1, 7],
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
        }
        //usj
        if (userLevel == 7) {
          db.query(
            "SELECT vyeo.id as vyeoId, staffs.id as userId, email, user_level, last_login, " +
              " staffs.name as name, phone_no, vyeo.rank_name as role_name FROM staffs, " +
              " vyeo where user_status = ? AND vyeo.id = staffs.user_level AND staffs.user_level IN (?)",
            [1, 5],
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
        }
        //oke
        if (userLevel == 8) {
          db.query(
            "SELECT vyeo.id as vyeoId, staffs.id as userId, email, user_level, last_login, " +
              " staffs.name as name, phone_no, vyeo.rank_name as role_name FROM staffs, " +
              " vyeo where user_status = ? AND vyeo.id = staffs.user_level AND staffs.user_level IN (?)",
            [1, 9],
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
        }
        //ke
        if (userLevel == 9) {
          db.query(
            "SELECT vyeo.id as vyeoId, staffs.id as userId, email, user_level, last_login, " +
              " staffs.name as name, phone_no, vyeo.rank_name as role_name FROM staffs, " +
              " vyeo where user_status = ? AND vyeo.id = staffs.user_level AND staffs.user_level IN (?, ?, ?)",
            [1, 5, 8, 17],
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
        }
        //mwanasheria
        if (userLevel == 17) {
          db.query(
            "SELECT vyeo.id as vyeoId, staffs.id as userId, email, user_level, last_login, " +
              " staffs.name as name, phone_no, vyeo.rank_name as role_name FROM staffs, " +
              " vyeo where user_status = ? AND vyeo.id = staffs.user_level AND staffs.user_level IN (?, ?)",
            [1, 18, 9],
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
        }
        //mwanasheria karani
        if (userLevel == 18) {
          db.query(
            "SELECT vyeo.id as vyeoId, staffs.id as userId, email, user_level, last_login, " +
              " staffs.name as name, phone_no, vyeo.rank_name as role_name FROM staffs, " +
              " vyeo where user_status = ? AND vyeo.id = staffs.user_level AND staffs.user_level IN (?)",
            [1, 17],
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
        }
        //admin
        if (userLevel == 11) {
          db.query(
            "SELECT vyeo.id as vyeoId, staffs.id as userId, email, user_level, last_login, " +
              " staffs.name as name, phone_no, vyeo.rank_name as role_name FROM staffs, " +
              " vyeo where user_status = ? AND vyeo.id = staffs.user_level",
            [1],
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
        }

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

        db.query(
          "SELECT name, user_from, user_to, coments, maoni.created_at as created_at, rank_name " +
            " from maoni, staffs, vyeo WHERE staffs.id = maoni.user_from AND vyeo.id = staffs.user_level " +
            " AND trackingNo = ? ORDER BY maoni.id DESC",
          [trackingNumber],
          function (error, results, fields) {
            if (error) {
              console.log(error);
            }
            console.log(results);
            for (var i = 0; i < results.length; i++) {
              var name = results[i].name;
              var user_from = results[i].user_from;
              var user_to = results[i].user_to;
              var coments = results[i].coments;
              var created_at = results[i].created_at;
              var rank_name = results[i].rank_name;
              if (created_at == null) {
                created_at = new Date();
              }
              // console.log(maoniTime)
              created_at = dateandtime.format(
                new Date(created_at),
                "DD/MM/YYYY hh:mm:ss"
              );
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

        db.query(
          "SELECT attachment_types.id as id, file_size, file_format, attachment_name " +
            " FROM attachment_types",
          function (error, results, fields) {
            if (error) {
              console.log(error);
            }
            for (var i = 0; i < results.length; i++) {
              var file_format = results[i].file_format;
              var app_id = results[i].id;
              var attachment_name = results[i].attachment_name;
              var registry = "";
              var application_name = "";
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


//total application of the month


module.exports = badiliMmilikiRequestRouter;
