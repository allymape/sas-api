const db = require("../dbConnection");
const bcrypt = require("bcryptjs");

module.exports = {
  //******** USER LOGIN *******************************
  loginUser: (req , callback) => {
      const username = req.body.username;
      const password = req.body.password;
    //   const userData = [];
        db.query(
          `SELECT staffs.id as id, password, staffs.name as name, staffs.username as username, staffs.phone_no as phone_no, staffs.user_status as user_status, staffs.last_login as last_login, staffs.role_id as role_id, staffs.new_role_id as new_role_id, staffs.email as email,staffs.station_level as station_level, user_level, staffs.office as office, vyeo.rank_name as rank_name, vyeo.status_id as status_id, vyeo.rank_level as rank_level, twofa 
            FROM staffs, vyeo 
            WHERE staffs.user_level = vyeo.id AND 
            username = ${db.escape(username)} AND user_status = 1;`,
                  (error, user , fields) => {
                    if(error){
                         callback(null , null);
                         return;
                    }
                    if (user) {
                         db.query(
                           `SELECT permission_id , permission_name FROM permissions, permission_role WHERE permission_role.permission_id = permissions.id AND permission_role.role_id = ${user[0]["new_role_id"]}`,
                           (error2, permissions, fields2) => {
                                if (bcrypt.compareSync(password, user[0].password)) {
                                    callback(user, permissions);
                                    return;
                                }
                             });
                    }else{
                        callback(null, null);
                        return;
                    }
            });
            // callback(null, null);
          },
  //******** STORE WARDS *******************************
};

