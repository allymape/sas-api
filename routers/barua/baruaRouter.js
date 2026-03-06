require("dotenv").config();
const express = require("express");
const db = require("../../dbConnection");
const baruaRouter = express.Router();
const {
  isAuth,
  formatDate,
  applicationView,
  permission,
} = require("../../utils");

// List of
baruaRouter.post(
  "/barua/:tracking_number",
  isAuth,
  permission("view-letters"),
  (req, res) => {
    const tracking_number = req.params.tracking_number;

    db.query(
      `SELECT application_category_id, registry_type_id, foreign_token
            FROM applications a
            WHERE a.tracking_number = ? COLLATE utf8mb4_unicode_ci AND a.is_approved = 2`,
      [tracking_number],
      (error, application) => {
        if (error) console.log(error);

        if (application.length > 0) {
          const type = req.body.type;
          const application_category = application[0].application_category_id;
          // const foreign_token = application[0].foreign_token;
          // const registry_type = application[0].registry_type_id;

          const main_table = applicationView(
            application_category == 2 && type == "meneja"
              ? 3
              : application_category
          ); //Twist category to 3 if category is 2 and type is Meneja

          console.log(main_table);

          db.query(
            `SELECT * FROM ${main_table} WHERE tracking_number = ? COLLATE utf8mb4_unicode_ci`,
            [tracking_number],
            (searchError, searchResult) => {
              if (searchError) console.log(searchError);

              if (searchResult.length > 0) {
                const registry_type = searchResult[0].registry_type_id;

                // Build the polymorphic join condition based on registry_type with COLLATE
                let applicantJoinCondition = "";
                let addressColumns =",UCASE(app.title) AS address_title,UCASE(app.display_name) AS address_name, app.box AS address_box , aav.region AS address_region";
                switch (registry_type) {
                  case 1: // Personal
                    applicantJoinCondition = `
                  LEFT JOIN personal_infos p ON p.id = app.applicantable_id COLLATE utf8mb4_unicode_ci AND app.applicantable_type = 'appModelsPersonal_info'
                `;
                    // addressColumns =
                    //   ",UCASE(app.display_name) AS address_name, app.box AS address_box , aav.region AS address_region";
                    break;

                  case 2: // Institute
                    applicantJoinCondition = `
                    LEFT JOIN institute_infos i ON i.id = app.applicantable_id COLLATE utf8mb4_unicode_ci AND app.applicantable_type = 'appModelsInstitute_info'
                    `;
                    // addressColumns =
                    //   ",UCASE(app.display_name) AS address_name , app.box AS address_box , aav.region AS address_region";
                    break;

                  case 3: // School
                //     applicantJoinCondition = `
                //   LEFT JOIN applicants app ON app.id = e.applicant_id COLLATE utf8mb4_unicode_ci
                // `;
                    // addressColumns =
                    //   ", CONCAT('Mkurugenzi' ,' ', v.district) AS address_name, aav.ded_box AS address_box, v.region AS address_region";
                    break;
                  default:
                    applicantJoinCondition = `
                    LEFT JOIN administration_areas_view aav ON aav.ward_code = e.ward_id COLLATE utf8mb4_unicode_ci
                  `;
                }

                db.query(
                  `SELECT v.* , a.application_category_id, e.file_number, e.school_folio, a.folio , 
                       s.registration_number AS registration_number , 
                       s.registration_date AS registration_date,
                       c.level AS level, e.stream AS stream,
                       u.name AS signatory,
                       aav_.zone_box AS zone_box,
                       aav_.region_box AS region_box,
                       aav_.has_zone_office AS has_zone_office,
                       aav_.district_box AS district_box,
                       aav_.ngazi_ya_wilaya AS ngazi_ya_wilaya,
                       aav_.district_sqa_box AS district_sqa_box,
                       r.description AS cheo
                       ${getExtraColumns(application_category, registry_type)}
                       ${addressColumns}
                       ,u.signature AS base64signature
               FROM ${main_table} v
               JOIN applications a ON a.tracking_number = v.tracking_number COLLATE utf8mb4_unicode_ci
               LEFT JOIN establishing_schools e ON e.id = a.establishing_school_id COLLATE utf8mb4_unicode_ci
               LEFT JOIN administration_areas_view aav_ ON aav_.street_code = v.street_code COLLATE utf8mb4_unicode_ci
               LEFT JOIN school_registrations s ON s.tracking_number = v.tracking_number COLLATE utf8mb4_unicode_ci
               LEFT JOIN certificate_types c ON c.id = e.certificate_type_id COLLATE utf8mb4_unicode_ci
               LEFT JOIN staffs u ON a.approved_by = u.id COLLATE utf8mb4_unicode_ci
               LEFT JOIN roles r ON r.id = u.user_level COLLATE utf8mb4_unicode_ci
               LEFT JOIN applicants app ON app.id = e.applicant_id COLLATE utf8mb4_unicode_ci
               LEFT JOIN administration_areas_view aav ON aav.district_code = app.lga_box_location COLLATE utf8mb4_unicode_ci
               ${applicantJoinCondition}
               WHERE v.tracking_number = ? COLLATE utf8mb4_unicode_ci AND a.folio IS NOT NULL
               LIMIT 1`,
                  [tracking_number],
                  (error2, results) => {
                    if (error2) {
                      console.log(error2);
                      return res.status(500).send({
                        error: true,
                        message: "Database error",
                        sqlError: error2,
                      });
                    }
                    const data = results.length > 0 ? results[0] : null;

                    db.query(
                      `SELECT r.RegionName AS sqa_zone_region 
                        FROM regions r
                        WHERE r.zone_id = ${
                          data ? data.zone_id : -1
                        } AND sqa_zone = 1`,
                            (error, result) => {
                              if (error) console.log(error);
                              const sqa_zone_region =
                                result.length > 0 ? result[0].sqa_zone_region : null;
                              // console.log(data);
                              res.send({
                                error: false,
                                statusCode: data ? 300 : 306,
                                data: data,
                                sqa_zone_region: sqa_zone_region,
                                message: "Success",
                              });
                            }
                          );
                  }
                );
              } else {
                res.send({
                  error: false,
                  statusCode: 306,
                  data: null,
                  message: "Not Found",
                });
              }
            }
          );
        } else {
          res.send({
            error: false,
            statusCode: 306,
            data: null,
            message: "Not Found",
          });
        }
      }
    );
  }
);

const getExtraColumns = (application_category_id, registry_type) => {
  let columns = "";

  switch (application_category_id) {
    case 4:
      columns += ", v.sharti AS masharti, gender_type";
      break;
    case 5:
      columns += ", v.old_stream AS old_stream";
      break;
    case 6:
      columns += ",v.old_category AS old_category";
      break;
    case 7:
      columns += ",owner_name";
      break;
    case 8:
      columns += ",manager_name";
      break;
    case 9:
      columns += ", v.old_school_name AS old_school_name";
      break;
    case 10:
      columns +=
        ", t_street, t_ward, t_district, t_region, t_old_region, t_old_district, t_old_ward, t_old_street";
      break;
    case 11:
      columns += "";
      break;
    case 12:
      columns += ", v.old_combinations AS combinations";
      break;
    case 13:
      columns += ", v.is_hostel AS is_hostel, v.was_hostel AS was_hostel";
      break;
    case 14:
      columns +=
        ", v.subcategory AS subcategory, v.old_subcategory AS old_subcategory";
      break;
    default:
      break;
  }
  return columns;
};

module.exports = baruaRouter;
