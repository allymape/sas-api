require("dotenv").config();
const express = require("express");
const db = require("../../dbConnection");
const request = require("request");
const ripotiMenejaChangeRequestRouter = express.Router();
const model = require("../../models/maombi/anzishaShuleRequestModel");
const dateandtime = require("date-and-time");
var session = require("express-session");
const { isAuth, formatDate } = require("../../utils");
const sharedModel = require("../../models/sharedModel");


// List of
ripotiMenejaChangeRequestRouter.get("/ripoti-badili-meneja", isAuth, (req, res) => {
  const user = req.user;
  sharedModel.getSchoolCategories((categories) => {
    sharedModel.getSchoolOwnerships((ownerships) => {
      sharedModel.getRegistrationStructures((structures) => {
        sharedModel.getRegions(user , (regions) => {
          const {sehemu , zone_id , district_code} = user;
          const per_page = parseInt(req.body.per_page);
          const page = parseInt(req.body.page);
          const offset = (page - 1) * per_page; //(0 , 10, 20,30)
          const tracking_number = req.body.tracking_number;
          const date_range = req.body.date_range;
          const category = Number(req.body.category);
          const ownership = Number(req.body.ownership);
          const structure = Number(req.body.structure);
          const region = req.body.region;
          const district = req.body.district;
          const ward = req.body.ward;
          const street = req.body.street;
          
          const status =
            req.body.status == "rejected"
              ? 3
              : req.body.status == "approved"
              ? 2
              : "";
          //  console.log(formatDate(date_range.split("to")[1], "YYYY-MM-DD"));
          let start_date = "";
          let end_date = "";
          if (date_range) {
            start_date = formatDate(date_range.split("to")[0], "YYYY-MM-DD");
            end_date = formatDate(date_range.split("to")[1], "YYYY-MM-DD");
          }

          const from = `FROM managers_change_view
                        WHERE is_approved ${status ? "=" + status : " IN (2,3) "}
                        ${ sehemu == "k1" ? "AND zone_id = " + zone_id : ""}
                        ${ sehemu == "w1" ? "AND district_code = '" + district_code+"'" : ""}
                        ${
                          tracking_number
                            ? " AND tracking_number LIKE '%" + tracking_number + "%'"
                            : ""
                        } 
                        ${
                          start_date && end_date
                            ? " AND DATE(approved_at) BETWEEN '" +
                              start_date +
                              "' AND '" +
                              end_date +
                              "'"
                            : ""
                        }
                        ${category ? " AND school_category_id = " + category : ""} 
                        ${
                          structure
                            ? " AND registration_structure_id = " + structure
                            : ""
                        } 
                        ${ ownership ? " AND registry_type_id = " + ownership : ""} 
                        ${ region ? " AND region_code = '" + region + "'" : ""} 
                        ${ district ? " AND district_code = '" + district +"'" : ""} 
                        ${ ward ? " AND ward_code = '" + ward + "'" : ""} 
                        ${ street ? " AND street_code = '" + street + "'" : ""} 
                  `;

          const sqlRows = `SELECT tracking_number AS tracking_number , manager_name, school_name , category, structure, 
                            registry , region, district , ward , street , is_approved AS status, 
                            CASE WHEN is_approved=2 THEN 'Ndio'
                                 WHEN is_approved=3 THEN 'Hapana'
                                 ELSE ''
                            END AS approved,
                            approved_at
                     ${from} 
                     ORDER BY approved_at DESC
                     LIMIT ?, ?`;
          const sqlCount = `SELECT COUNT(*) AS num_rows ${from}`;
          sharedModel.paginate(
            sqlRows,
            sqlCount,
            (error, data, numRows) => {
              // console.log(numRows , data)
              return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? error : data,
                categories,
                ownerships,
                structures,
                regions,
                numRows: numRows,
                message: error
                  ? "Something went wrong."
                  : "Ripoti ya kuanzisha shule.",
              });
            },
            [offset, per_page]
          );
        });
      });
    });
  });
});

module.exports = ripotiMenejaChangeRequestRouter;
