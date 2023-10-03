require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const anzishaShuleRequestRouter = express.Router();
const model = require("../../models/maombi/anzishaShuleRequestModel")
const dateandtime = require("date-and-time");
var session = require("express-session"); 
const { isAuth, formatDate } = require("../../utils");

// List of 
anzishaShuleRequestRouter.post("/maombi-kuanzisha-shule", isAuth,(req, res) => {
    var per_page = parseInt(req.query.per_page);
    var page = parseInt(req.query.page);
    var offset = (page - 1) * per_page;
    var is_paginated = true;
    if (typeof req.body.is_paginated !== "undefined") {
      is_paginated =
        req.body.is_paginated == "false" || !req.body.is_paginated
          ? false
          : true;
    }
    model.anzishaShuleRequestList(req.user , (error, data, numRows) => {
            return res.send({
                    error: error ? true : false,
                    statusCode: error ? 306 : 300,
                    data: error ? null : data,
                    numRows: numRows,
                    message: error ? "Something went wrong." : "List of maombi kuanzisha shule.",
                });
      }
    );
  }
);


anzishaShuleRequestRouter.post("/view-ombi-details", isAuth, (req, res) => {
      // console.log("ni",req.body);
      var trackingNumber = req.body.TrackingNumber;
      var userLevel = req.body.userLevel;
      var sehemu = req.user.sehemu;
      var cheo = req.user.cheo;
      var office = req.body.office;
      // console.log('tracking' , trackingNumber);
      var obj = [];
      var objMess = [];
      var objStaffs = [];
      var objApps = [];
      var objAttachment = [];
      var objMaoni = [];
      var objAttachment1 = [];
      var objAttachment2 = [];
    // console.log(cheo , sehemu);
    db.query(
      "select registration_structures.structure as structure, school_sub_categories.subcategory as subcategory, " +
        " establishing_schools.area as area, establishing_schools.school_size as school_size, " +
        " languages.language as language, school_categories.category as schoolCategory, applications.tracking_number as tracking_number, " +
        " applications.tracking_number as tracking_number, " +
        " applications.created_at as created_at, applications.registry_type_id as registry_type_id, " +
        " applications.user_id as user_id, applications.foreign_token as foreign_token, " +
        " establishing_schools.school_name as school_name, wards.WardName as WardName, regions.RegionName as RegionName, " +
        " districts.LgaName as LgaName, registry_types.registry as registry " +
        " from school_sub_categories, establishing_schools, applications, registration_structures, wards, districts, school_categories, languages, registry_types, " +
        " regions WHERE school_sub_categories.id = establishing_schools.school_sub_category_id AND languages.id = establishing_schools.language_id AND " +
        " school_categories.id = establishing_schools.school_category_id AND regions.RegionCode = districts.RegionCode AND " +
        " districts.LgaCode = wards.LgaCode AND wards.WardCode = establishing_schools.ward_id " +
        " AND establishing_schools.tracking_number = applications.tracking_number AND " +
        " registry_types.id = applications.registry_type_id AND registration_structures.id = establishing_schools.registration_structure_id AND application_category_id = ? AND applications.tracking_number = ?",
      [1, trackingNumber],
      function (error, results, fields) {
        if (error) {
          console.log(error);
        }
   
        if (results.length > 0) {
          var tracking_number = results[0].tracking_number;
          var registry_type_id = results[0].registry_type_id;
          var user_id = results[0].user_id;
          var foreign_token = results[0].foreign_token;
          var school_name = results[0].school_name;
          var LgaName = results[0].LgaName;
          var RegionName = results[0].RegionName;
          var RegionName = results[0].RegionName;
          var registry = results[0].registry;
          var created_at = results[0].created_at;
          created_at = formatDate(created_at, "DD/MM/YYYY");
          var schoolCategory = results[0].schoolCategory;
          var language = results[0].language;
          var school_size = results[0].school_size;
          var area = results[0].area;
          var WardName = results[0].WardName;
          var structure = results[0].structure;
          var subcategory = results[0].subcategory;
        } else {
          var tracking_number = "";
          var registry_type_id = "";
          var user_id = "";
          var foreign_token = "";
          var school_name = "";
          var LgaName = "";
          var RegionName = "";
          // var RegionName = results[0].RegionName;
          var registry = "";
          var created_at = "";
          // created_at = dateandtime.format( new Date(created_at),'DD/MM/YYYY');
          var schoolCategory = "";
          var language = "";
          var school_size = "";
          var area = "";
          var WardName = "";
          var structure = "";
          var subcategory = "";
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
                objMess.push({ coments: coments });
              }
            }
          }
        );
        //w1
        if (sehemu == 'w1' && cheo == 'w1') {
          db.query(
            "SELECT vyeo.id as vyeoId, staffs.id as userId, email, user_level, last_login, " +
              " staffs.name as name, phone_no, vyeo.rank_name as role_name FROM staffs, " +
              " vyeo where user_status = ? AND vyeo.id = staffs.user_level " +
              " AND staffs.user_level IN (?, ?) AND staffs.office = ?",
            [1, 3, 5, office],
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
        if (sehemu == 'w1' && cheo != 'w1') {
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
        if (sehemu == 'k1' && cheo == "k1") {
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
        if (sehemu == "k1" && cheo != "k1") {
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
        if (sehemu == 'adsa' && cheo == 'adsa') {
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
        if (sehemu == 'adsa' && cheo != 'adsa') {
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
        if (sehemu == "ke" && cheo != "ke") {
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
        if (sehemu == "ke" && cheo == 9) {
          db.query(
            "SELECT vyeo.id as vyeoId, staffs.id as userId, email, user_level, last_login, " +
              " staffs.name as name, phone_no, vyeo.rank_name as role_name FROM staffs, " +
              " vyeo where user_status = ? AND vyeo.id = staffs.user_level AND staffs.user_level IN (?)",
            [1, 8],
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

            for (var i = 0; i < results.length; i++) {
              var name = results[i].name;
              var user_from = results[i].user_from;
              var user_to = results[i].user_to;
              var coments = results[i].coments;
              var maoniTime = results[i].created_at;
              var rank_name = results[i].rank_name;
              if (maoniTime == null) {
                maoniTime = new Date();
              }
              // console.log(maoniTime)
              // maoniTime = dateandtime.format(maoniTime, "DD/MM/YYYY hh:mm:ss");
              objMaoni.push({
                user_from: user_from,
                name: name,
                user_to: user_to,
                coments: coments,
                created_at: maoniTime,
                rank_name: rank_name,
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
            for (var i = 0; i < results1.length; i++) {
              var file_format1 = results1[i].file_format;
              var app_id1 = results1[i].id;
              var attachment_name1 = results1[i].attachment_name;
              // var registry1 = results[i].registry;
              var attachment_path = results1[i].attachment_path;
              var created_at = results1[i].created_at;
              created_at = dateandtime.format(
                new Date(created_at),
                "DD/MM/YYYY HH:MM:SS"
              );
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

        if (registry_type_id == 1) {
          db.query(
            "select * from personal_infos, applications, wards, districts, regions " +
              " WHERE districts.RegionCode = regions.RegionCode AND wards.LgaCode = districts.LgaCode AND wards.WardCode = personal_infos.ward_id " +
              " AND applications.foreign_token = personal_infos.secure_token AND applications.tracking_number = ?",
            [trackingNumber],
            function (error1, results1, fields1) {
              if (error1) {
                console.log(error1);
              }
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
              var fullname = first_name + " " + middle_name + " " + last_name;
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
              console.log("1:",obj);
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
            }
          );
        }
        if (registry_type_id == 2) {
          db.query(
            "select institute_infos.id as id, institute_infos.name as name, institute_infos.address as address, " +
              " institute_infos.institute_phone as institute_phone, institute_infos.institute_email as institute_email " +
              " from institute_infos, applications WHERE " +
              " applications.foreign_token = institute_infos.secure_token AND applications.tracking_number = ?",
            [trackingNumber],
            function (error1, results1, fields1) {
              if (error1) {
                console.log(error1);
              }
              console.log("bibb",results1)
              var instId = results1[0].id;
              var name = results1[0].name;
              var address = results1[0].address;
              var institute_phone = results1[0].institute_phone;
              var institute_email = results1[0].institute_email;
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
                fullname: name,
                occupation: "-",
                mwombajiAddress: address,
                mwombajiPhoneNo: institute_phone,
                baruaPepe: institute_email,
                language: language,
                school_size: school_size,
                area: area,
                WardName: WardName,
                structure: structure,
                subcategory: "Oldsubcategory",
              });
              db.query(
                "SELECT attachment_types.id as id, file_size, file_format, " +
                  " attachment_name, institute_attachments.created_at as created_at, attachment " +
                  " FROM attachment_types, " +
                  " institute_attachments WHERE institute_attachments.institute_info_id = ? " +
                  " AND institute_attachments.attachment_type_id = attachment_types.id",
                [instId],
                function (error1, results1, fields1) {
                  if (error1) {
                    console.log(error1);
                  }
                  // console.log(results1)
                  for (var i = 0; i < results1.length; i++) {
                    var file_format1 = results1[i].file_format;
                    var app_id1 = results1[i].id;
                    var attachment_name1 = results1[i].attachment_name;
                    // var registry1 = results[i].registry;
                    var attachment_path = results1[i].attachment;
                    var created_at = results1[i].created_at;
                    created_at = dateandtime.format(
                      created_at,
                      "DD/MM/YYYY HH:MM:SS"
                    );
                    var file_size1 = results1[i].file_size;
                    objAttachment2.push({
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
                  // console.log(objAttachment2)

                  console.log("data",obj);
                  return res.send({
                    error: false,
                    statusCode: 300,
                    data: obj,
                    maoni: objMess,
                    objAttachment: objAttachment,
                    objAttachment1: objAttachment1,
                    objAttachment2: objAttachment2,
                    staffs: objStaffs,
                    status: objApps,
                    Maoni: objMaoni,
                    message: "Taarifa za ombi kuanzisha shule.",
                  });
                }
              );
            }
          );
        }
      }
    );
});



module.exports = anzishaShuleRequestRouter;
