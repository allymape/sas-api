const db = require("../config/database");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
  titleCase,
  hash,
  filterByUserOffice,
  staffCommonJoins,
  formatDate,
  formatIp,
} = require("../utils");
const { lowerCase, upperCaseFirst } = require("text-case");

module.exports = {
  //******** USER LOGIN *******************************
  loginUser: (req, callback) => {
    try {
      const { username, password, clientIp, browser, device } = req.body;
      var message = "";
      //const userData = [];
      // console.log(clientIp);
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
            WHERE email = ? AND user_status = 1`,
        [username],
        (error, user) => {
          if (error) {
            console.log("Query Error: ", error, user);
          }else{
            if (user && user.length == 1) {
              db.query(
                `SELECT permission_id , permission_name FROM permissions, permission_role WHERE permission_role.permission_id = permissions.id AND permission_role.role_id = ${user[0]["new_role_id"]}`,
                (error2, permissions) => {
                  if (error2) {
                    console.log(error2);
                     message = "Kuna tatizo, wasiliana na msimamizi wa mfumo.";
                     callback(false, [], [], message);
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
                    console.log(`Compare password for username ${username}`);
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
        }
      );
    } catch (error) {
      console.log(error);
      message = "Kuna hitilafu, Wasiliana na msimamizi wa mfumo...";
      callback(false, [], [], message);
    }
  },
  //******** LIST USERS *******************************
  getUsers: (offset, per_page, search_value, user, inactive, unit_id, callback) => {
    const isInactive =
      inactive === true ||
      inactive === "true" ||
      inactive === 1 ||
      inactive === "1";
    const statusFilter = isInactive
      ? " AND s.user_status = 0"
      : " AND s.user_status = 1";
    const unitId = Number.parseInt(unit_id, 10);
    const hasUnitFilter = Number.isInteger(unitId) && unitId > 0;
    const unitFilter = hasUnitFilter ? " AND v.id = ?" : "";

    var searchQuery = "";
    var queryParams = [];
    if (search_value) {
      searchQuery += ` AND (s.email LIKE ? OR 
                            s.username LIKE ? OR
                            s.name LIKE ? OR
                            r.name LIKE ? OR
                            v.rank_name LIKE ? OR
                            d.LgaName LIKE ? OR
                            rg.RegionName LIKE ? OR
                            z.zone_name LIKE ? OR
                            s.phone_no LIKE ?
                          )`;
      queryParams.push(
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`
      );
    }
    if (hasUnitFilter) {
      queryParams.push(unitId);
    }
    let sql = ` FROM staffs s ${staffCommonJoins()}
                WHERE 1 = 1
                ${statusFilter}
                ${searchQuery}
                ${unitFilter}
                ${filterByUserOffice(
                  user,
                  "AND",
                  "s.zone_id",
                  "s.district_code",
                  ` AND s.id <> ${user.id}`
                )}
                `;
    db.query(
      `SELECT   username, s.id as userId, email, v.id as vyeoId, user_level, IFNULL(last_login , '') as last_login,
                s.name as name, phone_no, IFNULL(r.name , '') as level_name, v.rank_name AS section_name,
                IFNULL(rank_level , '') as rank_level, IFNULL(rm.role_name , '') as role_name,
                IFNULL(z.zone_name , '') as zone_name , rg.RegionName as region_name, IFNULL(d.LgaName , '') as 
                lga_name ,
                CASE
                  WHEN s.signature IS NOT NULL
                   AND NULLIF(TRIM(CAST(s.signature AS CHAR)), '') IS NOT NULL
                   AND LOWER(TRIM(CAST(s.signature AS CHAR))) <> 'null'
                  THEN 1
                  ELSE 0
                END AS has_signature ,
                s.user_status as user_status, is_password_changed
                ${sql}
                ${per_page > 0 ? "LIMIT ? , ?" : ""}`,
      per_page > 0 ? queryParams.concat([offset, per_page]) : queryParams,
      (error, users) => {
        if (error) console.log(error);
        db.query(
          `SELECT COUNT(*) AS num_rows  ${sql}`,
          queryParams,
          (error2, result2) => {
            if (error2) {
              error = error2;
              console.log(error);
            }
            callback(error, users, result2[0].num_rows);
          }
        );
      }
    );
  },
  // ********** USER PROFILE *************
  getMyProfile: (id, callback) => {
    const queryWithProfilePhoto = `SELECT s.name, s.username, s.email, s.email_notify, s.phone_no,
                                          s.created_at, s.updated_at, s.user_status, s.last_login,
                                          s.profile_photo, IFNULL(rm.role_name, '') AS role_name
                                     FROM staffs s
                                LEFT JOIN role_management rm ON rm.id = s.new_role_id
                                    WHERE s.id = ?`;
    const fallbackQuery = `SELECT s.name, s.username, s.email, s.email_notify, s.phone_no,
                                  s.created_at, s.updated_at, s.user_status, s.last_login,
                                  NULL AS profile_photo, IFNULL(rm.role_name, '') AS role_name
                             FROM staffs s
                        LEFT JOIN role_management rm ON rm.id = s.new_role_id
                            WHERE s.id = ?`;

    const runLoginActivityQuery = (profile) => {
      db.query(
        `SELECT browser , ip , device , created_at 
                    FROM login_activity
                    WHERE staff_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT 10`,
        [id],
        (erro2, loginActivities) => {
          if (erro2) console.log(erro2);
          callback(profile, loginActivities);
        }
      );
    };

    db.query(queryWithProfilePhoto, [id], (error, user) => {
      if (error && error.code === "ER_BAD_FIELD_ERROR") {
        db.query(fallbackQuery, [id], (fallbackError, fallbackUser) => {
          if (fallbackError) {
            console.log(fallbackError);
            runLoginActivityQuery({});
            return;
          }
          runLoginActivityQuery(fallbackUser[0] || {});
        });
        return;
      }

      if (error) {
        console.log(error);
      }
      runLoginActivityQuery(user?.[0] || {});
    });
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
        WHERE s.id = ? ${filterByUserOffice(
          user,
          "AND",
          "s.zone_id",
          "s.district_code"
        )}`,
      [Number(userId)],
      (error, user) => {
        if (error) {
          console.log(error);
        }
        if (Array.isArray(user) && user.length > 0) {
          success = true;
        }
        callback(error, success, user);
      }
    );
  },
  //******** GET USER SIGNATURE *******************************
  getUserSignature: (userId, user, callback) => {
    const resolveSignaturePayload = (row) => {
      let signature = row?.signature;
      if (Buffer.isBuffer(signature)) {
        signature = signature.toString("base64");
      } else if (signature !== null && signature !== undefined) {
        signature = String(signature).trim();
      }

      if (typeof signature === "string" && signature.toLowerCase() === "null") {
        signature = "";
      }

      return {
        id: row?.id || null,
        name: row?.name || "",
        cheo: row?.cheo || "",
        signature: signature || "",
      };
    };

    const scopedSql = `SELECT s.id,
                              s.name,
                              s.signature,
                              COALESCE(NULLIF(TRIM(r.description), ''), NULLIF(TRIM(r.name), ''), NULLIF(TRIM(rm.role_name), ''), '') AS cheo
                         FROM staffs s
                    LEFT JOIN roles r ON r.id = s.user_level
                    LEFT JOIN role_management rm ON rm.id = s.new_role_id
                        WHERE s.id = ?
                        ${filterByUserOffice(
                          user,
                          "AND",
                          "s.zone_id",
                          "s.district_code"
                        )}
                        LIMIT 1`;

    db.query(scopedSql, [Number(userId)], (error, rows = []) => {
      if (error) {
        console.log(error);
        callback(error, false, null);
        return;
      }

      if (Array.isArray(rows) && rows.length > 0) {
        callback(null, true, resolveSignaturePayload(rows[0]));
        return;
      }

      // Fallback: avoid false negatives caused by strict office scope mismatches.
      db.query(
        `SELECT s.id,
                s.name,
                s.signature,
                COALESCE(NULLIF(TRIM(r.description), ''), NULLIF(TRIM(r.name), ''), NULLIF(TRIM(rm.role_name), ''), '') AS cheo
           FROM staffs s
      LEFT JOIN roles r ON r.id = s.user_level
      LEFT JOIN role_management rm ON rm.id = s.new_role_id
          WHERE s.id = ?
          LIMIT 1`,
        [Number(userId)],
        (fallbackError, fallbackRows = []) => {
          if (fallbackError) {
            console.log(fallbackError);
            callback(fallbackError, false, null);
            return;
          }

          if (!Array.isArray(fallbackRows) || fallbackRows.length === 0) {
            callback(null, false, null);
            return;
          }

          callback(null, true, resolveSignaturePayload(fallbackRows[0]));
        }
      );
    });
  },
  //******** CREATE USER *******************************
  createUser: (user, callback) => {
    var success = false;
    const {
      username,
      email,
      fullname,
      levelId,
      lgas,
      zone,
      region,
      phoneNumber,
      roleId,
      password,
    } = user;
    var userData = [
      crypto.randomBytes(10).toString("hex"),
      username ? lowerCase(username) : username,
      email ? lowerCase(email) : email,
      levelId,
      fullname ? titleCase(fullname) : fullname,
      phoneNumber,
      lgas ? lgas : zone ? zone : null,
      roleId,
      password,
      zone ? zone : null,
      region ? region : null,
      lgas ? lgas : null,
      1,
      formatDate(new Date()),
    ];
    // Set signature if uploaded
    if (user.sign) {
      userData.push(user.sign);
    }
    module.exports.checkEmailExists(email).then((emailExists) => {
      if(emailExists){
        callback(false , false , false , true)
      }else{
        module.exports
          .checkUserCheoExists(userData[3], userData[9], userData[11])
          .then((cheoExists) => {
            if (cheoExists) {
              callback(false, false, true); // cheo exists
            } else {
              db.query(
                `INSERT INTO staffs(secure_token , username,email,user_level,name,phone_no,office, 
                    new_role_id, password , zone_id, region_code, district_code, user_status , created_at
                    ${user.sign ? ",signature" : ""}) VALUES ?`,
                [[userData]],
                (error, createdUser) => {
                  if (error) {
                    console.log(error);
                  }
                  if (createdUser && createdUser.affectedRows > 0) {
                    success = true;
                  }
                  callback(success, createdUser);
                }
              );
            }
          })
          .catch((error) => {
            console.error("Error: ", error);
            callback(false, false, false, false);
          });
      }
    }).catch((error) => {
      console.error("Error" , error);
      callback(false , false , false , false)
    })
  },

  findUserByEmail: (email, callback) => {
    var success = false;
    db.query(
      `SELECT name FROM staffs WHERE email = ? and user_status = 1`,
      [email],
      (error, user) => {
        if (error) {
          console.log(error);
        } else if (user.length == 1) {
          success = true;
        }
        callback(success, user);
      }
    );
  },
  //Check if email exists
  checkEmailExists: (email, userId = null) => {
    return new Promise((resolve, reject) => {
      let query = "SELECT COUNT(*) AS count FROM staffs WHERE email = ?";
      const params = [email];
      if (userId) { 
        query += " AND id <> ?";
        params.push(userId);
      }
      db.query(query, params, (error, results) => {
        if (error) return reject(error);
        resolve(results[0].count);
      });
    });
  },
  // Check if username exists
  checkUsernameExists: (username, userId = null) => {
    return new Promise((resolve, reject) => {
      let query = "SELECT COUNT(*) AS count FROM staffs WHERE username = ?";
      const params = [lowerCase(username)];
      if (userId) {
        query += " AND id <> ?";
        params.push(Number(userId));
      }
      db.query(query, params, (error, results) => {
        if (error) return reject(error);
        resolve(results[0].count);
      });
    });
  },
  //Check if user cheo exist for active user
  checkUserCheoExists: (user_level, zone_id = null, district_code = null, userId = null) => {
    return new Promise((resolve, reject) => {
      let query = `SELECT COUNT(*) AS count FROM staffs WHERE user_level = ? AND user_status = 1 `;
      const params = [user_level];
      if (zone_id) {
        query += `AND zone_id = ? `;
        params.push(Number(zone_id));
      } 
      if (district_code) {
        query += `AND district_code = ? `;
        params.push(district_code);
      }
      if (userId) {
        query += `AND id <> ? `;
        params.push(Number(userId));
      }
      db.query(query, params, (error, results) => {
        if (error) return reject(error);
        resolve(results[0].count);
      });
    });
  },
  //******** UPDATE USER *******************************
  updateUser: (userId, user, callback) => {
    var success = false;
    var userData = [
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
          formatDate(new Date()),
        ];
    // Set signature if uploaded
    if (user.sign) {
      userData.push(user.sign);
    }
    if (user.has_to_change_password_changed) {
      userData.push(0);
    }
    userData.push(Number(userId));
    const email = userData[1];
    module.exports
      .checkEmailExists(email, userId)
      .then((emailExists) => {
        if (emailExists) {
          callback(false, null, false, true); //return email exist
        } else {
          // Now check if cheo exists
          module.exports
            .checkUserCheoExists(userData[2],userData[7], userData[9], userId)
            .then((cheoExists) => {
              if (cheoExists) {
                callback(false, null, true); //return cheo exist
              } else {
                db.query(
                  `UPDATE staffs SET username = ?,email=?, user_level=?, name = ?, phone_no = ?  ,office = ?, 
                    new_role_id = ?, zone_id=?, region_code=?, district_code=?, updated_at = ?
                    ${user.sign ? ", signature = ?" : ""}
                    ${
                      user.has_to_change_password_changed
                        ? ", is_password_changed = ?"
                        : ""
                    }
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
              }
            })
            .catch((error) => {
              console.error("There an error ", error);
              callback(false, false, false, false);
            });
        }
      })
      .catch((error) => {
        console.error("There an error ", error);
        callback(false, false, false, false);
      });
  },

  // DISABLE USER ACCOUNT
  activateDeactivateUser: (user, id, callback) => {
    var updated = false;
    db.query(
      `SELECT s.id AS staff_id , user_status 
                 FROM staffs s
                ${staffCommonJoins()} 
                WHERE s.id = ?
                ${filterByUserOffice(
                  user,
                  " AND ",
                  "s.zone_id",
                  "s.district_code",
                  ` AND s.id <> ${user.id}`
                )}
                `,
      [id],
      (error, staff) => {
        if (error) console.log(error);
        if (staff.length > 0) {
          db.query(
            `UPDATE staffs s SET s.user_status = ${
              staff[0].user_status ? 0 : 1
            } WHERE s.id = ?`,
            [Number(id)],
            (error2, disabledStaff) => {
              if (error2) console.log(error2);
              if (disabledStaff.affectedRows > 0) {
                updated = true;
              }
              callback(
                updated,
                updated
                  ? "Umefanikiwa kufuta akaunti hii kwa muda."
                  : "Haujafanikiwa kuna tatizo, Wasiliana na Msimamizi wa Mfumo."
              );
            }
          );
        } else {
          callback(updated, "Hakuna mtumiaji mwenye akaunti hiyo.");
        }
      }
    );
  },
  getStaffOfficeName: (office, user, callback) => {
    const { zone_id, district_code } = user;
    switch (office) {
      case 1:
        callback("HQ");
        break;
      case 2:
        db.query(
          `SELECT zone_name FROM zones 
                    WHERE id = ${zone_id}`,
          (error, result) => {
            if (error) console.log("unable to find user zone ", error);
            if (result.length > 0) {
              callback(result[0].zone_name);
            }
          }
        );
        break;
      case 3:
        db.query(
          `SELECT LgaName FROM districts 
                    WHERE LgaCode = "${district_code}"`,
          (error, result) => {
            if (error) console.log("unable to find user district ", error);
            if (result.length > 0) {
              callback(result[0].LgaName);
            }
          }
        );
        break;
      default:
        callback(null);
        break;
    }
  },
  // Update my profile
  updateMyProfile: (formData, callback) => {
    const isLegacyPayload = Array.isArray(formData);
    const payload = isLegacyPayload
      ? {
          phone_number: formData[0],
          email_notify: formData[1],
          user_id: formData[2],
        }
      : formData || {};

    const userId = Number(payload.user_id || payload.id || payload.staff_id || 0);
    if (!userId) {
      callback(false, { reason: "invalid_user" });
      return;
    }

    const hasName = Object.prototype.hasOwnProperty.call(payload, "full_name");
    const hasPhone = Object.prototype.hasOwnProperty.call(payload, "phone_number");
    const hasUsername = Object.prototype.hasOwnProperty.call(payload, "username");
    const hasEmail = Object.prototype.hasOwnProperty.call(payload, "email");
    const hasEmailNotify = Object.prototype.hasOwnProperty.call(payload, "email_notify");
    const hasProfilePhoto = Object.prototype.hasOwnProperty.call(payload, "profile_photo");

    const nextName = hasName ? titleCase(String(payload.full_name || "").trim()) : null;
    const nextPhone = hasPhone ? String(payload.phone_number || "").trim() : null;
    const nextUsername = hasUsername ? lowerCase(String(payload.username || "").trim()) : null;
    const nextEmail = hasEmail ? lowerCase(String(payload.email || "").trim()) : null;
    const nextEmailNotify = hasEmailNotify
      ? payload.email_notify === true ||
        payload.email_notify === "true" ||
        payload.email_notify === 1 ||
        payload.email_notify === "1"
        ? 1
        : 0
      : null;
    const nextProfilePhoto = hasProfilePhoto
      ? String(payload.profile_photo || "").trim() || null
      : null;

    db.query(`SELECT id FROM staffs WHERE id = ? LIMIT 1`, [userId], (findError, rows) => {
      if (findError) {
        console.log(findError);
        callback(false, { reason: "query_error" });
        return;
      }

      if (!Array.isArray(rows) || rows.length === 0) {
        callback(false, { reason: "not_found" });
        return;
      }

      const checks = [];
      if (hasEmail && nextEmail) {
        checks.push(
          module.exports.checkEmailExists(nextEmail, userId).then((count) => ({
            key: "email_exists",
            exists: Number(count) > 0,
          }))
        );
      }

      if (hasUsername && nextUsername) {
        checks.push(
          module.exports.checkUsernameExists(nextUsername, userId).then((count) => ({
            key: "username_exists",
            exists: Number(count) > 0,
          }))
        );
      }

      Promise.all(checks)
        .then((results) => {
          const duplicateEmail = results.some((item) => item.key === "email_exists" && item.exists);
          if (duplicateEmail) {
            callback(false, { reason: "email_exists" });
            return;
          }

          const duplicateUsername = results.some(
            (item) => item.key === "username_exists" && item.exists
          );
          if (duplicateUsername) {
            callback(false, { reason: "username_exists" });
            return;
          }

          const updates = [];
          const values = [];

          if (hasName) {
            updates.push(`name = ?`);
            values.push(nextName);
          }

          if (hasPhone) {
            updates.push(`phone_no = ?`);
            values.push(nextPhone);
          }

          if (hasUsername) {
            updates.push(`username = ?`);
            values.push(nextUsername);
          }

          if (hasEmail) {
            updates.push(`email = ?`);
            values.push(nextEmail);
          }

          if (hasEmailNotify) {
            updates.push(`email_notify = ?`);
            values.push(nextEmailNotify);
          }

          if (hasProfilePhoto) {
            updates.push(`profile_photo = ?`);
            values.push(nextProfilePhoto);
          }

          updates.push(`updated_at = ?`);
          values.push(formatDate(new Date()));
          values.push(userId);

          db.query(
            `UPDATE staffs SET ${updates.join(", ")} WHERE id = ?`,
            values,
            (updateError) => {
              if (updateError) {
                if (updateError.code === "ER_BAD_FIELD_ERROR" && hasProfilePhoto) {
                  const fallbackUpdates = updates.filter(
                    (segment) => segment !== "profile_photo = ?"
                  );
                  const fallbackValues = [];
                  for (let i = 0; i < updates.length; i += 1) {
                    if (updates[i] === "profile_photo = ?") {
                      continue;
                    }
                    fallbackValues.push(values[i]);
                  }
                  fallbackValues.push(userId);

                  db.query(
                    `UPDATE staffs SET ${fallbackUpdates.join(", ")} WHERE id = ?`,
                    fallbackValues,
                    (fallbackError) => {
                      if (fallbackError) {
                        console.log(fallbackError);
                        callback(false, { reason: "query_error" });
                        return;
                      }
                      callback(true, { reason: "updated_without_profile_photo" });
                    }
                  );
                  return;
                }
                console.log(updateError);
                callback(false, { reason: "query_error" });
                return;
              }
              callback(true, { reason: "updated" });
            }
          );
        })
        .catch((error) => {
          console.log(error);
          callback(false, { reason: "query_error" });
        });
    });
  },
  // change my password
  changeMyPassword: (oldpassword, newpassword, user_id, callback) => {
    db.query(
      `SELECT password 
                 FROM staffs
                 WHERE id = ? `,
      [user_id],
      (error, staff) => {
        if (error) console.log(error);
        // check for valid password
        if (bcrypt.compareSync(oldpassword, staff[0].password)) {
          // update password
          hash(newpassword, (hashed, hash) => {
            if (hashed) {
              db.query(
                `UPDATE staffs 
                                  SET password = ? , is_password_changed = ?
                                  WHERE id = ?`,
                [hash, 1, user_id],
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
            } else {
              callback(false, "Haujafanikiwa kubadili nywila kuna tatizo.");
            }
          });
        } else {
          callback(false, `Neno la siri la sasa sio sahihi.`);
        }
      }
    );
  },
};
