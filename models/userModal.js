const db = require("../dbConnection");
const bcrypt = require("bcryptjs");
const { titleCase, hash } = require("../utils");
const { lowerCase } = require("text-case");

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
                    }else if (user.length == 1) {
                         db.query(
                           `SELECT permission_id , permission_name FROM permissions, permission_role WHERE permission_role.permission_id = permissions.id AND permission_role.role_id = ${user[0]["new_role_id"]}`,
                           (error2, permissions, fields2) => {
                                if (bcrypt.compareSync(password, user[0].password)) {
                                    callback(user, permissions);
                                }
                          });
                    }else{
                      callback(null, null);
                    }
    
            });
            // callback(null, null);
          },
  //******** LIST USERS *******************************
  getUsers: (offset, per_page, callback) => {
    db.query(
      `SELECT vyeo.id as vyeoId, username, staffs.id as userId, email, user_level, IFNULL(last_login , '') as last_login,
                staffs.name as name, phone_no, IFNULL(vyeo.rank_name , '') as level_name, 
                IFNULL(rank_level , '') as rank_level, IFNULL(role_name , '') as role_name,
                IFNULL(zones.zone_name , '') as zone_name , regions.RegionName as region_name, IFNULL(districts.LgaName , '') as 
                lga_name , CASE WHEN staffs.signature IS NOT NULL THEN 1 ELSE 0 END AS has_signature , user_status
        FROM staffs
        LEFT JOIN vyeo ON vyeo.id = staffs.user_level
        LEFT JOIN role_management ON role_management.id = staffs.new_role_id
        LEFT JOIN zones ON zones.id = staffs.zone_id
        LEFT JOIN regions ON regions.RegionCode = staffs.region_code
        LEFT JOIN districts ON districts.LgaCode = staffs.district_code
        LIMIT ? , ?`,
      [offset, per_page],
      (error, users, fields) => {
        if (error) {
          console.log(error);
        }
        db.query(
          "SELECT COUNT(*) AS num_rows FROM staffs",
          (error2, result2, fields2) => {
            callback(error, users, result2[0].num_rows);
          }
        );
      }
    );
  },
  //******** FIND USER *******************************
  findUser: (userId, callback) => {
    var success = false;
    db.query(
      `SELECT vyeo.id as vyeoId, username, staffs.id as userId, email, user_level, last_login, 
        staffs.name as name, phone_no, vyeo.rank_name as role_name, new_role_id as role_id, 
        rank_level, zone_id, region_code, district_code
        FROM staffs,
        vyeo WHERE vyeo.id = staffs.user_level AND staffs.id = ?`,
      [Number(userId)],
      (error, user, fields) => {
        if (error) {
          console.log(error);
        }
        if (user) {
          success = true;
        }
        callback(error, success, user);
      }
    );
  },
  findUserByEmail : (email , callback) => {
    var success = false;
    db.query(`SELECT name FROM staffs WHERE email = ? and user_status = 1` , [email] , (error , user) => {
          if(error){
            console.log(error);
          }else if(user.length == 1){
            success = true;
          }
          callback(success , user);
    })
  },
  //******** UPDATE USER *******************************
  updateUser: (userId, user , callback) => {
    var success = false;
    var userData =
            [
              lowerCase(user.username),
              lowerCase(user.email),
              user.levelId,
              titleCase(user.fullname),
              user.phoneNumber,
              user.lgas ? user.lgas : user.zone ? user.zone : null,
              user.roleId,
              user.zone ? user.zone : null,
              user.region ? user.region : null,
              user.lgas ? user.lgas : null,
            ];
            // Set signature if uploaded
            if(user.sign){ 
              userData.push(user.sign);
            }
            userData.push(Number(userId));
    db.query(
      `UPDATE staffs SET username = ?,email=?, user_level=?, name = ?, phone_no = ?,office = ?, 
              new_role_id = ?, zone_id=?, region_code=?, district_code=? 
              ${user.sign ? ", signature = ?" : ""}
        WHERE id = ?`,
      userData,
      (error, updatedUser, fields) => {
        if (error) {
          console.log(error);
        }else{
          success = true;
          var password = user.password;
          if(password){
            hash(password , (hashed , hash) => {
              console.log(hash)
                  if(hashed){
                    db.query(`UPDATE staffs SET password = ? WHERE id = ?` , 
                          [hash , Number(userId)] , 
                          (errorPassword , updatedPassword) => {
                              if(errorPassword){
                                success = false;
                                error = errorPassword
                              }else{
                                 if(updatedPassword) success = true;
                              }
                          })
                  }
            });
          }
        }
        callback(error, success, updatedUser);
      }
    );
  },

};

