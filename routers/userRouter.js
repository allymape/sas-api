const express = require("express");
const request = require("request");
const userRouter = express.Router();
var admin_area_url = process.env.LOCATIONS_API_BASE_URL;
const { isAuth, isAdmin, formatDate, generateToken } = require("../utils.js");
var rateLimit = require("express-rate-limit");
const userModal = require("../models/userModal.js");
var admin_area_url = process.env.LOCATIONS_API_BASE_URL;

const loginlimiter = rateLimit({
        windowMs: 20 * 60 * 1000, // 10 minutes
        max: 20, // Limit each IP to 5 requests per `window` (here, per 10 minutes)
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

//login api
userRouter.post("/login", loginlimiter, (req, res, next) => {
     userModal.loginUser( req ,(user , permissions) => {
                  if(user){
                    const userData = [];
                    const permissionData = [];
                      userData.push({
                            id: user[0].id,
                            name: user[0].name,
                            username: user[0].username,
                            phone_no: user[0].phone_no,
                            user_status: user[0].user_status,
                            last_login: user[0].last_login,
                            user_level: user[0].user_level,
                            role_id: user[0].role_id,
                            station_level: user[0].station_level,
                            station_level: user[0].station_level,
                            office: user[0].office,
                            rank_name: user[0].rank_name,
                            status_id: user[0].status_id,
                            rank_level: user[0].rank_level,
                            twofa: user[0].twofa,
                            email: user[0].email,
                    });
                    if(permissionData){
                        for (var i = 0; i < permissions.length; i++) {
                          permissionData.push(permissions[i].permission_name);
                        }
                    }
                    const token = generateToken(user , permissionData);
                    console.log(token)
                    return res.status(200).send({
                                    error: false,
                                    statusCode: 300,
                                    message: "Logged in!",
                                    token,
                                    RoleManage: permissions,
                                    user: userData,
                           });
                  }else{
                     return res.status(400).send({
                       error: true,
                       statusCode: 302,
                       message: "Username or password is incorrect!",
                     });
                  }
           });
          
});

module.exports = userRouter