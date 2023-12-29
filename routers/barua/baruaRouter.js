require("dotenv").config();
const express = require("express");
const db = require("../../dbConnection");
const baruaRouter = express.Router();
const { isAuth, formatDate, applicationView } = require("../../utils");


// List of
baruaRouter.post("/barua/:tracking_number",isAuth, (req, res) => {
      const tracking_number = req.params.tracking_number;
      db.query(`SELECT application_category_id 
                FROM applications a
                WHERE a.tracking_number = ? AND a.is_approved = 2` , [tracking_number] , (error , application) => {
                    if(error) console.log(error)
                    if(application.length > 0){
                        const main_table = applicationView(application[0].application_category_id)
                         db.query(`SELECT * 
                                   FROM ${main_table} a
                                   WHERE a.tracking_number = ?` , [tracking_number] , (error2 , results) => {
                            if(error2) console.log(error2)
                                res.send({
                                    error: false,
                                    statusCode: 300,
                                    data: results,
                                    message: "Success",
                                });
                         })
                    }else{
                        res.send({
                            error : false,
                            statusCode : 306,
                            data : null,
                            message : 'Not Found'
                        });
                    }
                })
  }
);

module.exports = baruaRouter;
