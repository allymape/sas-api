const db = require("../dbConnection");
const {
  selectStaffsBySection,
  formatDate,
  InsertAuditTrail,
  getMyNextBoss,
  calculcateRemainDays,
  UpdateAuditTrail,
  joinsByApplicationCategory,
  filterByUserOffice,
  schoolLocationsSqlJoin,
  notifyUser
} = require("../utils");

module.exports = {
  getHierarchies: (callback) => {
    db.query(
      `SELECT id, rank_name AS name 
      FROM vyeo 
      WHERE status_id = 1
      ORDER BY id ASC`,
      (err, hierarchies) => {
        if (err) console.log(err);
        callback(hierarchies);
      }
    );
  },
  getApplicationCategories: (callback) => {
    db.query(
      `SELECT id, app_name AS name FROM application_categories ORDER BY id ASC`,
      (err, categories) => {
        if (err) console.log(err);
        callback(categories);
      }
    );
  },
  getSchoolCategories: (callback) => {
    db.query(
      `SELECT id , category AS name FROM school_categories ORDER BY id ASC`,
      (error, categories) => {
        if (error) {
          console.log("Can't get school categories due to ", error);
        }
        callback(categories);
      }
    );
  },

  getRegistrationStructures: (callback) => {
    db.query(
      `SELECT id, structure AS name FROM registration_structures`,
      (error, registry_types) => {
        if (error) {
          console.log(error);
        }
        callback(registry_types);
      }
    );
  },
  // getRegistryTypes
  getSchoolOwnerships: (callback) => {
    db.query(
      `SELECT id, registry AS name FROM registry_types`,
      (error2, ownerships) => {
        if (error2) {
          console.log("Can't get ownerships due to ", error2);
        }
        callback(ownerships);
      }
    );
  },

  myStaffs: (user, callback) => {
    // console.log(user)
    const objStaffs = [];
    db.query(
      `SELECT s.id as userId, s.name as name,r.name as role_name 
         FROM staffs s
         JOIN roles r ON r.id = s.user_level
         JOIN vyeo v ON v.id = r.vyeoId
         WHERE s.user_status = 1 AND v.id = ${
           user.section_id
         }
         ${selectStaffsBySection(user)}
         ORDER BY name ASC
         `,
      (error, results) => {
        if (error) {
          console.log(error);
        }
        for (var i = 0; i < results.length; i++) {
          var userId = results[i].userId;
          var name = results[i].name;
          var role_name = results[i].role_name;
          objStaffs.push({
            userId: userId,
            name: name,
            role: role_name,
          });
        }
        callback(objStaffs);
      }
    );
  },
  myMaoni: (tracking_number, callback) => {
    const obj = [];
    db.query(
      `SELECT staffs.name AS name, coments, maoni.created_at as created_at, roles.name AS cheo 
      FROM maoni 
      JOIN staffs ON staffs.id = maoni.user_from
      JOIN roles ON roles.id = staffs.user_level
      WHERE  trackingNo = ?
      ORDER BY maoni.id DESC`,
      [tracking_number],
      function (error, results) {
        if (error) {
          console.log(error);
        }

        for (var i = 0; i < results.length; i++) {
          var name = results[i].name;
          var coments = results[i].coments;
          var maoniTime = results[i].created_at;
          var rank_name = results[i].cheo;
          // console.log(maoniTime)
          // maoniTime = dateandtime.format(maoniTime, "DD/MM/YYYY hh:mm:ss");
          obj.push({
            name: name,
            coments: coments,
            created_at: maoniTime,
            rank_name: rank_name,
          });
        }
        callback(obj);
      }
    );
  },
  getAttachmentTypes: (
    registry_type_id,
    application_category_id,
    registration_structure_id,
    callback
  ) => {
    const objAttachment = [];
    db.query(
      `SELECT attachment_types.id as id, file_size, file_format, UPPER(attachment_name) as attachment_name 
          FROM attachment_types
          WHERE status_id = 1 AND (registry_type_id = ${registry_type_id} OR registry_type_id = 0) 
          AND application_category_id = ${application_category_id}`,
      function (error, results) {
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
        callback(objAttachment);
      }
    );
  },
  getAttachments: (tracking_number, callback) => {
    const objAttachment = [];
    db.query(
      "SELECT attachment_types.id as id, file_size, file_format, " +
        " attachment_name, attachments.created_at as created_at, attachment_path " +
        " FROM attachment_types, " +
        " attachments WHERE attachments.attachment_type_id = attachment_types.id AND " +
        " attachments.tracking_number = ?",
      [tracking_number],
      function (error, results) {
        if (error) {
          console.log(error);
        }
        for (var i = 0; i < results.length; i++) {
          var file_format1 = results[i].file_format;
          var app_id = results[i].id;
          var attachment_name1 = results[i].attachment_name;
          // var registry1 = results[i].registry;
          var attachment_path = results[i].attachment_path;
          var created_at = results[i].created_at;
          // created_at = dateandtime.format(
          //   new Date(created_at),
          //   "DD/MM/YYYY HH:MM:SS"
          // );
          var file_size = results[i].file_size;
          objAttachment.push({
            file_format: file_format1,
            attachment_name: attachment_name1,
            registry_id: app_id,
            file_size: file_size,
            registry: "registry1",
            application_name: "application_name1",
            created_at: created_at,
            attachment_path: attachment_path,
          });
        }
        callback(objAttachment);
        // console.log(objAttachment1)
      }
    );
  },
  findApplicationDetails: (tracking_number, callback) => {
    var obj = [];
    var objAttachment = [];
    var objAttachment1 = [];
    var objAttachment2 = [];
    var objMess = [];
    db.query(
      `SELECT registration_structures.structure as structure, school_sub_categories.subcategory as subcategory,application_category_id, 
               establishing_schools.area as area, establishing_schools.school_size as school_size,
               languages.language as language, school_categories.category as schoolCategory, applications.tracking_number as tracking_number, 
               applications.tracking_number AS tracking_number, is_approved,
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
          var schoolCategory = results[0].schoolCategory;
          var language = results[0].language;
          var school_size = results[0].school_size;
          var area = results[0].area;
          var WardName = results[0].WardName;
          var structure = results[0].structure;
          var subcategory = results[0].subcategory;
          var is_approved = results[0].is_approved;
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
          var is_approved = "";
        }
        var remain_days = calculcateRemainDays(created_at);
       
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
                var coments = resultsMaoni[i].coments;
                objMess.push({ coments: coments });
              }
            }
          }
        );
   
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
              // console.log(results1);
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
                var fullname = first_name + " " + middle_name + " " + last_name;
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
                is_approved : is_approved
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
        //  console.log(application_category_id, registry_type_id);
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
              if (results1.length > 0) {
                var instId = results1[0].id;
                var name = results1[0].name;
                var address = results1[0].address;
                var institute_phone = results1[0].institute_phone;
                var institute_email = results1[0].institute_email;
              } else {
                var instId = "";
                var name = "";
                var address = "";
                var institute_phone = "";
                var institute_email = "";
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
                is_approved: is_approved,
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
  },
  // Business Flow base on application category
  getMyNextBoss: (user, application_category, staff_id, callback) => {
    var str = (str = ` AND s.id < -1`);
    const { cheo_office, zone_id, ngazi } = user;
    if (staff_id == 0 || staff_id == "" || staff_id == null) {
      db.query(
        `SELECT LOWER(rank_name) AS rank_name , rank_level
          FROM work_flow w
          JOIN vyeo v ON v.id = w.end_to
          WHERE w.application_category_id = ? AND w.start_from = ? 
          LIMIT 1`,
        [application_category, cheo_office],
        (error, result) => {
          if (error) console.log(error);
          if (result.length == 1) {
            const { rank_name, rank_level } = result[0];
            str = ` AND LOWER(r.name) =  '${rank_name}' AND 
                                s.zone_id ${
                                  rank_level == 1 ? " IS NULL" : " = " + zone_id
                                }`;
          }
          callback(str);
        }
      );
    } else {
      callback(str);
    }
  },
  tumaMaoni: (req, application_category, callback) => {
    var success = false;
    const today = formatDate(new Date(), "YYYY-MM-DD HH:mm:ss");
    const { user } = req;
    const {
      haliombi,
      department,
      trackerId,
      staffs,
      replyType,
      from_user,
      coments,
    } = req.body;
    const userTo = staffs == "#" || staffs == "" ? 0 : Number(staffs);
    const staff_id = userTo == 0 ? null : userTo;
    module.exports.getMyNextBoss(
      user,
      application_category,
      staff_id,
      (nextBossSql) => {
        // console.log(nextBossSql);
        db.query(
          `SELECT s.id AS id 
                  FROM staffs s 
                  JOIN roles r ON r.id = s.user_level
                  JOIN vyeo v ON v.id = r.vyeoId
                  WHERE s.user_status = 1  
                  ${nextBossSql}
                  LIMIT 1
                  `,
          (err, staff) => {
            if (err) console.log(err);
            var user_to = staff_id;
            if (staff.length > 0) {
              user_to = staff[0].id;
            }

            if (user.cheo != "ke" && !user_to && haliombi != 4) {
              console.log("Kuna shida");
              callback(success);
            } else {
              console.log(`inatumwa kwa ${ haliombi == 4 ? 'Mwombaji' : staff}`);
              db.query(
                `INSERT INTO maoni (trackingNo, user_from, user_to, coments, type_of_comment, created_at) VALUES 
                (
                  ${db.escape(trackerId)}, 
                  ${db.escape(from_user)}, 
                  ${db.escape(user_to)}, 
                  ${db.escape(coments)}, 
                  ${db.escape(replyType)}, 
                  ${db.escape(today)}
                )`,
                function (error, results) {
                  if (error) {
                    console.log(error);
                  } else {
                    if (results.affectedRows > 0) {
                      success = true;
                      //sendMail notify
                      notifyUser(
                        user_to,
                        application_category,
                        user.name,
                        trackerId
                      );
                    }
                    db.query(
                      "UPDATE applications SET staff_id = ?, status_id = ?, is_approved = ? , approved_by = ?, approved_at = ? WHERE tracking_number = ?",
                      [
                        user_to,
                        0,
                        haliombi,
                        haliombi > 1 ? user.id : null,
                        today,
                        trackerId,
                      ],
                      function (error) {
                        if (error) {
                          console.log(error);
                        }

                        db.query(
                          `SELECT id 
                          FROM maoni 
                          WHERE 
                          trackingNo = ${db.escape(trackerId)} AND 
                          user_from = ${db.escape(from_user)} AND 
                          user_to = ${db.escape(user_to)}
                          ORDER BY id DESC
                          LIMIT 1`,
                          function (error, results) {
                            if (error) {
                              console.log(error);
                            }
                            if (results.length > 0) {
                              var rollId = results[0].id;
                              InsertAuditTrail(
                                req.user.id,
                                "created",
                                req.body,
                                req.url,
                                req.body.browser_used,
                                rollId,
                                "Maoni yameongezwa!",
                                req.body.ip_address,
                                "maoni"
                              );
                            }
                            callback(success);
                          }
                        );
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    );
  },

  findOneApplication: (tracking_number, callback) => {
    db.query(
      `SELECT * FROM applications WHERE tracking_number = ?`,
      [tracking_number],
      (error, applications) => {
        if (error) console.log(error);
        callback(applications[0]);
      }
    );
  },
  getFormerSchoolInfos: (tracking_number, callback) => {
    db.query(
      `SELECT f.id AS former_id , e.id AS school_id,
                     f.school_name AS new_name , e.school_name AS old_name,
                     f.stream AS new_stream, e.stream AS old_stream,
                     f.school_sub_category_id AS new_bweni , e.school_sub_category_id AS old_bweni,
                     f.is_hostel AS new_is_hostel, e.is_hostel AS old_is_hostel,
                     f.school_category_id  AS new_school_category_id , e.school_category_id AS old_school_category_id,
                     f.village_id as new_village_id , f.ward_id AS new_ward_id, e.ward_id AS old_ward_id , e.village_id AS old_village_id,
                     s.registration_number AS registration_number,
                     s.id AS registration_id
              FROM applications a
              JOIN former_school_infos f on f.tracking_number = a.tracking_number
              JOIN establishing_schools e on e.id = f.establishing_school_id
              JOIN school_registrations s ON s.establishing_school_id = e.id
              WHERE a.tracking_number = ?`,
      [tracking_number],
      (error, results) => {
        if (error) console.log(error);
        const success = results.length > 0;
        callback(success, success ? results[0] : []);
      }
    );
  },
  changeSchoolInfos: (
    req,
    newFieldsSql,
    newValues = [],
    oldFieldsSql,
    oldValues = [],
    callback
  ) => {
    const { haliombi } = req.body;
    if (haliombi == 2) {
      db.query(
        `UPDATE establishing_schools  SET ${newFieldsSql}
                WHERE id = ?`,
        newValues,
        function (error) {
          if (error) console.log(error);
          db.query(
            `UPDATE former_school_infos SET ${oldFieldsSql} 
                    WHERE id = ?`,
            oldValues,
            function (error, updated) {
              if (error) console.log(error);
              const success = updated.affectedRows > 0;
              callback(success);
            }
          );
        }
      );
    }
  },
  futaShule: (
    req,
    newFieldsSql,
    newValues = [],
    oldFieldsSql,
    oldValues = [],
    callback
  ) => {
    const { haliombi } = req.body;
    if (haliombi == 2) {
      db.query(
        `UPDATE school_registrations  SET ${newFieldsSql}
         WHERE id = ?`,
        newValues,
        function (error) {
          if (error) console.log(error);
          db.query(
            `UPDATE former_school_infos SET ${oldFieldsSql} 
                    WHERE id = ?`,
            oldValues,
            function (error, updated) {
              if (error) console.log(error);
              const success = updated.affectedRows > 0;
              callback(success);
            }
          );
        }
      );
    }
  },
  getFormerOwners: (tracking_number, callback) => {
    db.query(
      `SELECT f.id AS former_owner_id , o.id AS owner_id, 
              f.owner_name AS new_owner_name, o.owner_name AS former_owner_name
              FROM applications a
              JOIN former_owners f on f.tracking_number = a.tracking_number
              JOIN establishing_schools e ON e.id = f.establishing_school_id
              JOIN owners o ON o.establishing_school_id = e.id
              WHERE a.tracking_number = ?`,
      [tracking_number],
      (error, results) => {
        if (error) console.log(error);
        const success = results.length > 0;
        callback(success, success ? results[0] : []);
      }
    );
  },
  changeOwner: (
    req,
    newFieldsSql,
    newValues = [],
    oldFieldsSql,
    oldValues = [],
    callback
  ) => {
    const { haliombi } = req.body;
    if (haliombi == 2) {
      db.query(
        `UPDATE owners  SET ${newFieldsSql}
                WHERE id = ?`,
        newValues,
        function (error) {
          if (error) console.log(error);
          db.query(
            `UPDATE former_owners SET ${oldFieldsSql} 
                    WHERE id = ?`,
            oldValues,
            function (error, updated) {
              if (error) console.log(error);
              const success = updated.affectedRows > 0;
              callback(success);
            }
          );
        }
      );
    }
  },
  getFormerManagers: (tracking_number, callback) => {
    db.query(
      `SELECT f.id AS former_manager_id , m.id AS manager_id, 
              f.manager_first_name AS new_first_name, f.manager_middle_name AS new_middle_name,f.manager_last_name AS new_last_name, 
              f.manager_phone_number AS new_phone_number , f.manager_email AS new_email,
              m.manager_first_name AS old_first_name, m.manager_middle_name AS old_middle_name,m.manager_last_name AS old_last_name,
              m.manager_phone_number AS old_phone_number , m.manager_email AS old_email
              FROM applications a
              JOIN former_managers f on f.tracking_number = a.tracking_number
              JOIN establishing_schools e ON e.id = f.establishing_school_id
              JOIN managers m ON m.establishing_school_id = e.id
              WHERE a.tracking_number = ?`,
      [tracking_number],
      (error, results) => {
        if (error) console.log(error);
        const success = results.length > 0;
        callback(success, success ? results[0] : []);
      }
    );
  },
  changeManager: (
    req,
    newFieldsSql,
    newValues = [],
    oldFieldsSql,
    oldValues = [],
    callback
  ) => {
    const { haliombi } = req.body;
    if (haliombi == 2) {
      db.query(
        `UPDATE managers  SET ${newFieldsSql}
                WHERE id = ?`,
        newValues,
        function (error) {
          if (error) console.log(error);
          db.query(
            `UPDATE former_managers SET ${oldFieldsSql} 
                    WHERE id = ?`,
            oldValues,
            function (error, updated) {
              if (error) console.log(error);
              const success = updated.affectedRows > 0;
              callback(success);
            }
          );
        }
      );
    }
  },
  getSchoolCombinations: (tracking_number, callback) => {
    db.query(
      `SELECT e.id AS school_id , s.id AS school_registration_id  , f.combination_id  AS combination_id 
        FROM applications a
        JOIN former_school_combinations f on f.tracking_number = a.tracking_number
        JOIN establishing_schools e ON e.id = f.establishing_school_id
        JOIN school_registrations s ON s.establishing_school_id = e.id
        WHERE a.tracking_number = ?`,
      [tracking_number],
      (error, results) => {
        if (error) console.log(error);
        const success = results.length > 0;
        callback(success, success ? results : []);
      }
    );
  },
  changeSchoolCombinations: (req, newCombs = [], oldCombs = [], callback) => {
    const { haliombi } = req.body;
    if (haliombi == 2) {
      db.query(
        `INSERT school_combinations(combination_id , school_registration_id) VALUES ?`,
        [newCombs],
        function (error, updated1) {
          if (error) console.log(error);
          const successNewComb = updated1.affectedRows > 0;
          // insert old school combination if exists
          if (oldCombs.length > 0) {
            db.query(
              `INSERT former_school_combinations(combination_id , establishing_school_id) VALUES ?`,
              [oldCombs],
              function (error, updated2) {
                if (error) console.log(error);
                const successOldComb = updated2.affectedRows > 0;
              }
            );
          }
          // if(successNewComb){
          //   // Delete former combinations
          //    newCombs.forEach(item => {
          //         db.query(`DELETE FROM former_school_combinations WHERE establishing_school_id = ? AND combination_id = ?` , [item[1] , item[0]])
          //    })
          // }
          callback(successNewComb);
        }
      );
    }
  },
  updateOrCreateRegistrationNumber: (
    tracking_number,
    schoolCatId,
    existing_reg_no = null,
    callback
  ) => {
    var code = "";
    var id = 0;
    switch (Number(schoolCatId)) {
      case 1:
        code = "EA";
        id = 1;
        break;
      case 2:
        code = "EM";
        id = 2;
        break;
      case 3:
        code = "S";
        id = 3;
        break;
      case 4:
        code = "CU";
        id = 4;
        break;
      default:
        break;
    }

    db.query(`SELECT * FROM algorthm WHERE id = ${id}`, (error, result) => {
      if (error) console.log(error);
      var registration_number = 1;
      var last_number = 1;
      var exist = false;
      if (result.length > 0) {
        registration_number = result[0].last_number;
        last_number = registration_number + 1;
        exist = true;
      } else {
        // Find registration number from existing schools
        db.query(
          `SELECT substring_index(s.registration_number , '.', 1) AS registration_code,
		                    substring_index(s.registration_number , '.', -1) AS registration_number
                FROM school_registrations s
                WHERE s.tracking_number <> "${tracking_number}" 
                      AND s.registration_number LIKE "%${code}%" 
                ORDER BY length(s.registration_number) DESC , s.registration_number DESC 
                LIMIT 1`,
          (error, result) => {
            if (error) console.log(error);
            if (result.length > 0) {
              registration_number = parseInt(result[0].registration_number) + 1;
              last_number = registration_number + 1;
            }
          }
        );
      }

      console.log("last_number", last_number);
      //  Update registered schools
      const today = new Date();
      db.query(
        `UPDATE school_registrations SET registration_number = ?, registration_date = ? , updated_at = ? , reg_status = ?
                          WHERE ${
                            existing_reg_no
                              ? "registration_number = ?"
                              : "tracking_number = ?"
                          }`,
        [
          code + "." + registration_number,
          formatDate(today, "YYYY-MM-DD"),
          today,
          1,
          existing_reg_no ? existing_reg_no : tracking_number,
        ],
        function (error, result) {
          if (error) {
            console.log(error);
          }
          if (result.affectedRows > 0) {
            if (exist) {
              //  Update algorithm
              db.query(
                `UPDATE algorthm SET last_number = ? WHERE id = ${id}`,
                [last_number],
                (error, updated) => {
                  if (error) console.log(error);
                  if (updated) {
                    console.log(
                      `Algorithm updated successfully  ${code}.${registration_number}`
                    );
                  }
                }
              );
            } else {
              //  INSERT IF NOT EXISTING
              db.query(
                `INSERT INTO algorthm (id, school_type, last_number) VALUES(?,?,?)`,
                [id, code, last_number],
                (error) => {
                  if (error) console.log(error);
                }
              );
            }
          }
          callback(registration_number);
        }
      );
    });
  },

  updateApplicationPayment: (tracking_number, callback) => {
    var success = false;
    db.query(
      `UPDATE applications SET payment_status_id = 2 WHERE tracking_number = ?`,
      [tracking_number],
      (error, result) => {
        if (error) console.log(error);
        if (result.affectedRows > 0) {
          success = true;
        }
        callback(success, result);
      }
    );
  },

  sqlQuerySchoolInfo: (sql, application_category_id, callback) => {
    db.query(
      ` ${sql} AND a.application_category_id 
        ${
          application_category_id
            ? " = " + application_category_id
            : " IN (5,6,9,10,11,13,14)"
        }`,
      (error, result) => {
        if (error) console.log(error);
        callback(result);
      }
    );
  },
  maombiSummaryByCategoryAndStatus: (
    user,
    application_category,
    registry_type = null,
    callback
  ) => {
    const is_complete = `${
      application_category == 1 ? "AND a.is_complete IN (1)" : ""
    }`;
    const sql = `SELECT COUNT(*) AS num_rows 
                    FROM applications a
                    ${joinsByApplicationCategory(application_category)}
                    ${schoolLocationsSqlJoin()}
                    WHERE ${
                      (application_category == 4) & (registry_type != null)
                        ? " a.registry_type_id IN " + registry_type + " AND"
                        : ""
                    } 
                    a.application_category_id = ? 
                    ${filterByUserOffice(user, "AND")}
                    `;
    //  All
    //  console.log(
    //    filterByUserOffice(user, "AND", "r.zone_id", "s.district_code")
    //  );
    db.query(
      `${sql} AND a.is_approved IN (0,1,2,3)  ${is_complete}`,
      [application_category],
      (error, all) => {
        if (error) console.log(error);
        // Pending
        db.query(
          `${sql} AND a.is_approved IN (0,1)  ${is_complete}`,
          [application_category],
          (error, pending) => {
            if (error) console.log(error);
            // Approved
            db.query(
              `${sql} AND a.is_approved = 2 ${is_complete} `,
              [application_category],
              (error, approved) => {
                if (error) console.log(error);
                // Rejected
                db.query(
                  `${sql} AND a.is_approved = 3 ${is_complete}`,
                  [application_category],
                  (error, rejected) => {
                    if (error) console.log(error);
                    callback({
                      all: all[0].num_rows,
                      pending: pending[0].num_rows,
                      approved: approved[0].num_rows,
                      rejected: rejected[0].num_rows,
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  },
  getRegions: (user, callback) => {
    const { sehemu, zone_id, region_code } = user;
    db.query(
      `SELECT RegionCode AS id , RegionName AS name 
               FROM regions 
               ${sehemu == "k1" ? "WHERE zone_id = " + zone_id : ""}
               ${
                 sehemu == "w1"
                   ? "WHERE RegionCode = '" + region_code + "'"
                   : ""
               }
               ORDER BY RegionName ASC`,
      (error, regions) => {
        if (error) console.log(error);
        callback(regions);
      }
    );
  },
  paginate: (sql_rows, sql_count, callback, parameters = []) => {
    //  console.log(is_paginated);
    db.query(`${sql_rows}`, parameters, (error, data) => {
      if (error) console.log(error);
      db.query(`${sql_count}`, (error2, result) => {
        if (error2) {
          console.log(error2);
          error = error2;
        }
        callback(error, data, result[0].num_rows);
      });
    });
  },
};
