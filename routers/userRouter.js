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
const HandoverService = require("../src/Services/HandoverService");
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

const isAdminUser = (user = {}) => {
  const roleName = String(user?.jukumu || user?.role_name || user?.role || "").toLowerCase();
  return ["super admin", "super-admin", "admin", "system admin", "administrator"].some((name) =>
    roleName.includes(name),
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
      const basePermissions = [];
      let user = loginUser[0];
      let office = getUserOffice(user);
      userModal.getStaffOfficeName(office, user, (office_name) => {
        for (var i = 0; i < permissions.length; i++) {
          basePermissions.push(permissions[i].permission_name);
        }

        HandoverService.resolveDelegationContextForUser(user.id, {
          autoTransition: true,
        })
          .then((handoverContext) => {
            const delegatedPermissions = handoverContext?.delegatedPermissions || [];
            const effectivePermissions = Array.from(
              new Set([...(basePermissions || []), ...(delegatedPermissions || [])])
            );
            const primaryDelegation = handoverContext?.primaryDelegation || null;
            const handoverTitle = primaryDelegation?.from_user_rank_name || null;
            const handoverBy = primaryDelegation?.from_user_id || null;
            const delegatedFromUserName = primaryDelegation?.from_user_name || null;

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
              cheo: handoverTitle
                ? "k" + handoverTitle
                : user.rank_name
                ? lowerCase(user.rank_name)
                : "",
              handover_by: handoverBy,
              delegated_from_user_name: delegatedFromUserName,
              delegated_until_at: primaryDelegation?.end_at || null,
              cheo_office: user.cheo_office,
              jukumu: user.jukumu ? upperCase(user.jukumu) : "",
              userPermissions: effectivePermissions,
              base_permissions: basePermissions,
              delegatedPermissions,
              effectivePermissions,
              delegated_from_user_ids: handoverContext?.delegatedFromUserIds || [],
              active_handover_ids: handoverContext?.activeHandoverIds || [],
              primary_handover_id: primaryDelegation?.id || null,
              has_active_incoming_handover: Boolean(handoverContext?.hasIncomingActiveHandover),
              has_active_outgoing_handover: Boolean(handoverContext?.hasOutgoingActiveHandover),
              delegation_scope_type: primaryDelegation?.scope_type || null,
              delegation_status: primaryDelegation?.status || null,
            };

            const token = generateAccessToken(loggedUserData(userData));
            const roleManage = effectivePermissions.map((permissionName, index) => ({
              permission_id: index + 1,
              permission_name: permissionName,
            }));

            res.send({
              error: false,
              statusCode: 300,
              message: message,
              token,
              RoleManage: roleManage,
              user: userData,
            });
            console.log("rendered data succesfully");
          })
          .catch((handoverError) => {
            console.log("Failed to resolve handover context during login", handoverError);
            res.status(500).send({
              error: true,
              statusCode: 500,
              message: "Kuna tatizo la handover context. Jaribu tena.",
            });
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
          userPermissions: Array.isArray(user?.userPermissions) ? user.userPermissions : [],
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

  const unitFilterRaw =
    req.query.unit_id !== undefined ? req.query.unit_id : req.body?.unit_id;
  const requestedUnitId = Number.parseInt(unitFilterRaw, 10);
  const unitId =
    isAdminUser(user) && Number.isInteger(requestedUnitId) && requestedUnitId > 0
      ? requestedUnitId
      : null;

  userModal.getUsers(offset, per_page, search_value, user, inactive, unitId, (error, users, numRows) => {
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

// get user signature (for preview)
userRouter.get("/users/:id/signature", isAuth, permission("view-users"), (req, res) => {
  const userId = Number(req.params.id || 0);
  if (!userId) {
    return res.send({
      error: true,
      statusCode: 306,
      data: null,
      message: "Kitambulisho cha mtumiaji si sahihi.",
    });
  }

  userModal.getUserSignature(userId, req.user, (error, found, userSignature) => {
    if (error) {
      return res.send({
        error: true,
        statusCode: 306,
        data: null,
        message: "Imeshindikana kupata sahihi ya mtumiaji.",
      });
    }

    if (!found) {
      return res.send({
        error: true,
        statusCode: 404,
        data: null,
        message: "Mtumiaji hakupatikana.",
      });
    }

    if (!userSignature?.signature) {
      return res.send({
        error: true,
        statusCode: 404,
        data: userSignature,
        message: "Mtumiaji huyu hana sahihi iliyohifadhiwa.",
      });
    }

    return res.send({
      error: false,
      statusCode: 300,
      data: userSignature,
      message: "Sahihi imepatikana.",
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
  const user = req.user;
  const canEditUsername =
    Array.isArray(user?.userPermissions) && user.userPermissions.includes("update-users");
  const canEditEmail =
    Array.isArray(user?.userPermissions) && user.userPermissions.includes("update-users");

  const formData = {
    user_id: user.id,
  };

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "full_name")) {
    formData.full_name = req.body.full_name;
  } else if (user?.name) {
    formData.full_name = user.name;
  }

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "phone_number")) {
    formData.phone_number = req.body.phone_number;
  }

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "email_notify")) {
    formData.email_notify = req.body.email_notify;
  }

  if (canEditUsername) {
    formData.username = req.body?.username;
  }

  if (canEditEmail) {
    formData.email = req.body?.email;
  }

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "profile_photo")) {
    formData.profile_photo = req.body.profile_photo;
  }

  userModal.updateMyProfile(formData, (success, meta = {}) => {
    let message = success
      ? "Umefanikiwa kurekebisha taarifa zako."
      : "Haujafanikiwa kurekebisha taarifa zako.";

    if (!success && meta.reason === "email_exists") {
      message = "Barua pepe imeshatumika na mtumiaji mwingine.";
    } else if (!success && meta.reason === "username_exists") {
      message = "Jina la mtumiaji limeshatumika.";
    } else if (!success && meta.reason === "not_found") {
      message = "Akaunti haijapatikana.";
    }

    res.send({
      statusCode: success ? 300 : 306,
      message,
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
    delegated_from_user_name: user.delegated_from_user_name || null,
    delegated_until_at: user.delegated_until_at || null,
    delegated_from_user_ids: Array.isArray(user.delegated_from_user_ids)
      ? user.delegated_from_user_ids
      : [],
    active_handover_ids: Array.isArray(user.active_handover_ids)
      ? user.active_handover_ids
      : [],
    primary_handover_id: user.primary_handover_id || null,
    has_active_incoming_handover: Boolean(user.has_active_incoming_handover),
    has_active_outgoing_handover: Boolean(user.has_active_outgoing_handover),
    delegation_scope_type: user.delegation_scope_type || null,
    delegation_status: user.delegation_status || null,
    is_password_changed: user.is_password_changed,
    cheo_office: Number(user.cheo_office),
    jukumu: user.jukumu,
    userPermissions: Array.isArray(user.userPermissions) ? user.userPermissions : [],
  };
}

module.exports = userRouter;
