const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF ZONES *******************************
  getAllAlgorithms: (offset, per_page, is_paginated, callback) => {
    //  console.log(is_paginated);
    db.query(
      `SELECT a.id AS id , s.category AS category, a.school_type AS code, a.last_number AS last_number
       FROM algorthm a
       INNER JOIN school_categories s ON s.id = a.id 
       ORDER BY a.id ASC ${is_paginated ? " LIMIT ?,?" : ""}`,
      is_paginated ? [offset, per_page] : [],
      (error, algorthms) => {
        db.query(
          "SELECT COUNT(*) AS num_rows FROM algorthm",
          (error2, result, fields2) => {
            callback(error, algorthms, result[0].num_rows);
          }
        );
      }
    );
  },
  //******** STORE ZONE *******************************
  storeAlgorithm: (callback) => {
    var success = false;
    db.query(`SELECT id , code FROM school_categories` , (error , results) => {
        if(error) console.log(error)
        var data = [];
        for (let i = 0; i < results.length; i++) {
            const element = results[i];
            db.query(
              `SELECT substring_index(s.registration_number , '.', 1) AS registration_code,
		                    substring_index(s.registration_number , '.', -1) AS registration_number
                FROM school_registrations s
                WHERE  s.registration_number LIKE "%${element.code}%" 
                ORDER BY length(s.registration_number) DESC , s.registration_number DESC 
                LIMIT 1`,
              (error, result2) => {
                if (error) console.log(error);
                var values = [];
                if (result2.length > 0) {
                  values.push(
                    element.id,
                    element.code,
                    parseInt(result2[0].registration_number) + 1
                  );
                } else {
                  values.push(element.id, element.code, 1);
                }
                db.query(
                  `INSERT INTO algorthm (id , school_type , last_number) 
                          VALUES ? ON DUPLICATE KEY UPDATE last_number = VALUES(last_number)`,
                  [[values]],
                  (error, result) => {
                    if (error) {
                      console.log("Error", error);
                    }
                    if (result.affectedRows > 0) {
                      success = true;
                    }
                    data.push("adjjadjajdajdjjajdjajd")
                  }
                );
              }
            );
        }
            
  
        callback(data)
    })
    
  },
  //******** FIND ZONE *******************************
  findAlgorithm: (id, callback) => {
    var success = false;
    db.query(
      `SELECT id ,school_type, last_number FROM algorthm WHERE id = ?`,
      [id],
      (error, algorthm) => {
        if (error) {
          console.log("Error", err);
        }
        if (algorthm) {
          success = true;
        }
        callback(error, success, algorthm);
      }
    );
  },

  //******** UPDATE ZONE *******************************
  updateAlgorithm: (id , last_number, callback) => {
    var success = false;
    db.query(`SELECT last_number FROM algorthm WHERE id = ?` , [id] , (err , res) => {
        if(err) console.log(err)
        if(res.length > 0){
            if (Number(last_number) >= res[0].last_number) {
                db.query(
                  `UPDATE  algorthm SET  last_number = ?  WHERE id = ?`,
                  [last_number , id],
                  (error, algorthm) => {
                    if (error) {
                      console.log("Error", error);
                    }
                    if (algorthm) {
                      success = true;
                    }
                    callback(error, success, algorthm);
                  }
                );
            }else{
                callback(false , false , null , true)
            }
        }
    })
    
  },

  //******** DELETE ZONE *******************************
  deleteAlgorithm: (id, callback) => {
    var success = false;
          db.query(
            `DELETE FROM algorthm WHERE id = ?`,
            [id],
            (error, deletedAlgorthm) => {
              if (error) {
                console.log(error);
              }
              if (deletedAlgorthm.affectedRows > 0) {
                success = true;
              }
              callback(error, success, deletedAlgorthm);
            }
          );
  },
};
