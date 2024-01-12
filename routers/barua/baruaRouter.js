require("dotenv").config();
const express = require("express");
const db = require("../../dbConnection");
const baruaRouter = express.Router();
const { isAuth, formatDate, applicationView } = require("../../utils");


// List of
baruaRouter.post("/barua/:tracking_number",isAuth, (req, res) => {
      const tracking_number = req.params.tracking_number;
      db.query(`SELECT application_category_id, registry_type_id
                FROM applications a
                WHERE a.tracking_number = ? AND a.is_approved = 2` , [tracking_number] , (error , application) => {
                    if(error) console.log(error)
                    if(application.length > 0){
                        const type = req.body.type;
                        const application_category = application[0].application_category_id
                       const registry_type = application[0].registry_type_id
                      //  console.log(registry_type)
                        const main_table = applicationView(application_category == 2 && type == 'meneja' ? 3 : application_category) //Twist category to 3 if category is 2 and type is Meneja
                     
                        db.query(
                          `SELECT v.* , application_category_id, file_number, school_folio, folio , 
                                         s.registration_number AS registration_number , 
                                         s.registration_date AS registration_date,
                                         c.level AS level, e.stream AS stream,
                                         u.name AS signatory,
                                         aav_.zone_box AS zone_box,
                                         aav_.region_box AS region_box,
                                         aav_.has_zone_office AS has_zone_office,
                                         aav_.district_box AS district_box,
                                         aav_.district_sqa_box AS district_sqa_box,
                                         r.description AS cheo
                                   ${getExtraColumns(
                                     application_category,
                                     registry_type
                                   )}
                                   ,u.signature AS base64signature
                                   FROM ${main_table} v
                                   JOIN applications a ON a.tracking_number = v.tracking_number
                                   JOIN establishing_schools e ON  e.id = v.school_id
                                   JOIN administration_areas_view aav_ ON aav_.street_code = v.street_code
                                   LEFT JOIN school_registrations s ON s.establishing_school_id = e.id
                                   LEFT JOIN certificate_types c on c.id = e.certificate_type_id
                                   JOIN staffs u ON a.approved_by = u.id 
                                   JOIN roles r ON r.id = u.user_level
                                   ${
                                     registry_type == 1
                                       ? `LEFT JOIN personal_infos p ON p.secure_token = a.foreign_token
                                          LEFT JOIN administration_areas_view aav ON aav.ward_code = p.ward_id`
                                       : registry_type == 2
                                       ? `LEFT JOIN institute_infos i ON i.secure_token = a.foreign_token
                                          LEFT JOIN administration_areas_view aav ON aav.ward_code = i.ward_id`
                                       : ""
                                   }
                                   WHERE v.tracking_number = ? #AND a.folio IS NOT NULL`,
                          [tracking_number],
                          (error2, results) => {
                            if (error2) console.log(error2);
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
                                  result.length > 0
                                    ? result[0].sqa_zone_region
                                    : null;
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
                    }else{
                        res.send({
                            error : false,
                            statusCode : 306,
                            data : null,
                            message : 'Not Found'
                        });
                    }
                })
  }
);

const getExtraColumns  = (application_category_id , registry_type) => {
  // address
  let columns =
    registry_type == 1
      ? ",CONCAT(p.first_name , ' ', p.middle_name , ' ', p.last_name ) AS address_name, p.personal_address AS address_box , aav.region AS address_region "
      : registry_type == 2
      ? ",i.name AS address_name , i.box AS address_box , aav.region AS address_region"
      : ", 'Mkurugenzi' AS address_name , v.region AS address_region";

  switch (application_category_id) {
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
      columns += ", v.old_region, old_district, old_ward, old_street";
      break;
    case 11:
      columns += "";
      break;
    case 12:
      columns += ", v.old_combinations AS old_combinations";
      break;
    case 13:
      columns += ", v.is_hostel AS is_hostel, v.was_hostel AS was_hostel";
      break;
    case 14:
      columns +=", v.subcategory AS subcategory, v.old_subcategory AS old_subcategory";
      break;
    default:
      break;
  }
  return columns; 
}

module.exports = baruaRouter;
