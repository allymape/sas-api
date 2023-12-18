const db = require(`../../dbConnection`);

module.exports = {
  getData: (sql_rows, sql_count, callback, parameters = []) => {
    //  console.log(is_paginated);
    db.query(`${sql_rows}`, parameters, (error, data) => {
           if (error) console.log(error);
            db.query(`${sql_count}`, (error2, result) => {
                        if (error2) error = error2;
                        callback(error, data, result[0].num_rows);
            });
    });
  },
};


// db.query(`SELECT * FROM table WHERE id = ? LIMIT ? , ?` , [ offset , id , per_page] , 
// function(error , results){
//    if(error) console.log(error); 
//     console.log(results);
// } )


