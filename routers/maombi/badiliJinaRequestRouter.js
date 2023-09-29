require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const badiliJinaRequestRouter = express.Router();
const dateandtime = require("date-and-time");
var session = require("express-session");
const { isAuth, formatDate, permission, filterByUserLevel } = require("../../utils");

badiliJinaRequestRouter.post(
    "/maombi-badili-jina-shule",
    isAuth,
    permission('view-school-owners-and-managers'), 
    (req, res) => {
      var obj = [];
      var obj1 = [];
      var obj2 = [];
      // var districtId = req.body.districtCode;
      var UserLevel = req.user.user_level;
      var Office = req.body.Office;
      // console.log("UserLevel")
      console.log(req.body);
      if (UserLevel == 33) {
        db.query(
          "select school_categories.category as schoolCategory, applications.tracking_number as tracking_number, " +
            " applications.created_at as created_at, applications.user_id as user_id, " +
            " applications.foreign_token as foreign_token, " +
            " establishing_schools.school_name as school_name, regions.RegionName as RegionName, " +
            " districts.LgaName as LgaName from former_school_infos, establishing_schools, applications, " +
            " wards, districts, school_categories, regions WHERE school_categories.id = establishing_schools.school_category_id " +
            " AND regions.RegionCode = districts.RegionCode AND districts.LgaCode = wards.LgaCode AND " +
            " former_school_infos.establishing_school_id = establishing_schools.id AND " +
            " wards.WardCode = establishing_schools.ward_id AND former_school_infos.tracking_number = applications.tracking_number " +
            " AND application_category_id = ? AND is_approved <> ?",
          [9, 2],
          function (error, results, fields) {
            if (error) {
              console.log(error);
            }
            for (var i = 0; i < results.length; i++) {
              console.log(results);
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
              });
            }
            // console.log(obj)
            return res.send({
              error: false,
              statusCode: 300,
              dataList: obj,
              message: "List of maombi kuanzisha shule.",
            });
          }
        );
      } else if (UserLevel == 1 || UserLevel == 3) {
        db.query(
          "select school_categories.category as schoolCategory, applications.tracking_number as tracking_number, " +
            " applications.created_at as created_at, applications.user_id as user_id, " +
            " applications.foreign_token as foreign_token, " +
            " establishing_schools.school_name as school_name, regions.RegionName as RegionName, " +
            " districts.LgaName as LgaName from former_school_infos, establishing_schools, applications, " +
            " wards, districts, school_categories, regions WHERE school_categories.id = establishing_schools.school_category_id " +
            " AND regions.RegionCode = districts.RegionCode AND districts.LgaCode = wards.LgaCode AND " +
            " former_school_infos.establishing_school_id = establishing_schools.id AND " +
            " wards.WardCode = establishing_schools.ward_id AND former_school_infos.tracking_number = applications.tracking_number " +
            " AND application_category_id = ? AND status_id = ? AND is_approved <> ? AND districts.LgaCode = ? AND payment_status_id = ?",
          [9, UserLevel, 2, Office, 2],
          function (error, results, fields) {
            if (error) {
              console.log(error);
            }
            for (var i = 0; i < results.length; i++) {
              // console.log(results)
              var tracking_number = results[i].tracking_number;
              var registry_type_id = results[i].registry_type_id;
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
              });
            }
            return res.send({
              error: false,
              statusCode: 300,
              data: obj,
              message: "List of maombi kuanzisha shule.",
            });
          }
        );
      } else if (UserLevel == 2 || UserLevel == 4) {
        db.query(
          "select school_categories.category as schoolCategory, applications.tracking_number as tracking_number, " +
            " applications.created_at as created_at, applications.user_id as user_id, " +
            " applications.foreign_token as foreign_token, " +
            " establishing_schools.school_name as school_name, regions.RegionName as RegionName, " +
            " districts.LgaName as LgaName from former_school_infos, establishing_schools, applications, " +
            " wards, districts, school_categories, regions WHERE school_categories.id = establishing_schools.school_category_id " +
            " AND regions.RegionCode = districts.RegionCode AND districts.LgaCode = wards.LgaCode AND " +
            " former_school_infos.establishing_school_id = establishing_schools.id AND " +
            " wards.WardCode = establishing_schools.ward_id AND former_school_infos.tracking_number = applications.tracking_number " +
            " AND application_category_id = ? AND status_id = ? AND is_approved <> ? AND regions.zone_code = ? AND payment_status_id = ?",
          [9, UserLevel, 2, Office, 2],
          function (error, results, fields) {
            if (error) {
              console.log(error);
            }
            for (var i = 0; i < results.length; i++) {
              // console.log(results)
              var tracking_number = results[i].tracking_number;
              var registry_type_id = results[i].registry_type_id;
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
              });
            }
            return res.send({
              error: false,
              statusCode: 300,
              data: obj,
              message: "List of maombi kuanzisha shule.",
            });
          }
        );
      } else {
        db.query(
          "select school_categories.category as schoolCategory, applications.tracking_number as tracking_number, " +
            " applications.created_at as created_at, applications.user_id as user_id, " +
            " applications.foreign_token as foreign_token, " +
            " establishing_schools.school_name as school_name, regions.RegionName as RegionName, " +
            " districts.LgaName as LgaName from former_school_infos, establishing_schools, applications, " +
            " wards, districts, school_categories, regions WHERE school_categories.id = establishing_schools.school_category_id " +
            " AND regions.RegionCode = districts.RegionCode AND districts.LgaCode = wards.LgaCode AND " +
            " former_school_infos.establishing_school_id = establishing_schools.id AND " +
            " wards.WardCode = establishing_schools.ward_id AND former_school_infos.tracking_number = applications.tracking_number " +
            " AND application_category_id = ? AND status_id = ? AND is_approved <> ? AND payment_status_id = ?",
          [9, UserLevel, 2, 2],
          function (error, results, fields) {
            if (error) {
              console.log(error);
            }
            for (var i = 0; i < results.length; i++) {
              // console.log(results)
              var tracking_number = results[i].tracking_number;
              var registry_type_id = results[i].registry_type_id;
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
              });
            }
            return res.send({
              error: false,
              statusCode: 300,
              data: obj,
              message: "List of maombi kuanzisha shule.",
            });
          }
        );
      }
    }
);

module.exports = badiliJinaRequestRouter;
