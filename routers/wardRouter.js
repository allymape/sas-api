require("dotenv").config();
const express = require("express");
const request = require("request");
const wardRouter = express.Router();
var admin_area_url = process.env.LOCATIONS_API_BASE_URL;
const { isAuth, isAdmin, formatDate } = require("../utils.js");
const wardModel = require("../models/wardModel.js");
// wardRouter.use(
//   session({
//     secret: "secret",
//     resave: true,
//     saveUninitialized: true,
//   })
// );

// List of Wards
wardRouter.get("/allwards", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
        wardModel.getAllWards(
            offset,
            per_page,
            (error, wards, numRows) => {
            // console.log(wards);
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? [] : wards,
                numRows: numRows,
                message: "List of Wards.",
            });
            }
        );
});

// Store Wards
wardRouter.get("/usajiliKata", isAuth, (req, res, next) => {
  request(
    {
      url: admin_area_url + "wards",
      method: "GET",
      headers: {
        //   'Authorization': 'Bearer' + " " + req.session.Token,
        "Content-Type": "application/json",
      },
    },
     (error, response, body) =>  {
                    if (error) {
                        console.log(new Date() + ": fail to UsajiliGraph " + error);
                        res.send("failed");
                    }
                    if (body !== undefined) {
                        var jsonData = JSON.parse(body);
                        var total_elements = jsonData.pagination.total;
                        var per_page = 1000;
                        var num_of_pages = Math.ceil(total_elements / per_page);
                        var success = false;
                        for (var index = 1; index <= num_of_pages; index++) {
                            request(
                                {
                                url:admin_area_url + "wards?per_page=" +per_page +"&page=" +index,
                                method: "GET",
                                headers: {
                                    //   'Authorization': 'Bearer' + " " + req.session.Token,
                                    "Content-Type": "application/json",
                                },
                                //json: {trackingNo: trackingNo}
                                },
                                (error, response, body) => {
                                        if (error) {
                                            console.log(new Date() + ": fail to UsajiliGraph " + error);
                                            res.send("failed");
                                        }
                                    if (body !== undefined) {
                                            var jsonData = JSON.parse(body);
                                            var ward_content = jsonData.data;
                                            var values = [];
                                            var success = false;
                                            //   console.log(jsonData.response.content)
                                            for (var i = 0; i < ward_content.length; i++) {
                                                var ward_id = ward_content[i].id;
                                                var ward_name = ward_content[i].name;
                                                var ward_code = ward_content[i].ward_uid;
                                                var council_code = ward_content[i].district_uid;
                                                var created_at = formatDate(new Date());
                                                var updated_at = formatDate(new Date());
                                                values.push([
                                                        ward_id,
                                                        ward_code,
                                                        ward_name,
                                                        council_code,
                                                        created_at,
                                                        updated_at,
                                                ]);
                                        }
                                        
                                        wardModel.storeWards(values, (success) => {
                                               console.log("Wards created successfully");  
                                               if(!success){
                                                    return res.send({
                                                        statusCode:  306 ,
                                                        message: "Hajafanikiwa kupakia Kata zote kuna tatizo"
                                                    });
                                               }
                                        });
                                       
                                        
                                    }
                                });
                        }
                  
                        return res.send({
                          statusCode:  300 ,
                          message: "Imefanikiwa kupakia Kata mpya"
                       });
    }
    });
});

module.exports = wardRouter;
