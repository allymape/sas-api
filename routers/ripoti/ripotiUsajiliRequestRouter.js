require("dotenv").config();
const express = require("express");
const ripotiUsajiliRequestRouter = express.Router();
const { isAuth, formatDate, auditTrail, auditMiddleware } = require("../../utils");
const sharedModel = require("../../models/sharedModel");
const schoolModel = require("../../models/schoolModel");
// List of
ripotiUsajiliRequestRouter.get("/ripoti-usajili-shule", isAuth, (req, res) => {
  const user = req.user;
  sharedModel.getSchoolCategories((categories) => {
    sharedModel.getSchoolOwnerships((ownerships) => {
      sharedModel.getRegistrationStructures((structures) => {
        sharedModel.getCertificates((certificates) => {
          sharedModel.getRegions(user, (regions) => {
            const { sehemu, zone_id, district_code } = user;
            const per_page = parseInt(req.body.per_page);
            const page = parseInt(req.body.page);
            const offset = (page - 1) * per_page; //(0 , 10, 20,30)
            const tracking_number = req.body.tracking_number;
            const date_range = req.body.date_range;
            const category = Number(req.body.category);
            const verified = Number(req.body.verified);
            const ownership = Number(req.body.ownership);
            const structure = Number(req.body.structure);
            const certificate = Number(req.body.certificate);
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
            let start_date = "";
            let end_date = "";
            if (date_range) {
              start_date = formatDate(date_range.split("to")[0], "YYYY-MM-DD");
              end_date = formatDate(date_range.split("to")[1], "YYYY-MM-DD");
            }
            let verifiedSql = "";
            if (verified) {
                verifiedSql = ` AND is_verified = ${Number(verified) == 1} `;
            }
            const from = `FROM registered_schools_view rsv
                          LEFT JOIN school_verifications sv ON rsv.tracking_number = sv.tracking_number
                          WHERE is_approved ${
                            status ? "=" + status : " IN (2,3) "
                          }
                          ${sehemu == "k1" ? "AND zone_id = " + zone_id : ""}
                          ${
                            sehemu == "w1"
                              ? "AND district_code = '" + district_code + "'"
                              : ""
                          }
                          ${
                            tracking_number
                              ? " AND (rsv.tracking_number LIKE '%" +
                                tracking_number +
                                "%' OR  rsv.school_name LIKE '%" +
                                tracking_number +
                                "%' OR rsv.registration_number LIKE '%" +
                                tracking_number +
                                "%')"
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
                        ${verifiedSql}
                        ${
                          category
                            ? " AND school_category_id = " + category
                            : ""
                        } 
                        ${
                          structure
                            ? " AND registration_structure_id = " + structure
                            : ""
                        } 
                        ${
                          certificate
                            ? " AND certificate_type_id = " + certificate
                            : ""
                        } 
                        ${
                          ownership
                            ? " AND registry_type_id = " + ownership
                            : ""
                        } 
                        ${region ? " AND region_code = '" + region + "'" : ""} 
                        ${
                          district
                            ? " AND district_code = '" + district + "'"
                            : ""
                        } 
                        ${ward ? " AND ward_code = '" + ward + "'" : ""} 
                        ${street ? " AND street_code = '" + street + "'" : ""} 
                        AND registration_number IS NOT NULL
                  `;

            const sqlRows = `SELECT rsv.tracking_number AS tracking_number,school_name, registration_number, registration_date, is_seminary,subcategory, language, gender_type, stream , category, structure, 
                            registry , region, district , ward , street , is_approved AS status, 
                            CASE WHEN is_approved=2 THEN 'Ndio'
                                 WHEN is_approved=3 THEN 'Hapana'
                                 ELSE ''
                            END AS approved,
                            approved_at,
                            is_verified,
                            registration_id,
                            sv.description AS description,
                            sv.corrected AS corrected
                     ${from} 
                     ORDER BY approved_at DESC
                     LIMIT ?, ?`;
            const sqlCount = `SELECT COUNT(*) AS num_rows ${from}`;
            sharedModel.paginate(
              sqlRows,
              sqlCount,
              (error, data, numRows) => {
                return res.send({
                  error: error ? true : false,
                  statusCode: error ? 306 : 300,
                  data: error ? error : data,
                  categories,
                  ownerships,
                  certificates,
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
});
ripotiUsajiliRequestRouter.post("/rekebisha-usajili-shule/:tracking_number",
  isAuth ,   
  auditMiddleware('school_verifications' , 'create' , 'Kurekebisha Taarifa'), 
  (req, res) => {
  const {description} = req.body
  const {id} = req.user
  const tracking_number = req.params.tracking_number
  const data = [];
        data.push(
          tracking_number,
          description,
          id,
          0,
          formatDate(new Date()),
          formatDate(new Date()),
        );
  schoolModel.ombiRekebishaShule(tracking_number, data, (success) => {
    res.send({
      statusCode: success ? 300 : 306,
      message: success
        ? "Ombi lako limewasilishwa"
        : "Imeshindikana kuwasilisha, Kuna tatizo!",
    });
   });
  });

ripotiUsajiliRequestRouter.post(
  "/thibitisha-usajili-shule/:tracking_number",
  isAuth,
  auditMiddleware('school_verifications' , 'update' , 'Kuthibitisha Taarifa'),
  (req, res) => {
    const tracking_number = req.params.tracking_number;
    schoolModel.verifySchool(tracking_number, (success) => {
      res.send({
        statusCode: success ? 300 : 306,
        message: success
          ? "Umefanikiwa kuthinitisha taarifa hizi."
          : "Imeshindikana kuthibitisha, Kuna tatizo!",
      });
    });
  }
);
module.exports = ripotiUsajiliRequestRouter;
