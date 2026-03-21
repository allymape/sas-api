require("dotenv").config();
const express = require("express");
const ripotiWamilikiChangeRequestRouter = express.Router();
const { isAuth, formatDate } = require("../../utils");
const sharedModel = require("../../models/sharedModel");


// List of
ripotiWamilikiChangeRequestRouter.get("/ripoti-badili-umiliki", isAuth, (req, res) => {
	  const user = req.user;
	  const source = req.method === "GET" ? (req.query || {}) : (req.body || {});
	  sharedModel.getSchoolCategories((categories) => {
	    sharedModel.getSchoolOwnerships((ownerships) => {
	      sharedModel.getRegistrationStructures((structures) => {
	        sharedModel.getRegions(user , (regions) => {
	          const {sehemu , zone_id , district_code} = user;
	          const per_page_raw = Number.parseInt(source.per_page, 10);
	          const per_page = Number.isFinite(per_page_raw) && per_page_raw > 0 ? per_page_raw : 10;
	          const page_raw = Number.parseInt(source.page, 10);
	          const page = Number.isFinite(page_raw) && page_raw > 0 ? page_raw : 1;
	          const offset = (page - 1) * per_page; //(0 , 10, 20,30)
	          const tracking_number = source.tracking_number;
	          const date_range = source.date_range;
	          const category = Number(source.category) || 0;
	          const ownership = Number(source.ownership) || 0;
	          const structure = Number(source.structure) || 0;
	          const region = source.region;
	          const district = source.district;
	          const ward = source.ward;
	          const street = source.street;
	          
	          const status =
	            source.status == "rejected"
	              ? 3
	              : source.status == "approved"
	              ? 2
	              : "";
          //  console.log(formatDate(date_range.split("to")[1], "YYYY-MM-DD"));
          let start_date = "";
          let end_date = "";
          if (date_range) {
            start_date = formatDate(date_range.split("to")[0], "YYYY-MM-DD");
            end_date = formatDate(date_range.split("to")[1], "YYYY-MM-DD");
          }

	          const ownersChangeFrom = `
              FROM (
                SELECT
                  a.tracking_number AS tracking_number,
                  ac.app_name AS app_name,
                  a.user_id AS user_id,
                  a.staff_id AS staff_id,
                  a.created_at AS created_at,
                  a.payment_status_id AS payment_status_id,
                  fo.owner_name AS old_owner_name,
                  o.owner_name AS owner_name,
                  e.school_name AS school_name,
                  sc.category AS category,
                  e.school_category_id AS school_category_id,
                  e.id AS school_id,
                  a.registry_type_id AS registry_type_id,
                  e.registration_structure_id AS registration_structure_id,
                  rs.structure AS structure,
                  rt.registry AS registry,
                  r.RegionName AS region,
                  d.LgaName AS district,
                  w.WardName AS ward,
                  st.StreetName AS street,
                  a.is_approved AS is_approved,
                  a.approved_at AS approved_at,
                  r.RegionCode AS region_code,
                  d.LgaCode AS district_code,
                  w.WardCode AS ward_code,
                  st.StreetCode AS street_code,
                  r.zone_id AS zone_id,
                  z.zone_name AS zone_name
                FROM applications a
                  JOIN former_owners fo ON fo.tracking_number = a.tracking_number
                  JOIN establishing_schools e ON e.id = fo.establishing_school_id
                  JOIN owners o ON o.establishing_school_id = e.id
                  JOIN wards w ON w.WardCode = e.ward_id
                  JOIN streets st ON st.StreetCode = e.village_id AND st.WardCode = w.WardCode
                  JOIN districts d ON d.LgaCode = w.LgaCode
                  JOIN regions r ON r.RegionCode = d.RegionCode
                  LEFT JOIN zones z ON z.id = r.zone_id
                  LEFT JOIN school_categories sc ON sc.id = e.school_category_id
                  LEFT JOIN registration_structures rs ON rs.id = e.registration_structure_id
                  LEFT JOIN registry_types rt ON rt.id = a.registry_type_id
                  JOIN application_categories ac ON ac.id = a.application_category_id
                WHERE a.application_category_id = 7
              ) owners_change_view
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

	          const sqlRows = `SELECT tracking_number AS tracking_number , old_owner_name, owner_name, school_name , category, structure, 
	                            registry , region, district , ward , street , is_approved AS status, 
	                            CASE WHEN is_approved=2 THEN 'Ndio'
	                                 WHEN is_approved=3 THEN 'Hapana'
	                                 ELSE ''
	                            END AS approved,
	                            approved_at
	                     ${ownersChangeFrom} 
	                     ORDER BY school_name DESC
	                     LIMIT ?, ?`;
	          const sqlCount = `SELECT COUNT(*) AS num_rows ${ownersChangeFrom}`;
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
	                  : "Ripoti ya kubadili umiliki wa shule.",
	              });
	            },
	            [offset, per_page]
	          );
        });
      });
    });
  });
});

module.exports = ripotiWamilikiChangeRequestRouter;
