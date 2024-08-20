const db = require("../dbConnection");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { titleCase, hash, filterByUserOffice, staffCommonJoins, formatDate, formatIp } = require("../utils");
const { lowerCase, upperCaseFirst } = require("text-case");

module.exports = {
  //******** USER LOGIN *******************************
  loginUser: (req , callback) => {
      try {
        const { username, password, clientIp, browser, device } = req.body;
        var message = "";
        //const userData = [];
        console.log(clientIp);
        db.query(
          `SELECT s.id as id, password, s.name as name, s.username as username, 
            s.phone_no as phone_no, s.user_status as user_status, s.last_login as last_login, 
            s.role_id as role_id, s.new_role_id as new_role_id, s.email as email, v.id AS section_id,
            rnk.name as ngazi, v.rank_name as sehemu, rm.role_name as jukumu,
            s.station_level as station_level, user_level, s.office as office, 
            r.id AS rank_id , r.name as rank_name,
            zone_id,zone_name,region_code,district_code, 
            v.status_id as status_id, 
            is_password_changed,
            v.id as cheo_office ,
            v.rank_level as rank_level, s.twofa as twofa 
            FROM staffs s
            INNER JOIN roles r  ON r.id = s.user_level
            INNER JOIN vyeo v ON r.vyeoId = v.id
            INNER JOIN role_management rm ON rm.id = s.new_role_id
            LEFT JOIN ranks rnk ON rnk.id = v.rank_level
            LEFT JOIN zones z ON z.id = s.zone_id
            WHERE username = ? AND user_status = 1`,
          [username],
          (error, user) => {
            if (error) {
              console.log("Query Error: " , error , user);
            }
            if (user && user.length == 1) {
              db.query(
                `SELECT permission_id , permission_name FROM permissions, permission_role WHERE permission_role.permission_id = permissions.id AND permission_role.role_id = ${user[0]["new_role_id"]}`,
                (error2, permissions) => {
                  if (error2) {
                    console.log(error2);
                  }
                  if (bcrypt.compareSync(password, user[0].password)) {
                    console.log(`User found ${username}`);
                    // console.log(permissions)
                    message = "Logged in!";
                    const login_datetime = formatDate(new Date());
                    const user_id = user[0].id;
                    db.query(
                      `UPDATE staffs SET last_login = ? WHERE id = ?`,
                      [login_datetime, user_id],
                      (err) => {
                        if (err) console.log(err);

                        db.query(
                          `INSERT INTO login_activity(staff_id , ip , device , browser , created_at , updated_at) VALUES(?)`,
                          [
                            [
                              user_id,
                              formatIp(clientIp),
                              upperCaseFirst(device),
                              browser,
                              login_datetime,
                              login_datetime,
                            ],
                          ]
                        );
                        callback(true, user, permissions, message);
                      }
                    );
                    // return;
                  } else {
                    console.log(`Compare password for username ${username}`)
                    message = "Wrong username or password.";
                    callback(false, [], [], message);
                    // return;
                  }
                }
              );
            } else {
              console.log(`Username not found ${username}`);
              message = "Wrong username or password.";
              callback(false, [], [], message);
              // return;
            }
          }
        );
      } catch (error) {
        console.log(error);
        message = "Kuna hitilafu, Wasiliana na msimamizi wa mfumo.";
        callback(false, [], [], message);
      }
  },
  //******** LIST USERS *******************************
  getUsers: (offset, per_page, searchQuery, user , callback) => {
    const tafuta = searchQuery.tafuta; 
    const tafutaQuery =
      tafuta != "undefined" && tafuta
        ? ` WHERE (s.email LIKE '%${tafuta}%' OR 
                   s.username LIKE '%${tafuta}%' OR
                   s.name LIKE '%${tafuta}%' OR
                   r.name LIKE '%${tafuta}%' OR
                   v.rank_name LIKE '%${tafuta}%' OR
                   d.LgaName LIKE '%${tafuta}%' OR
                   rg.RegionName LIKE '%${tafuta}%' OR
                   z.zone_name LIKE '%${tafuta}%'
                  )`
        : "";
    const commonSql = `FROM staffs s ${staffCommonJoins()}`;
                  //  console.log(user)
    db.query(
      `SELECT   username, s.id as userId, email, v.id as vyeoId, user_level, IFNULL(last_login , '') as last_login,
                s.name as name, phone_no, IFNULL(r.name , '') as level_name, v.rank_name AS section_name,
                IFNULL(rank_level , '') as rank_level, IFNULL(rm.role_name , '') as role_name,
                IFNULL(z.zone_name , '') as zone_name , rg.RegionName as region_name, IFNULL(d.LgaName , '') as 
                lga_name , CASE WHEN s.signature IS NOT NULL THEN 1 ELSE 0 END AS has_signature , 
                s.user_status as user_status
        ${commonSql}
        ${tafutaQuery}
        ${filterByUserOffice(user, tafuta ? " AND " : " WHERE", 's.zone_id' , 's.district_code' , ` AND s.id <> ${user.id}`)}
        LIMIT ? , ?`,
      [offset, per_page],
      (error, users) => {
        if (error) {
          console.log(error);
        }
        db.query(
          `SELECT COUNT(*) AS num_rows 
            ${commonSql} 
            ${tafutaQuery} 
            ${filterByUserOffice(user, tafuta ? " AND " : " WHERE", 's.zone_id' , 's.district_code' , ` AND s.id <> ${user.id}`)}`,
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
  // ********** USER PROFILE *************
  getMyProfile : (id , callback) =>{
       db.query(`SELECT name,username,email , email_notify,phone_no,created_at,updated_at
                FROM staffs s 
                WHERE s.id = ?` , [id] , 
      (error , user) => {
          if(error) console.log(error)
          db.query(`SELECT browser , ip , device , created_at 
                    FROM login_activity
                    WHERE staff_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT 10` , [id] , (erro2 , loginActivities) => {
                      if(erro2) console.log(erro2);
                      callback(user[0] , loginActivities);
                    })
       })
  },
  //******** FIND USER *******************************
  findUser: (userId, user, callback) => {
    var success = false;
    db.query(
      `SELECT s.id as id, s.name as name, s.username AS username, s.email AS email, s.phone_no AS phone_no,
      CONVERT(s.new_role_id , UNSIGNED INTEGER) AS jukumu, v.rank_level AS ngazi , v.id AS uongozi, r.id AS cheo,
      s.zone_id AS zone_id, s.region_code AS region_code, s.district_code AS district_code
        FROM staffs s
        LEFT JOIN roles r ON r.id = s.user_level
        LEFT JOIN vyeo v ON v.id = r.vyeoId
        WHERE s.id = ? ${filterByUserOffice(user, "AND", "s.zone_id" , 's.district_code')}`,
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
              1,
              formatDate(new Date())
            ];
            // Set signature if uploaded
            if(user.sign){ 
              userData.push(user.sign);
            }
     db.query(
      `SELECT * 
      FROM staffs 
      WHERE user_level = ? AND 
      ${userData[9] ? "zone_id=" + userData[9] : "zone_id IS NULL"} AND  user_status = 1 AND
      ${userData[11] ? "district_code='" + userData[11]+"'" : "district_code IS NULL"}`,
      [userData[3], userData[9], userData[11]],
      (err, result) => {
        if (err) console.log(err);
          if(result.length == 0){
            db.query(
              `INSERT INTO staffs(secure_token , username,email,user_level,name,phone_no,office, 
                    new_role_id, password , zone_id, region_code, district_code, user_status , created_at
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
          }else{
             callback(false, null , true);
          }
      });
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
              Number(user.levelId),
              titleCase(user.fullname),
              user.phoneNumber,
              user.lgas ? user.lgas : user.zone ? user.zone : null,
              user.roleId,
              user.zone ? user.zone : null,
              user.region ? user.region : null,
              user.lgas ? user.lgas : null,
              formatDate(new Date())
            ];
            // Set signature if uploaded
            if(user.sign){ 
              userData.push(user.sign);
            }
            userData.push(Number(userId));
    const email = userData[1];
    db.query(`SELECT id 
              FROM staffs  
              WHERE email = ? AND id <> ?` , 
    [email , Number(userId)], 
    (errorExist , emailExistResults) => {
      if(errorExist) console.log('Exist Email: ',errorExist)
      if (emailExistResults.length == 0) {
        // Npw check if cheo exists
        db.query(
          `SELECT * FROM staffs WHERE user_level = ? AND id <> ? AND 
          ${
            userData[7] ? "zone_id=" + userData[7] : "zone_id IS NULL"
          } AND  user_status = 1 AND
          ${
            userData[9]
              ? "district_code='" + userData[9] + "'"
              : "district_code IS NULL"
          } `,
          [userData[2], Number(userId)],
          (err, result) => {
            if (err) console.log(err);
            if (result.length == 0) {
              db.query(
                `UPDATE staffs SET username = ?,email=?, user_level=?, name = ?, phone_no = ?,office = ?, 
              new_role_id = ?, zone_id=?, region_code=?, district_code=?, updated_at = ?
              ${user.sign ? ", signature = ?" : ""}
              WHERE id = ?`,
                userData,
                (error, updatedUser) => {
                  if (error) {
                    console.log("error findind user: ", error);
                  }
                  var password = user.password;
                  if (password) {
                    hash(password, (hashed, hash) => {
                      if (hashed) {
                        db.query(
                          `UPDATE staffs SET password = ? WHERE id = ?`,
                          [hash, Number(userId)],
                          (errorPassword, updatedUser) => {
                            if (errorPassword) {
                              console.log("Password Error: ", errorPassword);
                            }
                            if (updatedUser) success = true;
                            callback(success, updatedUser);
                          }
                        );
                      }
                    });
                  } else {
                    if (updatedUser) success = true;
                    callback(success, updatedUser);
                  }
                }
              );
            } else {
              callback(false, null, true); //return cheo exist
            }
          }
        );
      } else {
        callback(false, null, false, true); //return email exist
      }
    })
   
  },
 
  // DISABLE USER ACCOUNT
  disableUser : (user , id , callback) => {
       var updated = false;
       db.query(`SELECT s.id AS staff_id FROM staffs s
                ${staffCommonJoins()} 
                WHERE s.id = ?
                ${filterByUserOffice(user, " AND ", 's.zone_id' , 's.district_code' , ` AND s.id <> ${user.id}`)}
                ` , [id] , (error , staff) =>{
            if(error) console.log(error);
            if(staff.length > 0){
                db.query(`UPDATE staffs s SET s.user_status = 0 WHERE s.id = ?` , [Number(id)] , (error2 , disabledStaff) => {
                   if(error2) console.log(error2);
                     if(disabledStaff.affectedRows > 0){
                        updated = true;
                     }
                     callback(updated , updated ? "Umefanikiwa kufuta akaunti hii kwa muda." : "Haujafanikiwa kuna tatizo, Wasiliana na Msimamizi wa Mfumo.")
                })
            }else{
                callback(updated , 'Hakuna mtumiaji mwenye akaunti hiyo.');
            }
       })
  },
  getStaffOfficeName : (office , user , callback) => {
    const {zone_id , district_code} = user;
      switch (office) {
        case 1:
          callback('HQ')
          break;
        case 2:
          db.query(`SELECT zone_name FROM zones 
                    WHERE id = ${zone_id}` , (error , result) => {
              if(error) console.log('unable to find user zone ' , error);
              if(result.length > 0){
                 callback(result[0].zone_name);
              }
          });
          break;
        case 3:
          db.query(`SELECT LgaName FROM districts 
                    WHERE LgaCode = "${district_code}"` , (error , result) => {
              if(error) console.log('unable to find user district ' , error);
              if(result.length > 0){
                callback(result[0].LgaName)
              }
            });
          break;
        default:
           callback(null);
          break;
      }
     
  },
  // Update my profile
  updateMyProfile : (formData , callback) => {
      db.query(`UPDATE staffs SET phone_no = ? , email_notify = ? 
                WHERE id = ?` , formData , (error , result) => {
                  if(error) console.log(error)
                  callback(result.affectedRows > 0)
                })
  },
  // change my password
  changeMyPassword : (oldpassword , newpassword , user_id , callback) => {
       db.query(`SELECT password 
                 FROM staffs
                 WHERE id = ? `, [user_id] , (error , staff) => {
                    if(error) console.log(error)
                    // check for valid password
                    if(bcrypt.compareSync(oldpassword , staff[0].password)){
                      // update password
                        hash(newpassword , (hashed , hash) => {
                              if(hashed){
                                db.query(
                                  `UPDATE staffs 
                                  SET password = ? , is_password_changed = ?
                                  WHERE id = ?`,
                                  [hash,1, user_id],
                                  (error2, result) => {
                                    if (error2) console.log(error2);
                                    const success = result.affectedRows > 0;
                                    callback(
                                      success,
                                      success
                                        ? "Umefanikiwa kubadili nywila."
                                        : "Haujafanikiwa kubadili nywila kuna tatizo."
                                    );
                                  }
                                );
                              }else{
                                callback(
                                  false,
                                  "Haujafanikiwa kubadili nywila kuna tatizo."
                                );
                              }
                        })
                    }else{
                      callback( false , `Neno la siri la sasa sio sahihi.`)
                    }
                 })
     
       }
};

