require("dotenv").config();
const express = require("express");
const request = require("request");
const userRouter = express.Router();
const {
  isAuth,
  isAdmin,
  formatDate,
  generateToken,
  sendEmail,
  setMailOptions,
  hash,
  generateRandomText,
  getUserOffice,
  permission,
  lowerCase,
} = require("../utils.js");
var rateLimit = require("express-rate-limit");
const userModal = require("../models/userModal.js");

const {
  signupValidation,
  loginValidation,
  makundiValidation,
  shirikishoValidation,
  memberValidation,
} = require("../validation");
const { resetPassword } = require("../templates/emailTemplate.js");
const loginlimiter = rateLimit({
  windowMs: 20 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 5 requests per `window` (here, per 10 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

//login api
userRouter.post("/login", loginlimiter, (req, res, next) => {
  userModal.loginUser(req, (success , loginUser, permissions) => {
    
    if (success && loginUser) {
      const permissionData = [];
      let user = loginUser[0];
      let office = getUserOffice(user);
      userModal.getStaffOfficeName(office, user, (office_name) => {
        const userData = {
          id: user.id,
          name: user.name,
          username: user.username,
          phone_no: user.phone_no,
          user_status: user.user_status,
          last_login: user.last_login,
          user_level: user.user_level,
          role_id: user.role_id,
          station_level: user.station_level,
          office: office,
          office_name: office_name,
          rank_name: user.rank_name,
          // status_id: user.status_id,
          zone_id: Number(user.zone_id),
          region_code: user.region_code,
          district_code: user.district_code,
          rank_level: user.rank_level,
          twofa: user.twofa,
          email: user.email,
          section_id : user.section_id,
          ngazi: user.ngazi ? lowerCase(user.ngazi) : '',
          sehemu: user.sehemu ? lowerCase(user.sehemu) : '',
          cheo: user.rank_name ? lowerCase(user.rank_name) : '',
        };
        // console.log("User Data", userData);
        if (permissionData) {
          for (var i = 0; i < permissions.length; i++) {
            permissionData.push(permissions[i].permission_name);
          }
        }
        // console.log(permissionData);
        const token = generateToken(userData, permissionData);
        // console.log(token)
        res.send({
          error: false,
          statusCode: 300,
          message: "Logged in!",
          token,
          RoleManage: permissions,
          user: userData,
        });
      });
    } else {
      res.status(400).send({
        error: true,
        statusCode: 302,
        message: "Username or password is incorrect!",
      });
    }
  });
});

//get list of users
userRouter.get("/users", isAuth , permission('view-users'), (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var searchQuery = req.body; 
  var user = req.user;
  userModal.getUsers(offset, per_page, searchQuery, user, (error, users, numRows) => {
    // console.log(users);
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? [] : users,
      numRows: numRows,
      message: "List of Users.",
    });
  });
});

//find a user
userRouter.get("/users/:id", isAuth, (req, res, next) => {
  var userId = req.params.id;
  userModal.findUser(userId, (error, success, user) => {
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? error : user,
      message: error ? "Not Found" : "Success",
    });
  });
});
// create user
userRouter.post("/create-user", isAuth, (req, res, next) => {
  var password = req.body.password;
      password = password ? password : generateRandomText(10); 
      console.log(password);
  hash(password, (isHashed , hashedPassword) => {
          if (isHashed){
            console.log(hashedPassword)
              var userData = {
                fullname: req.body.name,
                username: req.body.username,
                phoneNumber: req.body.phone,
                email: req.body.email,
                roleId: req.body.roleId,
                password: hashedPassword,
                levelId: req.body.levelId,
                lgas: req.body.lgas,
                zone: req.body.zone,
                region: req.body.region,
                sign: req.body.selectedFile,
              };
              userModal.createUser(userData, (success, user) => {
                res.send({
                  error: success ? false : true,
                  statusCode: success ? 300 : 306,
                  data: success ? user : [],
                  message: success 
                    ? "Umefanikiwa kutengeneza akaunti ya Mtumiaji."
                    : "Haujafanikiwa kutengeneza Akaunti kuna tatizo limetokea",
                });
              });
          }else{
            res.send({
              error: true,
              statusCode: 306,
              message: "Haujafanikiwa kutengeneza Akaunti kuna tatizo limetokea."
            });
          }
    
  })
 
});
//update a user
userRouter.put("/update-user/:id", isAuth, (req, res, next) => {
  var userId = req.params.id;
  var userData = {
              fullname: req.body.name,
              username: req.body.username,
              phoneNumber: req.body.phone,
              email: req.body.email,
              roleId: req.body.roleId,
              password: req.body.password,
              levelId: req.body.levelId,
              lgas: req.body.lgas,
              zone: req.body.zone,
              region: req.body.region,
              sign: req.body.selectedFile,
        };
  userModal.updateUser(userId, userData, (success, user) => {
    res.send({
      error: success ? false : true,
      statusCode: success ? 300 : 306,
      data: success ? user : [],
      message: success
        ? "Umefanikiwa kubadili taarifa za akaunti ya Mtumiaji."
        : "Haujafanikiwa kubadili taarifa za akaunti hii kuna tatizo limetokea",
    });
  });
});

userRouter.post("/reset-user-password", function (req, res) {
  var email = req.body.email;
  userModal.findUserByEmail(email , (success , user) => {
       if(success){
              let link = `${(process.env.APP_URL || 'http:localhost:'+process.env.HTTP_PORT)}/PasswordReset`
              let htmlContent = resetPassword(user.name, link);
              let mailOptions = setMailOptions(email, "Reset Password" , htmlContent);
              sendEmail(mailOptions, (error, info) => {
                console.log("Message %s sent: %s", info, error);
                res.send({
                  statusCode: error ? 306 : 300,
                  data: error ? null : info,
                  message: error
                    ? "Email haijatumwa kwa muhusika kuna tatizo. "
                    : "Email imetumwa kwa mtumijia mwenye email ",
                });
            });
       }else{
        res.status(404).send({
              statusCode : 306, 
              message : 'Mtumiaji mwenye email hii hayupo au akaunti yake imesitishwa(In Active).'
        });
       }
  });
  
});
module.exports = userRouter;

// router.post("/update-user", signupValidation, (req, res, next) => {
//   console.log("req.body");
//   console.log(req.body);
//   if (
//     !req.headers.authorization ||
//     !req.headers.authorization.startsWith("Bearer") ||
//     !req.headers.authorization.split(" ")[1]
//   ) {
//     return res.status(200).json({
//       error: true,
//       statusCode: 422,
//       message: "No access to end point",
//     });
//   }
//   const theToken = req.headers.authorization.split(" ")[1];
//   const decoded = jwt.verify(theToken, "the-super-strong-secrect");
//   db.query(
//     `SELECT * FROM staffs WHERE id = LOWER(${db.escape(req.body.userId)});`,
//     (err, resultdata) => {
//       console.log(resultdata);
//       if (resultdata.length <= 0) {
//         return res.status(200).send({
//           error: true,
//           statusCode: 306,
//           message: "This user is not exist!",
//         });
//       } else {
//         // username is available

//         if (req.body.password == "0") {
//           if (req.body.cheo == 1) {
//             db.query(
//               `UPDATE staffs SET username = ${db.escape(req.body.username)},
//             email = ${db.escape(req.body.email)}, user_level = ${db.escape(
//                 req.body.roleId
//               )},
//             name = ${db.escape(req.body.name)}, phone_no = ${db.escape(
//                 req.body.phoneNumber
//               )},
//             office = ${db.escape(req.body.lgas)}, signature = ${db.escape(
//                 req.body.sign
//               )},
//             new_role_id = ${db.escape(req.body.roleRMe)} WHERE id = ${db.escape(
//                 req.body.userId
//               )}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 // db.query(`SELECT id FROM staffs where email = ${db.escape(req.body.email)}`,
//                 // function (error, results, fields) {
//                 //     if (error) {console.log(error)}
//                 var rollId = req.body.userId;
//                 var req_body = {
//                   username: req.body.username,
//                   email: req.body.email,
//                   password: "********",
//                   cheo: req.body.roleId,
//                   name: req.body.name,
//                   phoneNumber: req.body.phoneNumber,
//                   lga: req.body.lgas,
//                   role: req.body.roleRMe,
//                 };
//                 UpdateAuditTrail(
//                   decoded.id,
//                   "updated",
//                   req_body,
//                   req.url,
//                   req.body.browser_used,
//                   rollId,
//                   "The user has been updated with us!",
//                   req.body.ip_address,
//                   resultdata,
//                   "staffs"
//                 );
//                 // });
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 3) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//                 user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )},
//                 phone_no = ${db.escape(
//                   req.body.phoneNumber
//                 )}, office = ${db.escape(req.body.lgas)},
//                 signature = ${db.escape(
//                   req.body.sign
//                 )},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var req_body = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       req_body,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 2) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(
//                 req.body.email
//               )}, user_level = ${db.escape(req.body.roleId)},
//             name = ${db.escape(req.body.name)}, phone_no = ${db.escape(
//                 req.body.phoneNumber
//               )},
//             office = ${db.escape(req.body.kanda)},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var req_body = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       req_body,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 4) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(
//                 req.body.email
//               )}, user_level = ${db.escape(req.body.roleId)},
//                 name = ${db.escape(req.body.name)},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )}, phone_no = ${db.escape(
//                 req.body.phoneNumber
//               )}, office = ${db.escape(req.body.kanda)} WHERE id = ${db.escape(
//                 req.body.userId
//               )}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 5) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )}, phone_no = ${db.escape(req.body.phoneNumber)}
//             , signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 6) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//                 user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )},
//                 phone_no = ${db.escape(
//                   req.body.phoneNumber
//                 )},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )}, signature = ${db.escape(
//                 req.body.sign
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 7) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//                 user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )},
//                 phone_no = ${db.escape(
//                   req.body.phoneNumber
//                 )},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )}, signature = ${db.escape(
//                 req.body.sign
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 8) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//                 user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )},
//                 phone_no = ${db.escape(
//                   req.body.phoneNumber
//                 )},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )}, signature = ${db.escape(
//                 req.body.sign
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 9) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//                 user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )},
//                 phone_no = ${db.escape(
//                   req.body.phoneNumber
//                 )},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )}, signature = ${db.escape(
//                 req.body.sign
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 10) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//                 user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )},
//                 phone_no = ${db.escape(
//                   req.body.phoneNumber
//                 )},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )}, signature = ${db.escape(
//                 req.body.sign
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 11) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//                 user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )},
//                 phone_no = ${db.escape(
//                   req.body.phoneNumber
//                 )},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 12) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//                 user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )},
//                 phone_no = ${db.escape(
//                   req.body.phoneNumber
//                 )},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )}, signature = ${db.escape(
//                 req.body.sign
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 13) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//                 user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )},
//                 phone_no = ${db.escape(
//                   req.body.phoneNumber
//                 )},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )}, signature = ${db.escape(
//                 req.body.sign
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 14) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//                 user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )},
//                 phone_no = ${db.escape(
//                   req.body.phoneNumber
//                 )},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )}, signature = ${db.escape(
//                 req.body.sign
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 15) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//                 user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )},
//                 phone_no = ${db.escape(
//                   req.body.phoneNumber
//                 )},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )}, signature = ${db.escape(
//                 req.body.sign
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 16) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//                 user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )},
//                 phone_no = ${db.escape(
//                   req.body.phoneNumber
//                 )},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )}, signature = ${db.escape(
//                 req.body.sign
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 17) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//                 user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )},
//                 phone_no = ${db.escape(
//                   req.body.phoneNumber
//                 )},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )}, signature = ${db.escape(
//                 req.body.sign
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//           if (req.body.cheo == 18) {
//             db.query(
//               `update staffs SET username = ${db.escape(
//                 req.body.username
//               )}, email = ${db.escape(req.body.email)},
//                 user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                 req.body.name
//               )},
//                 phone_no = ${db.escape(
//                   req.body.phoneNumber
//                 )},new_role_id = ${db.escape(
//                 req.body.roleRMe
//               )}, signature = ${db.escape(
//                 req.body.sign
//               )} WHERE id = ${db.escape(req.body.userId)}`,
//               (err, result) => {
//                 if (err) {
//                   console.log(err);
//                   return res.status(400).send({
//                     error: true,
//                     statusCode: 400,
//                     message: err,
//                   });
//                 }
//                 db.query(
//                   `SELECT id FROM staffs where email = ${db.escape(
//                     req.body.email
//                   )}`,
//                   function (error, results, fields) {
//                     if (error) {
//                       console.log(error);
//                     }
//                     var rollId = results.id;
//                     var reqbody = {
//                       username: req.body.username,
//                       email: req.body.email,
//                       password: "********",
//                       cheo: req.body.roleId,
//                       name: req.body.name,
//                       phoneNumber: req.body.phoneNumber,
//                       lga: req.body.lgas,
//                       role: req.body.roleRMe,
//                     };
//                     UpdateAuditTrail(
//                       decoded.id,
//                       "updated",
//                       reqbody,
//                       req.url,
//                       req.body.browser_used,
//                       rollId,
//                       "The user has been updated with us!",
//                       req.body.ip_address,
//                       resultdata,
//                       "staffs"
//                     );
//                   }
//                 );
//                 return res.status(200).send({
//                   error: false,
//                   statusCode: 300,
//                   message: "The user has been registerd with us!",
//                 });
//               }
//             );
//           }
//         } else {
//           bcrypt.hash(req.body.password, 10, (err, hash) => {
//             if (err) {
//               return res.status(500).send({
//                 error: true,
//                 statusCode: 500,
//                 message: err,
//               });
//             } else {
//               // has hashed pw => add to database
//               if (req.body.cheo == 1) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//     user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//     office = ${db.escape(req.body.lgas)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )}, signature = ${db.escape(
//                     req.body.sign
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 3) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//          user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//          office = ${db.escape(req.body.lgas)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )}, signature = ${db.escape(
//                     req.body.sign
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 2) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//         user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//         office = ${db.escape(req.body.kanda)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 4) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//             office = ${db.escape(req.body.kanda)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 5) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//         user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//         signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 6) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//             signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 7) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//             signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 8) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//             signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 9) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//             signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 10) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//             signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 11) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//             signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 12) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//             signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 13) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//             signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 14) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//             signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 15) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//             signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 16) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//             signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 17) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//             signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//               if (req.body.cheo == 18) {
//                 db.query(
//                   `update staffs SET username = ${db.escape(
//                     req.body.username
//                   )}, email = ${db.escape(
//                     req.body.email
//                   )}, password = ${db.escape(hash)},
//             user_level = ${db.escape(req.body.roleId)}, name = ${db.escape(
//                     req.body.name
//                   )}, phone_no = ${db.escape(req.body.phoneNumber)},
//             signature = ${db.escape(req.body.sign)},new_role_id = ${db.escape(
//                     req.body.roleRMe
//                   )} WHERE id = ${db.escape(req.body.userId)}`,
//                   (err, result) => {
//                     if (err) {
//                       console.log(err);
//                       return res.status(400).send({
//                         error: true,
//                         statusCode: 400,
//                         message: err,
//                       });
//                     }
//                     db.query(
//                       `SELECT id FROM staffs where email = ${db.escape(
//                         req.body.email
//                       )}`,
//                       function (error, results, fields) {
//                         if (error) {
//                           console.log(error);
//                         }
//                         var rollId = results.id;
//                         var reqbody = {
//                           username: req.body.username,
//                           email: req.body.email,
//                           password: "********",
//                           cheo: req.body.roleId,
//                           name: req.body.name,
//                           phoneNumber: req.body.phoneNumber,
//                           lga: req.body.lgas,
//                           role: req.body.roleRMe,
//                         };
//                         UpdateAuditTrail(
//                           decoded.id,
//                           "updated",
//                           reqbody,
//                           req.url,
//                           req.body.browser_used,
//                           rollId,
//                           "The user has been updated with us!",
//                           req.body.ip_address,
//                           resultdata,
//                           "staffs"
//                         );
//                       }
//                     );
//                     return res.status(200).send({
//                       error: false,
//                       statusCode: 300,
//                       message: "The user has been registerd with us!",
//                     });
//                   }
//                 );
//               }
//             }
//           });
//         }
//       }
//     }
//   );
// });
