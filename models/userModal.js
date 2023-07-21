const db = require("../dbConnection");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { titleCase, hash } = require("../utils");
const { lowerCase } = require("text-case");

module.exports = {
  //******** USER LOGIN *******************************
  loginUser: (req , callback) => {
      const username = req.body.username;
      const password = req.body.password;
    //   const userData = [];
        db.query(
          `SELECT s.id as id, password, s.name as name, s.username as username, 
            s.phone_no as phone_no, s.user_status as user_status, s.last_login as last_login, 
            s.role_id as role_id, s.new_role_id as new_role_id, s.email as email,
            s.station_level as station_level, user_level, s.office as office, r.name as rank_name, 
            #v.status_id as status_id, 
            v.rank_level as rank_level, s.twofa as twofa 
            FROM staffs s
            INNER JOIN roles r  ON r.id = s.user_level
            INNER JOIN vyeo v ON r.vyeoId = v.id
            WHERE username = ? AND user_status = 1;`,
            [username],
                  (error, user ) => {
                    if(error){
                         console.log(error);
                    }
                    if (user.length == 1) {
                         db.query(
                           `SELECT permission_id , permission_name FROM permissions, permission_role WHERE permission_role.permission_id = permissions.id AND permission_role.role_id = ${user[0]["new_role_id"]}`,
                           (error2, permissions) => {
                                if(error2){
                                  console.log(error2);
                                }
                                if (bcrypt.compareSync(password, user[0].password)) {
                                    callback(true ,user, permissions);
                                }else{
                                  callback(false, null, null);
                                }
                          });
                    }else{
                       callback(false, null, null);
                    }
            });
          },
  //******** LIST USERS *******************************
  getUsers: (offset, per_page, searchQuery, callback) => {
    const tafuta = searchQuery.tafuta; 
    const tafutaQuery =
      tafuta != "undefined" && tafuta
        ? ` WHERE (s.email LIKE '%${tafuta}%' OR 
                   s.username LIKE '%${tafuta}%' OR
                   s.name LIKE '%${tafuta}%')`
        : "";
    const commonSql = `FROM staffs s
                   LEFT JOIN roles r ON r.id = s.user_level
                   LEFT JOIN vyeo v ON v.id = r.vyeoId
                   LEFT JOIN role_management rm ON rm.id = s.new_role_id
                   LEFT JOIN zones z ON z.id = s.zone_id
                   LEFT JOIN regions rg ON rg.RegionCode = s.region_code
                   LEFT JOIN districts d ON d.LgaCode = s.district_code`;
    db.query(
      `SELECT   username, s.id as userId, email, v.id as vyeoId, user_level, IFNULL(last_login , '') as last_login,
                s.name as name, phone_no, IFNULL(r.name , '') as level_name, 
                IFNULL(rank_level , '') as rank_level, IFNULL(rm.role_name , '') as role_name,
                IFNULL(z.zone_name , '') as zone_name , rg.RegionName as region_name, IFNULL(d.LgaName , '') as 
                lga_name , CASE WHEN s.signature IS NOT NULL THEN 1 ELSE 0 END AS has_signature , 
                s.user_status as user_status
        ${commonSql}
        ${tafutaQuery}
        LIMIT ? , ?`,
      [offset, per_page],
      (error, users) => {
        if (error) {
          console.log(error);
        }
        db.query(
          `SELECT COUNT(*) AS num_rows ${commonSql} ${tafutaQuery}`,
          (error2, result2) => {
            if (error2) {
              error = error2;
              console.log(error2);
            }
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
      `SELECT s.id as id, s.name as name, s.username AS username, s.email AS email, s.phone_no AS phone_no,
      CONVERT(s.new_role_id , UNSIGNED INTEGER) AS jukumu, v.rank_level AS ngazi , v.id AS uongozi, r.id AS cheo,
      s.zone_id AS zone_id, s.region_code AS region_code, s.district_code AS district_code
        FROM staffs s
        LEFT JOIN roles r ON r.id = s.user_level
        LEFT JOIN vyeo v ON v.id = r.vyeoId
        WHERE s.id = ?`,
      [Number(userId)],
      (error, user) => {
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
   //******** CREATE USER *******************************
  createUser: (user , callback) => {
    var success = false;
    var userData =
            [
              crypto
              .randomBytes(10)
              .toString("hex"),
              lowerCase(user.username),
              lowerCase(user.email),
              user.levelId,
              titleCase(user.fullname),
              user.phoneNumber,
              user.lgas ? user.lgas : user.zone ? user.zone : null,
              user.roleId,
              user.password,
              user.zone ? user.zone : null,
              user.region ? user.region : null,
              user.lgas ? user.lgas : null,
              1
            ];
            // Set signature if uploaded
            if(user.sign){ 
              userData.push(user.sign);
            }
    db.query(
      `INSERT INTO staffs(secure_token , username,email,user_level,name,phone_no,office, 
              new_role_id, password , zone_id, region_code, district_code, user_status 
              ${user.sign ? ",signature" : ""}) VALUES ?`,
      [[userData]],
      (error, createdUser) => {
        if (error) {
          console.log(error);
        }
        if (createdUser.affectedRows > 0) {
          success = true;
        }
        callback(success, createdUser);
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
      (error, updatedUser) => {
        if (error) {
          console.log(error);
        }
          var password = user.password;
          if(password){
            hash(password , (hashed , hash) => {
                  if(hashed){
                    db.query(`UPDATE staffs SET password = ? WHERE id = ?` , 
                          [hash , Number(userId)] , 
                          (errorPassword , updatedUser) => {
                              if(errorPassword){
                               console.log(errorPassword);
                              }
                                 if (updatedUser) success = true;
                                 callback(success, updatedUser);
                                 return;
                          })
                  }
            });
          }
          if (updatedUser) success = true;
         callback(success, updatedUser);
      }
    );
  },

};

