const db = require(`../../dbConnection`);
const { selectConditionByTitle } = require("../../utils");
const sharedModel = require("../sharedModel");
module.exports = {
  //******** GET A LIST OF APPLICANTS *******************************
  anzishaShuleRequestList: (req , sqlStatus,callback) => {
    const user = req.user;
    const status = req.body.status ?  req.body.status : "pending"
    const per_page = parseInt(req.body.per_page);
    const page = parseInt(req.body.page);
    const offset = (page - 1) * per_page;
    const sqlFrom = `FROM establishing_schools
            JOIN applications ON establishing_schools.tracking_number = applications.tracking_number
            LEFT JOIN wards ON wards.wardCode = establishing_schools.ward_id  
            LEFT JOIN districts ON districts.LgaCode = wards.LgaCode 
            LEFT JOIN streets ON streets.StreetCode = establishing_schools.village_id  
            LEFT JOIN school_categories ON school_categories.id = establishing_schools.school_category_id
            LEFT JOIN registry_types ON registry_types.id = applications.registry_type_id 
            LEFT JOIN regions ON regions.RegionCode = districts.RegionCode 
            LEFT JOIN staffs ON applications.staff_id = staffs.id
            WHERE  application_category_id = 1  AND payment_status_id = 2 AND is_complete = 1
            ${
              ["pending", ""].includes(status) ||
              user.ngazi.toLowerCase() != "wizara"
                ? selectConditionByTitle(user , false , false , status)
                : ""
            } 
            ${sqlStatus}
            ORDER BY applications.created_at DESC`;
          //  console.log(selectConditionByTitle(user, false, false, status));
    const sqlSelect = `SELECT school_categories.category as schoolCategory, applications.tracking_number as tracking_number,  
                        applications.created_at as created_at,is_approved, applications.registry_type_id as registry_type_id,  
                        applications.user_id as user_id, applications.foreign_token as foreign_token,  
                        UPPER(establishing_schools.school_name) as school_name, regions.RegionName as RegionName,  
                        districts.LgaName as LgaName, registry_types.registry as registry, folio`;
    const sqlRows = `${sqlSelect} ${sqlFrom} LIMIT ?, ?`;
    const sqlCount = `SELECT COUNT(*) AS num_rows ${sqlFrom}`
    // console.log('xx' , selectConditionByTitle(user, false, false, status));
    sharedModel.paginate(sqlRows , sqlCount,(error, results , numRows) => {
           if (error) console.log(error);
           callback(error, results , numRows);
      },
      [offset , per_page]
    );
  },

  anzishaShuleRequestView: (trackingNumber, callback) => {
    db.query(
      `SELECT registration_structures.structure as structure, school_sub_categories.subcategory as subcategory,
              establishing_schools.area as area, establishing_schools.school_size as school_size,
              languages.language as language, school_categories.category as schoolCategory, applications.tracking_number as tracking_number,
              applications.tracking_number as tracking_number,
              applications.created_at as created_at, applications.registry_type_id as registry_type_id,
              applications.user_id as user_id, applications.foreign_token as foreign_token,
              establishing_schools.school_name as school_name, wards.WardName as WardName, regions.RegionName as RegionName,
              districts.LgaName as LgaName, registry_types.registry as registry
        FROM school_sub_categories, establishing_schools, applications, registration_structures, wards, districts, school_categories, languages, registry_types,
              regions 
        WHERE school_sub_categories.id = establishing_schools.school_sub_category_id AND languages.id = establishing_schools.language_id AND
              school_categories.id = establishing_schools.school_category_id AND regions.RegionCode = districts.RegionCode AND
              districts.LgaCode = wards.LgaCode AND wards.WardCode = establishing_schools.ward_id
              AND establishing_schools.tracking_number = applications.tracking_number AND
              registry_types.id = applications.registry_type_id AND registration_structures.id = establishing_schools.registration_structure_id AND application_category_id = ? AND applications.tracking_number = ?`,
      [1, trackingNumber],
      function (error, obj) {
        if (error) {
          console.log(error);
        }
        db.query(
          "select * from maoni WHERE trackingNo = ?",
          [trackingNumber],
          function (error, objMess) {
            db.query(
              `SELECT vyeo.id as vyeoId, staffs.id as userId, email, user_level, last_login,
                      staffs.name as name, phone_no, vyeo.rank_name as role_name 
               FROM staffs, vyeo
               WHERE user_status = ? AND vyeo.id = staffs.user_level
                      AND staffs.user_level IN (?, ?) #AND staffs.office = ?`,
              [1, 3, 5],
              function (error, objStaffs) {
                if (error) {
                  console.log(error);
                }

                db.query(
                  `SELECT * from application_statuses`,
                  function (error, objApps) {
                    if (error) {
                      console.log(error);
                    }

                    db.query(
                      `SELECT name, user_from, user_to, coments, maoni.created_at as created_at, rank_name
                        FROM maoni, staffs, vyeo WHERE staffs.id = maoni.user_from AND vyeo.id = staffs.user_level
                        AND trackingNo = ? ORDER BY maoni.id DESC`,
                      [trackingNumber],
                      function (error, objMaoni) {
                        if (error) {
                          console.log(error);
                        }
                        db.query(
                          `SELECT attachment_types.id as id, file_size, file_format, attachment_name
                           FROM attachment_types`,
                          function (error, objAttachment) {
                            if (error) {
                              console.log(error);
                            }
                            db.query(
                              `SELECT attachment_types.id as id, file_size, file_format,
                                      attachment_name, attachments.created_at as created_at, attachment_path
                                      FROM attachment_types,
                                      attachments WHERE attachments.attachment_type_id = attachment_types.id AND
                                      attachments.tracking_number = ?`,
                              [trackingNumber],
                              function (error1, objAttachment1) {
                                if (error1) {
                                  console.log(error1);
                                }

                                db.query(
                                  `SELECT * 
                                   FROM personal_infos, applications, wards, districts, regions
                                   WHERE districts.RegionCode = regions.RegionCode AND wards.LgaCode = districts.LgaCode AND 
                                        wards.WardCode = personal_infos.ward_id
                                        AND applications.foreign_token = personal_infos.secure_token 
                                        AND applications.tracking_number = ?`,
                                  [trackingNumber],
                                  function (error1, obj1) {
                                    if (error1) {
                                      console.log(error1);
                                    }
                                    // console.log(trackingNumber)
                                    // var first_name = results1[0].first_name;
                                    // var middle_name = results1[0].middle_name;
                                    // var last_name = results1[0].last_name;
                                    // var occupation = results1[0].occupation;
                                    // var personal_address = results1[0].personal_address;
                                    // var personal_phone_number = results1[0].personal_phone_number;
                                    // var personal_email = results1[0].personal_email;
                                    // var WardNameMtu = results1[0].WardName;
                                    // var LgaNameMtu = results1[0].LgaName;
                                    // var RegionNameMtu = results1[0].RegionName;
                                    // var fullname = first_name + " middle_name + "+ last_name;
                                    // obj.push({
                                    //   tracking_number: tracking_number,
                                    //   school_name: school_name,
                                    //   LgaName: LgaName,
                                    //   RegionName: RegionName,
                                    //   user_id: user_id,
                                    //   registry_type_id: registry_type_id,
                                    //   registry: registry,
                                    //   created_at: created_at,
                                    //   remain_days: remain_days,
                                    //   fullname: fullname,
                                    //   schoolCategory: schoolCategory,
                                    //   occupation: occupation,
                                    //   mwombajiAddress: personal_address,
                                    //   mwombajiPhoneNo: personal_phone_number,
                                    //   baruaPepe: personal_email,
                                    //   language: language,
                                    //   school_size: school_size,
                                    //   area: area,
                                    //   WardName: WardName,
                                    //   structure: structure,
                                    //   subcategory: subcategory,
                                    //   WardNameMtu: WardNameMtu,
                                    //   LgaNameMtu: LgaNameMtu,
                                    //   RegionNameMtu: RegionNameMtu,
                                    // });
                                    // objAttachment2.push({
                                    //   file_format: "",
                                    //   attachment_name: "",
                                    //   registry_id: "",
                                    //   file_size: "",
                                    //   registry: "",
                                    //   application_name: "",
                                    //   created_at: "",
                                    //   attachment_path: "",
                                    // });

                                    db.query(
                                      `select institute_infos.id as id, institute_infos.name as name, institute_infos.address as address,
                                        institute_infos.institute_phone as institute_phone, institute_infos.institute_email as institute_email
                                        from institute_infos, applications WHERE
                                        applications.foreign_token = institute_infos.secure_token AND applications.tracking_number = ?`,
                                      [trackingNumber],
                                      function (error1, results1) {
                                        if (error1) {
                                          console.log(error1);
                                        }
                                        // var instId = results1[0].id;
                                        // var name = results1[0].name;
                                        // var address = results1[0].address;
                                        // var institute_phone =
                                        //   results1[0].institute_phone;
                                        // var institute_email =
                                        //   results1[0].institute_email;
                                        // obj.push({
                                        //   tracking_number: tracking_number,
                                        //   school_name: school_name,
                                        //   LgaName: LgaName,
                                        //   RegionName: RegionName,
                                        //   user_id: user_id,
                                        //   registry_type_id: registry_type_id,
                                        //   registry: registry,
                                        //   created_at: created_at,
                                        //   remain_days: remain_days,
                                        //   fullname: name,
                                        //   occupation: "-",
                                        //   mwombajiAddress: address,
                                        //   mwombajiPhoneNo: institute_phone,
                                        //   baruaPepe: institute_email,
                                        //   language: language,
                                        //   school_size: school_size,
                                        //   area: area,
                                        //   WardName: WardName,
                                        //   structure: structure,
                                        //   subcategory: "Oldsubcategory",
                                        // });
                                        db.query(
                                          `SELECT attachment_types.id as id, file_size, file_format,
                                                  attachment_name, institute_attachments.created_at as created_at, attachment
                                          FROM attachment_types,institute_attachments 
                                          WHERE institute_attachments.institute_info_id = ?
                                          AND institute_attachments.attachment_type_id = attachment_types.id`,
                                          [1],
                                          function (error1, objAttachment2) {
                                            if (error1) {
                                              console.log(error1);
                                            }
                                            // console.log(
                                            //   "model",
                                            //   false,
                                            //   obj,
                                            //   objMess,
                                            //   objAttachment,
                                            //   objAttachment1,
                                            //   objAttachment2,
                                            //   objStaffs,
                                            //   objApps,
                                            //   objMaoni
                                            // );
                                            callback(
                                              false,
                                              obj,
                                              obj1,
                                              objMess,
                                              objAttachment,
                                              objAttachment1,
                                              objAttachment2,
                                              objStaffs,
                                              objApps,
                                              objMaoni
                                            );
                                          }
                                        );
                                      }
                                    );
                                  }
                                );
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  },
};
