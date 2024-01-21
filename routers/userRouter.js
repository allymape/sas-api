require("dotenv").config();
const express = require("express");
const userRouter = express.Router();
const {
  isAuth,
  sendEmail,
  setMailOptions,
  hash,
  generateRandomText,
  getUserOffice,
  permission,
  lowerCase,
  upperCase,
  generateAccessToken,
} = require("../utils.js");
var rateLimit = require("express-rate-limit");
const userModal = require("../models/userModal.js");
const { resetPassword } = require("../templates/emailTemplate.js");
const loginlimiter = rateLimit({
  windowMs: 20 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 5 requests per `window` (here, per 10 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

//login api
userRouter.post("/login", loginlimiter, (req, res, next) => {
  userModal.loginUser(req, (success , loginUser, permissions , message) => {
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
          role_id: user.new_role_id,
          station_level: user.station_level,
          office: office,
          office_name: office_name,
          rank_name: user.rank_name,
          // status_id: user.status_id,
          zone_id: Number(user.zone_id),
          kanda : user.zone_name,
          region_code: user.region_code,
          district_code: user.district_code,
          rank_level: user.rank_level,
          twofa: user.twofa,
          email: user.email,
          section_id: user.section_id,
          ngazi: user.ngazi ? lowerCase(user.ngazi) : "",
          sehemu: user.sehemu ? lowerCase(user.sehemu) : "",
          cheo: user.rank_name ? lowerCase(user.rank_name) : "",
          jukumu: user.jukumu ? upperCase(user.jukumu) : "",
        };
        // console.log("User Data", userData);
        for (var i = 0; i < permissions.length; i++) {
          permissionData.push(permissions[i].permission_name);
        }
        // console.log(permissionData);
        const token = generateAccessToken({
              id: userData.id,
              office: userData.office,
              zone_id: userData.zone_id,
              kanda: userData.kanda,
              region_code: userData.region_code,
              district_code: userData.district_code,
              userPermissions: permissionData,
              user_level: Number(userData.user_level),
              section_id: Number(userData.section_id),
              ngazi: userData.ngazi, //wizara,kanda au wilaya
              sehemu: userData.sehemu, // KE,ADSA,HICT,W1,K1,MUS,DLSU
              cheo: userData.cheo, // W4,W5,K2,K3, USJ1,USJ2,USJ3,ADSA,KE,MUS,
              jukumu: userData.jukumu,
        });
        res.send({
          error: false,
          statusCode: 300,
          message: message,
          token,
          RoleManage: permissions,
          user: userData,
        });
         console.log("rendered data succesfully");
      });
    } else {
      res.status(400).send({
        error: false,
        statusCode: 302,
        message: message,
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
//Profile
userRouter.post("/my-profile", isAuth, (req, res) => {
  const {id} = req.user
  userModal.getMyProfile(id, (user) => {
    return res.send({
      user : user
    });
  });
});
//find a user
userRouter.get("/users/:id", isAuth, (req, res, next) => {
  var userId = req.params.id;
  const {user} = req
  userModal.findUser(userId, user, (error, success, user) => {
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
      // console.log(password);
  hash(password, (isHashed , hashedPassword) => {
          if (isHashed){
            // console.log(hashedPassword)
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
              userModal.createUser(userData, (success, user , duplicate = false) => {
                res.send({
                  error: success ? false : true,
                  statusCode: success ? 300 : 306,
                  data: success ? user : [],
                  message: duplicate? 'Whoops! Mtumiaji mwenye cheo hiki ameshasajiliwa.' : (success 
                    ? "Umefanikiwa kutengeneza akaunti ya Mtumiaji."
                    : "Haujafanikiwa kutengeneza Akaunti kuna tatizo limetokea"),
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
  userModal.updateUser(userId, userData, (success, user , duplicate = false) => {
    res.send({
      error: success ? false : true,
      statusCode: success ? 300 : 306,
      data: success ? user : [],
      message: duplicate
        ? "Whoops! Mtumiaji mwenye cheo hiki ameshasajiliwa."
        : (success
        ? "Umefanikiwa kubadili taarifa za akaunti ya Mtumiaji."
        : "Haujafanikiwa kubadili taarifa za akaunti hii kuna tatizo limetokea"),
    });
  });
});

//Disable User Account
userRouter.put("/disable-user/:id", isAuth , permission('delete-users'), (req, res) => {
  const user_id = req.params.id;
  const {user} = req
  console.log("kakak")
  userModal.disableUser(user , user_id , (success , message) => {
    console.log(success , message)
      res.send({
          statusCode : success ? 300 : 306,
          message : message
      });
  })
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
                    : "Email imetumwa kwa mtumiaji mwenye email "+email,
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

userRouter.put("/update-my-profile", isAuth, (req, res) => {
  const { phone_number, email_notify } = req.body;
  const user = req.user;
  const formData = [phone_number, email_notify, user.id];
  userModal.updateMyProfile(formData, (success) => {
    res.send({
      statusCode: success ? 300 : 306,
      message: success
        ? "Umefanikiwa kurekebisha taarifa zako."
        : "Haujafanikiwa kurekebisha taarifa zako.",
    });
  });
});
userRouter.put("/change-my-password", isAuth, (req, res) => {
  const { oldpassword, newpassword } = req.body;
  const user = req.user;
  userModal.changeMyPassword(oldpassword,newpassword,user.id, (success , message) => {
    res.send({
      statusCode: success ? 300 : 306,
      message: message
    });
  });
});

module.exports = userRouter;
