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
  generateRefreshToken,
} = require("../utils.js");
var rateLimit = require("express-rate-limit");
const userModal = require("../models/userModal.js");
const { resetPassword } = require("../templates/emailTemplate.js");
const sharedModel = require("../models/sharedModel.js");
const baruaSecret = process.env.BARUA_SECRET_KEY || 'MY-SECRET-KEY'

const extractSearchValue = (req) => {
  const querySearch = req.query.search;
  if (typeof querySearch === "object" && querySearch !== null) {
    return querySearch.value || "";
  }

  return (
    req.query.search_value ||
    querySearch ||
    req.body?.search?.value ||
    req.body?.search_value ||
    ""
  );
};

const loginlimiter = rateLimit({
  windowMs: 20 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 5 requests per `window` (here, per 10 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

//login api
userRouter.post("/login", loginlimiter, (req, res) => {
  userModal.loginUser(req, (success , loginUser, permissions , message) => {
    if (success && loginUser) {
      const userPermissions = [];
      let user = loginUser[0];
      let office = getUserOffice(user);
      userModal.getStaffOfficeName(office, user, (office_name) => {
        sharedModel.myhandover(user.id, (handover_title, handover_by) => {
          // console.log("User Data", userData);
          for (var i = 0; i < permissions.length; i++) {
            userPermissions.push(permissions[i].permission_name);
          }
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
            is_password_changed: user.is_password_changed,
            zone_id: Number(user.zone_id),
            kanda: user.zone_name,
            region_code: user.region_code,
            district_code: user.district_code,
            rank_level: user.rank_level,
            twofa: user.twofa,
            email: user.email,
            section_id: user.section_id,
            ngazi: user.ngazi ? lowerCase(user.ngazi) : "",
            sehemu: user.sehemu ? lowerCase(user.sehemu) : "",
            cheo: handover_title
              ? "k" + handover_title
              : user.rank_name
              ? lowerCase(user.rank_name)
              : "",
            handover_by: handover_by,
            cheo_office: user.cheo_office,
            jukumu: user.jukumu ? upperCase(user.jukumu) : "",
            userPermissions: userPermissions,
          };

          const token = generateAccessToken(loggedUserData(userData));
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

// barua authentication
userRouter.post(`/authenticate-barua` , (req , res) => {   
        const {secret_key , tracking_number , name} = req.body;
        // console.log(secret_key , tracking_number , name)
        // console.log([secret_key, tracking_number, name].includes(""));
        if(![secret_key , tracking_number , name].includes("")){
          if(secret_key === baruaSecret){
             const user = {
               name: name,
               tracking_number: tracking_number,
               userPermissions: ["view-letters"],
             };
             const token = generateAccessToken(user);
             res.status(201).send({
               success: true,
               statusCode: 201,
               token,
               message: `Token successfully`,
             });
          }else{
             return res.status(401).send({
               success: false,
               statusCode: 401,
               message: `Invalid secret key`,
             });
          }
         
        }else{
          return res.status(422).send({
            success : false,
            statusCode : 422,
            message: `Key is required.`
          })
        }
});
//Refresh tokens
userRouter.post('/refresh_token' , isAuth , (req , res) => {
      const {user} = req
      if(user){
        const token = generateAccessToken(loggedUserData(user));
        return res.send({
          success: true,
          statusCode: 300,
          token: token,
        });
      }
})
//get list of users
userRouter.get("/users", isAuth , permission('view-users'), (req, res, next) => {
  const per_page = Number.parseInt(req.query.per_page, 10) || 10;
  const page = Number.parseInt(req.query.page, 10) || 1;
  const offset = (page - 1) * per_page;
  const search_value = extractSearchValue(req);
  const user = req.user;
  const inactiveRaw =
    req.query.inactive !== undefined ? req.query.inactive : req.body?.inactive;
  const inactive =
    inactiveRaw === true ||
    inactiveRaw === "true" ||
    inactiveRaw === 1 ||
    inactiveRaw === "1";
  userModal.getUsers(offset, per_page, search_value, user, inactive,(error, users, numRows) => {
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
  const {user} = req;
  userModal.getMyProfile(user.id, (profile , activities) => {
    sharedModel.myStaffs(user , (staffs) => {
         return res.send({
           user: profile,
           staffs: staffs,
           activities: activities,
         });
    })
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
              userModal.createUser(userData, (success, user , duplicateCheo = false , emailExists) => {
                res.send({
                  error: success ? false : true,
                  statusCode: success ? 300 : 306,
                  data: success ? user : [],
                  message: duplicateCheo
                    ? "Whoops! Mtumiaji mwenye cheo hiki ameshasajiliwa."
                    : emailExists
                    ? "Baruapepe ya mtumiaji huyu imeshatumika, Tafadhali hakiki ili uendelee."
                    : success
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

  if (req.body.has_to_change_password_changed) {
    userData.has_to_change_password_changed = true;
  }
  userModal.updateUser(userId, userData, (success, user , duplicateCheo = false , emailExists = false) => {
    res.send({
      error: success ? false : true,
      statusCode: success ? 300 : 306,
      data: success ? user : [],
      message: duplicateCheo
        ? "Whoops! Mtumiaji mwenye cheo hiki ameshasajiliwa."
        :
        emailExists
        ? "Baruapepe ya mtumiaji huyu imeshatumika, Tafadhali hakiki ili uendelee."
        : (success
        ? "Umefanikiwa kubadili taarifa za akaunti ya Mtumiaji."
        : "Haujafanikiwa kubadili taarifa za akaunti hii kuna tatizo limetokea"),
    });
  });
});

//Disable User Account
userRouter.put("/activate-deactivate-user/:id", isAuth , permission('delete-users'), (req, res) => {
  const user_id = req.params.id;
  const {user} = req
  // console.log("kakak")
  userModal.activateDeactivateUser(user , user_id , (success , message) => {
    // console.log(success , message)
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
              let link = `${(process.env.APP_URL+'/PasswordReset' || 'http:localhost:'+process.env.HTTP_PORT)}/PasswordReset`
              let name = user[0].name;
              let htmlContent = resetPassword(name, link);
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

function loggedUserData(user){
  return {
    id: user.id,
    name: user.name,
    office: user.office,
    zone_id: user.zone_id,
    kanda: user.kanda,
    region_code: user.region_code,
    district_code: user.district_code,
    userPermissions: user.userPermissions,
    user_level: Number(user.user_level),
    section_id: Number(user.section_id),
    ngazi: user.ngazi, //wizara,kanda au wilaya
    sehemu: user.sehemu, // KE,ADSA,HICT,W1,K1,MUS,DLSU
    cheo: user.cheo, // W4,W5,K2,K3, USJ1,USJ2,USJ3,ADSA,KE,MUS,
    handover_by: user.handover_by,
    is_password_changed: user.is_password_changed,
    cheo_office: Number(user.cheo_office),
    jukumu: user.jukumu,
  };
}

module.exports = userRouter;
