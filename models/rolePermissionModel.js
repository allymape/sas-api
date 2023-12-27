const db = require("../dbConnection");

module.exports = {
  syncRolePermission : (permission_role, callback) => {
    var success = false;
    db.query(`DELETE FROM permission_role`, (error, result) => {
      if (error) {
        console.log(error);
      }
      db.query(
        `INSERT INTO permission_role (role_id , permission_id , status_id , created_at, created_by) 
         VALUES ? 
         `,
        [permission_role],
        (error2, result2) => {
          if (error2) {
            error = error2;
            console.log("Sync role permission: ", error2);
          }
          if (result2.affectedRows > 0) {
            success = true;
          }
          callback(error, success, result);
        }
      );
    });
  },
};
