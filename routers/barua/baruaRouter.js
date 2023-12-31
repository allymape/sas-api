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
                       console.log(registry_type)
                        const main_table = applicationView(application_category == 2 && type == 'meneja' ? 3 : application_category) //Twist category to 3 if category is 2 and type is Meneja
                         db.query(
                           `SELECT v.* , application_category_id, file_number, school_folio, folio , 
                                         s.registration_number AS registration_number , 
                                         s.registration_date AS registration_date,
                                         c.level AS level
                                   ${
                                     registry_type == 1
                                       ? ",CONCAT(p.first_name , ' ', p.middle_name , ' ', p.last_name ) AS address_name, personal_address AS address_box "
                                       : registry_type == 2
                                       ? ",i.name AS address_name , institute_address AS address_box"
                                       : ""
                                   }
                                   FROM ${main_table} v
                                   JOIN applications a ON a.tracking_number = v.tracking_number
                                   JOIN establishing_schools e ON  e.id = v.school_id
                                   LEFT JOIN school_registrations s ON s.establishing_school_id = e.id
                                   LEFT JOIN certificate_types c on c.id = e.certificate_type_id
                                   ${
                                     registry_type == 1
                                       ? "LEFT JOIN personal_infos p ON p.secure_token = a.foreign_token"
                                       : registry_type == 2
                                       ? "LEFT JOIN institute_infos i ON i.secure_token = a.foreign_token"
                                       : ""
                                   }
                                   WHERE v.tracking_number = ? #AND a.folio IS NOT NULL`,
                           [tracking_number],
                           (error2, results) => {
                             if (error2) console.log(error2);
                             const data =
                               results.length > 0 ? results[0] : null;
                             res.send({
                               error: false,
                               statusCode: data ? 300 : 306,
                               data: data,
                               message: "Success",
                             });
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

module.exports = baruaRouter;
