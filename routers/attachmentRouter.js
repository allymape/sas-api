require("dotenv").config();
const express = require("express");
const attachementRouter = express.Router();
const { isAuth , formatDate , permission } = require("../utils.js");
const db = require("../dbConnection");

attachementRouter.post(
  "/upload-attachment",
  isAuth,
  permission('create-attachments'),
  (req, res) => {
    const {user} = req;
    const {keyString , trackerId , attachment , kiambatisho} = req.body
    const today = formatDate(new Date());
    // console.log(keyString , trackerId , attachment , today)
    db.query(
      `INSERT INTO attachments (secure_token, uploader_token,
        tracking_number, attachment_type_id, user_id, created_at, updated_at, attachment_path) VALUES 
        (
            ${db.escape(keyString)}, 
            ${db.escape(keyString)}, 
            ${db.escape(trackerId)}, 
            ${db.escape(Number(attachment))},
            ${user.id}, 
            "${today}", 
            "${today}",
            ${db.escape(kiambatisho)}
        )`,
      function (error , uploadResult) {
        if (error) console.log(error)
        const success = uploadResult.affectedRows > 0;
         res.send({
          success: success ? true : false ,
          statusCode: success ? 300 : 306,
          message: success ? "Umefanikiwa kupandisha Kiambatisho." : "Kiambatisho hakijapanda",
        });
      }
    );
  }
);
module.exports = attachementRouter;
