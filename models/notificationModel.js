const db = require("../dbConnection");
const {
  schoolLocationsSqlJoin,
  notificationArrayData,
  selectConditionByTitle,
  formatDate,
} = require("../utils");
const sharedModel = require("./sharedModel");

module.exports = {
  //******** GET ALL MY NOTIFICATIONS *******************************
  getNotifications: (user, callback) => {
    //    count all my notifications
    const selectSql = `SELECT a.tracking_number AS tracking_number, app_name AS task, e.registry_type_id AS registry_type_id , application_category_id , 
                              e.school_name AS school_name, IFNULL(m.created_at , a.created_at) AS created_at, 
                              m.coments AS comments, u.name AS staff_name , rl.name AS title`;
    const sqlfrom = `FROM applications a`;
    const commonJoin = `JOIN application_categories ac ON ac.id = a.application_category_id
                        LEFT JOIN (SELECT trackingNo, coments, user_from , created_at
                                   FROM maoni m2
                                   WHERE user_to = ${ Number(user.id) } 
                                   ORDER BY id DESC LIMIT 1) AS m
                              ON a.tracking_number = m.trackingNo
                        LEFT JOIN staffs u ON u.id = m.user_from 
                        LEFT JOIN roles rl ON rl.id = u.user_level
                        ${ schoolLocationsSqlJoin() }
                        `;

    const sqlWhere = `WHERE  a.payment_status_id = 2 AND is_approved IN (1,0)  ${selectConditionByTitle(user, true , true)} `;
    //  console.log(selectConditionByTitle(user, true, true));
    let data = [];
    // Kuanzisha
    db.query(
      `${selectSql}
       ${sqlfrom} 
       JOIN establishing_schools e ON e.tracking_number = a.tracking_number
       ${commonJoin} 
       ${sqlWhere}
       AND a.application_category_id = 1 AND is_complete = 1
      `,
      (error, kuanzisha) => {
        if (error) console.log(error);
        notificationArrayData(kuanzisha, (x) => {
          data = data.concat(x);
          // Umiliki na Umeneja
          db.query(
            `${selectSql} 
                    ${sqlfrom} 
                    JOIN owners o ON o.tracking_number = a.tracking_number
                    JOIN establishing_schools e ON e.id = o.establishing_school_id
                    ${commonJoin} 
                    ${sqlWhere} AND a.application_category_id = 2`,
            (error, umilikiUmeneja) => {
              if (error) console.log(error);
              notificationArrayData(umilikiUmeneja, (x) => {
                data = data.concat(x);
                // Kusajili shule
                db.query(
                  `${selectSql} 
                    ${sqlfrom} 
                    JOIN school_registrations s ON s.tracking_number = a.tracking_number
                    JOIN establishing_schools e ON e.id = s.establishing_school_id
                    ${commonJoin} 
                    ${sqlWhere}
                    AND a.application_category_id = 4 AND is_complete = 1`,
                  (error, kusajili) => {
                    if (error) console.log(error);
                    notificationArrayData(kusajili, (x) => {
                      data = data.concat(x);
                      const schoolInfoSql = `${selectSql} 
                        ${sqlfrom} 
                        JOIN former_school_infos fsi ON fsi.tracking_number = a.tracking_number
                        JOIN establishing_schools e ON e.id = fsi.establishing_school_id
                        ${commonJoin} 
                        ${sqlWhere}
                        `;
                        // console.log(schoolInfoSql);
                      //multiple categories  5,6,9,10,11,13,14
                      sharedModel.sqlQuerySchoolInfo(
                        schoolInfoSql,
                        null,
                        (results) => {
                          notificationArrayData(results, (x) => {
                            data = data.concat(x);
                            // Kubadili umiliki
                            db.query(
                              `${selectSql} 
                                    ${sqlfrom} 
                                    JOIN former_owners fo ON fo.tracking_number = a.tracking_number
                                    JOIN establishing_schools e ON e.id = fo.establishing_school_id
                                    ${commonJoin} 
                                    ${sqlWhere}
                                    AND a.application_category_id = 7`,
                              (error, badili_mmiliki) => {
                                if (error) console.log(error);
                                notificationArrayData(badili_mmiliki, (x) => {
                                  data = data.concat(x);
                                  // Kubadili Meneja
                                  db.query(
                                    `${selectSql} 
                                    ${sqlfrom} 
                                    JOIN former_managers fm ON fm.tracking_number = a.tracking_number
                                    JOIN establishing_schools e ON e.id = fm.establishing_school_id
                                    ${commonJoin} 
                                    ${sqlWhere}
                                    AND a.application_category_id = 8`,
                                    (error, badili_meneja) => {
                                      if (error) console.log(error);
                                      notificationArrayData(
                                        badili_meneja,
                                        (x) => {
                                          data = data.concat(x);
                                          // Kuongeza tahasusi
                                          db.query(
                                            `${selectSql} 
                                            ${sqlfrom} 
                                            JOIN former_school_combinations fsi ON fsi.tracking_number = a.tracking_number
                                            JOIN establishing_schools e ON e.id = fsi.establishing_school_id
                                            ${commonJoin} 
                                            ${sqlWhere}
                                            AND a.application_category_id = 12`,
                                            (error, tahasusi) => {
                                              if (error) console.log(error);
                                              notificationArrayData(
                                                tahasusi,
                                                (x) => {
                                                  data = data.concat(x);
                                                  // Sort latest
                                                  const sortedDataDesc = data.sort(
                                                    (objA, objB) =>
                                                      Number(new Date(objB.created_at)) -
                                                      Number(new Date(objA.created_at))
                                                  );
                                                  callback(sortedDataDesc, data.length);
                                                }
                                              );
                                            }
                                          );
                                        }
                                      );
                                    }
                                  );
                                });
                              }
                            );
                          });
                        }
                      );
                    });
                  }
                );
              });
            }
          );
        });
      }
    );
  },
};
