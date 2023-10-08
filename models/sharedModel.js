const db = require("../dbConnection");
const { selectStaffsBySection, formatDate, InsertAuditTrail, getMyNextBoss } = require("../utils");

module.exports = {
  myStaffs: (user, callback) => {
    // console.log(user)
    const objStaffs = [];
    db.query(
      `SELECT r.id as vyeoId, s.id as userId, email, user_level, last_login, 
         s.name as name, phone_no, r.name as role_name 
         FROM staffs s
         JOIN roles r ON r.id = s.user_level
         JOIN vyeo v ON v.id = r.vyeoId
         WHERE s.user_status = 1 AND v.id = ${user.section_id} ${selectStaffsBySection(user)}
         ORDER BY name ASC
         `,
      (error, results) => {
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
        callback(objStaffs);
      }
    );
  },
  myMaoni : ( tracking_number ,callback) => {
    const obj = [];
     db.query(
       `SELECT staffs.name AS name, user_from, user_to, coments, maoni.created_at as created_at, 
               roles.name AS cheo 
        FROM maoni, staffs, roles 
        WHERE staffs.id = maoni.user_from AND roles.id = staffs.user_level 
              AND trackingNo = ? 
              ORDER BY maoni.id DESC`,
       [tracking_number],
       function (error, results) {
         if (error) {
           console.log(error);
         }

         for (var i = 0; i < results.length; i++) {
              var name = results[i].name;
              var user_from = results[i].user_from;
              var user_to = results[i].user_to;
              var coments = results[i].coments;
              var maoniTime = results[i].created_at;
              var rank_name = results[i].cheo;
              if (maoniTime == null) {
                maoniTime = new Date();
              }
           // console.log(maoniTime)
           // maoniTime = dateandtime.format(maoniTime, "DD/MM/YYYY hh:mm:ss");
           obj.push({
             user_from: user_from,
             name: name,
             user_to: user_to,
             coments: coments,
             created_at: maoniTime,
             rank_name: rank_name,
           });
         }
         callback(obj);
       }
     );
  },
  findApplicationDetails: (tracking_number , callback) => {
    const obj = [];
    const objAttachment = [];
    const objAttachment1 = [];
    const objAttachment2 = [];
    const objMess = [];
     db.query(
       `SELECT registration_structures.structure as structure, school_sub_categories.subcategory as subcategory,application_category_id, 
               establishing_schools.area as area, establishing_schools.school_size as school_size,
               languages.language as language, school_categories.category as schoolCategory, applications.tracking_number as tracking_number, 
               applications.tracking_number as tracking_number,
               applications.created_at as created_at, applications.registry_type_id as registry_type_id, 
               applications.user_id as user_id, applications.foreign_token as foreign_token, 
               establishing_schools.school_name as school_name, wards.WardName as WardName, regions.RegionName as RegionName, 
               districts.LgaName as LgaName, registry_types.registry as registry
          FROM applications  
          JOIN establishing_schools  ON  establishing_schools.tracking_number = applications.tracking_number  
          JOIN school_categories ON school_categories.id = establishing_schools.school_category_id
          LEFT JOIN school_sub_categories ON school_sub_categories.id = establishing_schools.school_sub_category_id 
          LEFT JOIN registration_structures ON registration_structures.id = establishing_schools.registration_structure_id 
          LEFT JOIN languages ON languages.id = establishing_schools.language_id
          LEFT JOIN registry_types ON registry_types.id = applications.registry_type_id
          JOIN wards ON wards.WardCode = establishing_schools.ward_id
          JOIN districts ON districts.LgaCode = wards.LgaCode
          JOIN regions ON regions.RegionCode = districts.RegionCode
          WHERE applications.tracking_number = ?`,
       [tracking_number],
       function (error, results) {
         if (error) {
           console.log(error);
         }
        //  console.log(results);
         if (results.length > 0) {
           var tracking_number = results[0].tracking_number;
           var registry_type_id = results[0].registry_type_id;
           var application_category_id = results[0].application_category_id;
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
           var registry_type_id = null;
           var application_category_id = null;
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
           [tracking_number],
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
             "select *, IFNULL(middle_name , '') AS middle_name, IFNULL(last_name , '') AS last_name FROM personal_infos, applications, wards, districts, regions " +
               " WHERE districts.RegionCode = regions.RegionCode AND wards.LgaCode = districts.LgaCode AND wards.WardCode = personal_infos.ward_id " +
               " AND applications.foreign_token = personal_infos.secure_token AND applications.tracking_number = ?",
             [tracking_number],
             function (error1, results1) {
               if (error1) {
                 console.log(error1);
               }
               console.log(results1);
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
                 var fullname =
                   first_name + " " + middle_name + " " + last_name;
               } else {
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
                 var fullname = "";
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
             }
           );
         }
         console.log(application_category_id, registry_type_id);
         db.query(
           `SELECT attachment_types.id as id, file_size, file_format, UPPER(attachment_name) as attachment_name 
              FROM attachment_types
              WHERE status_id = 1 AND (registry_type_id = ${registry_type_id} OR registry_type_id = 0) 
                    AND application_category_id = ${application_category_id}`,
           function (error, results) {
             if (error) {
               console.log(error);
             }
             //  console.log(results);
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
           [tracking_number],
           function (error1, results1) {
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
               created_at = formatDate(created_at, "DD/MM/YYYY HH:MM:SS"); //dateandtime.format( new Date(created_at), "DD/MM/YYYY HH:MM:SS");
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

         if (registry_type_id == 2) {
           db.query(
             "select institute_infos.id as id, institute_infos.name as name, institute_infos.address as address, " +
               " institute_infos.institute_phone as institute_phone, institute_infos.institute_email as institute_email " +
               " from institute_infos, applications WHERE " +
               " applications.foreign_token = institute_infos.secure_token AND applications.tracking_number = ?",
             [tracking_number],
             function (error1, results1, fields1) {
               if (error1) {
                 console.log(error1);
               }
               //  console.log("bibb", results1);
                if(results1.length > 0){
                   var instId = results1[0].id;
                   var name = results1[0].name;
                   var address = results1[0].address;
                   var institute_phone = results1[0].institute_phone;
                   var institute_email = results1[0].institute_email;
                }else{
                   var instId = '';
                   var name = '';
                   var address = '';
                   var institute_phone = '';
                   var institute_email = '';
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
                     //  created_at = dateandtime.format(
                     //    created_at,
                     //    "DD/MM/YYYY HH:MM:SS"
                     //  );
                     created_at = formatDate(created_at, "DD/MM/YYYY HH:MM:SS");
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
                 }
               );
             }
           );
         }

         callback(obj, objAttachment, objAttachment1, objAttachment2, objMess);
       }
     );
  } 
  ,
  tumaMaoni : (req , application_category, callback) => {
    var success = false;
    const today = new Date();
    const {user} = req;
    const userTo = Number(req.body.staffs);
    const staff_id =  userTo == 0 ? null : userTo;
    console.log("inatumwa kwa ",getMyNextBoss(user, 1, staff_id));
    db.query(
      `SELECT s.id AS id 
                  FROM staffs s 
                  JOIN roles r ON r.id = s.user_level
                  JOIN vyeo v ON v.id = r.vyeoId
                  WHERE s.user_status = 1  
                  ${getMyNextBoss(user, application_category, staff_id)}
                  LIMIT 1
                  `,
      (err, staff) => {
        if (err) console.log(err);
        var user_to = staff_id;
        if (staff.length > 0) {
          user_to = staff[0].id;
        }

        db.query(
          `INSERT INTO maoni (trackingNo, user_from, user_to, coments, 
        type_of_comment, created_at) VALUES 
        (${db.escape(req.body.trackerId)}, ${db.escape(req.body.from_user)}, 
        ${db.escape(req.body.staffs)}, ${db.escape(req.body.coments)}, 
        ${db.escape(req.body.replyType)}, ${db.escape(today)})`,
          function (error, results) {
            if (error) {
              console.log(error);
            } else {
              success = true;
            }
            db.query(
              "UPDATE applications SET staff_id = ?, status_id = ?, is_approved = ?, approved_at = ? WHERE tracking_number = ?",
              [
                user_to,
                req.body.department,
                req.body.haliombi,
                today,
                req.body.trackerId,
              ],
              function (error) {
                if (error) {
                  console.log(error);
                }
                //sendMail(req.body.staffs)
                db.query(
                  `SELECT id FROM maoni where 
                        trackingNo = ${db.escape(req.body.trackerId)} AND 
                        user_from = ${db.escape(req.body.from_user)} AND 
                        user_to = ${db.escape(
                          req.body.staffs
                        )} AND coments = ${db.escape(req.body.coments)}`,
                  function (error, results) {
                    if (error) {
                      console.log(error);
                    }
                    var rollId = results[0].id;
                    InsertAuditTrail(
                      req.user.id,
                      "created",
                      req.body,
                      req.url,
                      req.body.browser_used,
                      rollId,
                      "Maoni umiliki yameongezwa!",
                      req.body.ip_address,
                      "maoni"
                    );
                    callback(success);
                  }
                );
              }
            );
          }
        );
      }
    );
  },

  findOneApplication : (tracking_number , callback) =>{
         db.query(`SELECT * FROM applications WHERE tracking_number = ?` , [tracking_number] , (error , applications) => {
            if(error) console.log(error);
            callback(applications[0])
         })
  } 
};
