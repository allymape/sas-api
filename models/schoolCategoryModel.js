const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF RANKS *******************************
  getAllCategories: (offset, per_page, is_paginated, callback) => {
    //  console.log(is_paginated);
    db.query(
      `SELECT category AS name , id
        FROM school_categories  
        ORDER BY id ASC ${
        is_paginated ? " LIMIT ?,?" : ""
      }`,
      is_paginated ? [offset, per_page] : [],
      (error, categories) => {
        if(error) console.log(error)
        db.query(
          "SELECT COUNT(*) AS num_rows FROM school_categories",
          (error2, result) => {
            if(error2) console.log(error2)
            callback(error, categories, result[0].num_rows);
          }
        );
      }
    );
  },
  
  
};
