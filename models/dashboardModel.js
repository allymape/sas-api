const db = require("../dbConnection");
const { arraySum, schoolLocationsSqlJoin, filterByUserOffice, selectConditionByRanks, registeredSchoolsEstablishedApplicationSqlJoin, formatDate, extractDateRange } = require("../utils");

module.exports = {
  getAllSummaries: (user, callback) => {
    const summaryCategoriesSql = `SELECT  sr.school_category_id AS id,
                                    sr.category AS category, 
                                    COUNT(*) AS total
                                FROM registered_schools_view sr
                                WHERE sr.reg_status = 1
                                ${filterByUserOffice(
                                  user,
                                  "AND",
                                  "sr.zone_id",
                                  "sr.district_code"
                                )}
                                GROUP BY category , id
                                ORDER BY id ASC`;
    db.query(summaryCategoriesSql, (error, summaryCategories) => {
      if (error) {
        console.log(error);
      }
      console.log("FIRST", formatDate(new Date()));
      db.query(
        `SELECT CASE 
            WHEN sr.registry_type_id IN (1, 2) THEN 'Non Government'  
            WHEN sr.registry_type_id = 3 THEN 'Government' 
          END AS owner, 
          COUNT(*) AS total
          FROM registered_schools_view sr
          WHERE sr.reg_status = 1
          ${filterByUserOffice(user, "AND", "sr.zone_id", "sr.district_code")}
          GROUP BY owner`,
        (error2, summaryOwners) => {
          if (error2) {
            error = error2;
            console.log(error2);
          }
          console.log("SECOND", formatDate(new Date()));
          // APPLICATIONS BASE ON APPLICATION CATEGORIES EXCEPT KUANZISHA
          db.query(
            `SELECT ac.app_name AS label, COUNT(a.application_category_id) AS total
                                  FROM application_categories ac
                                  LEFT JOIN applications a ON ac.id = a.application_category_id
                                  LEFT JOIN  establishing_schools e ON e.tracking_number = a.tracking_number
                                  LEFT JOIN owners o ON o.establishing_school_id = e.id
                                  WHERE ac.id NOT IN (1,4) 
                                  AND a.is_approved = 2
                                  GROUP BY ac.id , ac.app_name 
                                  `,
            (error3, summaryApplications) => {
              if (error3) {
                console.log(error3);
                error = error3;
              }
              console.log("THIRD", formatDate(new Date()));
              db.query(
                `SELECT rs.structure AS label,
                                COUNT(*) AS total
                                FROM registration_structures rs
                                LEFT JOIN establishing_schools e ON e.registration_structure_id = rs.id
                                LEFT JOIN applications a ON a.tracking_number = e.tracking_number
                                ${schoolLocationsSqlJoin()}
                                WHERE a.is_approved = 2 AND a.application_category_id = 1 AND a.is_complete = 1
                                ${filterByUserOffice(user, "AND")}
                                GROUP BY label
                                ORDER BY label ASC`,
                (error4, summaryStructures) => {
                  // console.log("structure: ", summaryStructures);
                  if (error4) {
                    console.log(error4);
                    error = error4;
                  }
                  console.log("FOURTH", formatDate(new Date()));
                  // Registered schools
                  db.query(
                    `SELECT COUNT(*) AS total FROM 
                    registered_schools_view sr
                    WHERE sr.reg_status = 1
                    ${filterByUserOffice(
                      user,
                      "AND",
                      "sr.zone_id",
                      "sr.district_code"
                    )}`,
                    (error5, summaryRegisteredSchools) => {
                      if (error5) {
                        console.log(error5);
                        error = error5;
                      }
                      console.log("FIRTH", formatDate(new Date()));
                      callback(
                        error,
                        summaryRegisteredSchools[0],
                        summaryCategories,
                        summaryOwners,
                        summaryApplications,
                        summaryStructures
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  },
  //******** Schools by Regions and Categories *******************************
  getSchoolByRegionsAndCategories: (user, callback) => {
    // region means label (it can be region_name , lga_name, ward_name and street_name)
    // console.log('here again' , new Date())
    db.query(
      `SELECT ${selectConditionByRanks(
        user,
        "sr"
      )} , sr.school_category_id AS category , 
                COUNT(*) AS school_count
                FROM registered_schools_view sr
                WHERE sr.reg_status = 1
                ${filterByUserOffice(
                  user,
                  "AND",
                  "sr.zone_id",
                  "sr.district_code"
                )}
                GROUP BY label , sr.school_category_id
                ORDER BY label ASC`,
      function (error, results) {
        //  console.log("Nimefika  muda huu", new Date());
        if (error) {
          console.log(error);
        }
        // Format the results
        const formattedResults = {};
        // Iterate over the query results
        results.forEach((row) => {
          const { label, category, school_count } = row;
          // Check if the region exists in the formatted results
          if (!formattedResults[label]) {
            formattedResults[label] = {
              total: 0,
              categories: { 1: 0, 2: 0, 3: 0, 4: 0 },
            };
          }

          // Update the total count for the region
          formattedResults[label].total += school_count;
          // Update the count for the category
          if (!formattedResults[label].categories[category]) {
            formattedResults[label].categories[category] = 0;
          }
          formattedResults[label].categories[category] += school_count;
        });
        // End
        // console.log(formattedResults);
        var maxValue = 0;
        var minValue = 0;
        var initial = 0;
        Object.values(formattedResults).forEach((row) => {
          // const { total } = row[i];
          initial = row.total;
          if (minValue == 0) {
            minValue = initial;
          }
          if (initial > maxValue) {
            maxValue = initial;
          }
          if (minValue > initial) {
            minValue = initial;
          }
        });
        callback(formattedResults, minValue, maxValue);
      }
    );
  },
  // Registered schools by Year of registrations trend;
  getTotalNumberOfSchoolByYearOfRegistration: (user, callback) => {
    let sql = `SELECT IFNULL(YEAR(sr.registration_date) , 'NULL') AS label , COUNT(*) as total
                FROM registered_schools_view sr
                WHERE sr.reg_status = 1
                ${filterByUserOffice(
                  user,
                  "AND",
                  "sr.zone_id",
                  "sr.district_code"
                )}
                GROUP BY label
                ORDER BY label ASC
                `;

    db.query(sql, function (error, individual) {
      if (error) {
        console.log(error);
      }
      //Cumulative total
      const cumulative = [];
      const data = [];
      individual.forEach((row) => {
        const { label, total } = row;
        data.push(total);
        cumulative.push({
          label,
          total: arraySum(data),
        });
      });
      callback(individual, cumulative);
    });
  },

  getMapData: (req, callback) => {
     const { user } = req;
     var search = false
     const {
       southWestLat,
       southWestLng,
       northEastLat,
       northEastLng,
       zoom,
       name_or_reg,
       category,
       date_range,
       ownership,
       region,
       district,
       ward,
       street
     } = req.body;
     
     var sql = `SELECT *
                  FROM school_locations_map_view
                  WHERE latitude BETWEEN ? AND ?
                  AND longitude BETWEEN ? AND ?
                  ${filterByUserOffice(
                    user,
                    "AND",
                    "zone_id",
                    "district_code"
                  )}
                  `;
    if (name_or_reg) {
      sql += ` AND (name LIKE ? OR registration_number = ?)`;
      search = true;
    }
    var between = false;
    if (date_range) {
      var { start_date, end_date } = extractDateRange(date_range);
       if(start_date && end_date){
          between = true;
         sql +=   `AND registration_date BETWEEN ? AND ?`
       }else{
          sql += `AND registration_date = ?`;
       }
    }
    if (category) {
      sql += ` AND category_id = ?`;
       search = true;
    }
    if (ownership) {
      sql += ` AND registry_type_id = ?`;
       search = true;
    }
    if (region) {
      sql += ` AND region_code = ?`;
       search = true;
    }
    if (district) {
      sql += ` AND district_code = ?`;
      search = true;
    }
    if (ward) {
      sql += ` AND ward_code = ?`;
      search = true;
    }
    if (street) {
      sql += ` AND street_code = ?`;
       search = true;
    }
    if (zoom < 6) {
      sql = sql += ` LIMIT 40`;
    }else if (zoom == 6) {
      sql = sql += ` LIMIT 100`;
    } else if (zoom > 6 && zoom < 10) {
      sql = sql += ` LIMIT 500`;
    } else {
      sql = sql += `LIMIT 2000`;
    }
    const queryParams = [
      southWestLat,
      northEastLat,
      southWestLng,
      northEastLng,
      ...(name_or_reg ? [`%${name_or_reg}%`, `${name_or_reg}`] : []),
      ...(date_range && between ? [`${start_date}`, `${end_date}`] :  (date_range ? [`${start_date}`] : [])),
      ...(category ? [category] : []),
      ...(ownership ? [ownership] : []),
      ...(region ? [region] : []),
      ...(district ? [district] : []),
      ...(ward ? [ward] : []),
      ...(street ? [street] : []),
    ];
     db.query(
       sql,
       queryParams,
       (error, data) => {
         if (error) {
           console.log(error);
         }
         console.log(data.length);
         callback(data);
       }
     );
  },
  updateMarker: (data, callback) => {
    const { tracking_number, latitude, longitude } = data;
    db.query(
      `UPDATE establishing_schools es
       JOIN school_registrations sr ON sr.establishing_school_id = es.id
       SET latitude = ?, longitude = ? 
       WHERE sr.tracking_number = ?`,
      [latitude, longitude, tracking_number],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        if(result.affectedRows > 0){
          callback(true);
        }else{
          callback(false);
        }
      }
    );
  }
};