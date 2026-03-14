const db = require("../config/database");

module.exports = {
  
  createHandover: (id , data, callback) => {
    var success = false;
    db.query(`UPDATE handover SET active = false WHERE handover_by = ${id}` , (err) => {
        if(err) console.log(err)
         db.query(
           `INSERT INTO handover (staff_id  , handover_by, start , end , reason , created_at , updated_at) VALUES (?)`,
           [data],
           (error, result) => {
             if (error) {
               console.log("Error", error);
             }
             success = result.affectedRows > 0;
             callback(success);
           }
         );
    })
   
  },
  
};
