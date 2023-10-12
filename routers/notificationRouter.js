require("dotenv").config();
const express = require("express");
const { isAuth } = require("../utils");
const notificationModel = require("../models/notificationModel");
const notificationRouter = express.Router();


notificationRouter.post("/my-notifications", isAuth, (req, res) => {
    const { user } = req;
     notificationModel.getNotifications(user , (data , counter) => {
        res.send({
                statusCode : 300,
                counter : counter,
                data : data
          });
     } );
});

module.exports = notificationRouter;
