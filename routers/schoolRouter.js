require("dotenv").config();
const express = require("express");
const request = require("request");
const schoolRouter = express.Router();
var admin_area_url = process.env.LOCATIONS_API_BASE_URL;
const { isAuth, isAdmin, formatDate } = require("../utils.js");
const schoolModel = require("../models/schoolModel.js");
// schoolRouter.use(
//   session({
//     secret: "secret",
//     resave: true,
//     saveUninitialized: true,
//   })
// );

// List of schools
schoolRouter.get("/allschools", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  schoolModel.getAllSchools(offset, per_page, (error, schools, numRows) => {
    console.log(schools);
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? [] : schools,
      numRows: numRows,
      message: "List of schools.",
    });
  });
});

// Look for schools
schoolRouter.get("/look_for_schools", isAuth, (req, res, next) => {
 var per_page = parseInt(req.query.per_page);
 var page = parseInt(req.query.page);
 var offset = (page - 1) * per_page;
 var search = req.body.search;
  schoolModel.lookForSchools(offset , per_page , search, (error, schools) => {
    var data = [];
       schools.forEach(school => {
          data.push({
            id: school.id,
            text: school.text + ` (${school.registration_number} - ${school.region} ${school.district} ${school.ward})`,
          });
       });
    res.send({
      statusCode: error ? 306 : 300,
      data: error ? [] : data,
      message: error ? "Something went wrong" : "List of schools",
    });
  });
});
// Store Schools
schoolRouter.get("/existingSchools", isAuth, (req, res, next) => {
  request(
    {
      url: admin_area_url + "schools",
      method: "GET",
      headers: {
        //   'Authorization': 'Bearer' + " " + req.session.Token,
        "Content-Type": "application/json",
      },
    },
    (error, response, body) => {
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
              url:admin_area_url +"schools?per_page=" +per_page +"&page=" +index,
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
                        var school_content = jsonData.data;
                        var established_schools = [];
                        var applications = [];
                        var school_registrations = [];
                        var success = false;
                        //   console.log(jsonData.response.content)
                        for (var i = 0; i < school_content.length; i++) {
                            var id = school_content[i].id;
                            var secure_token = school_content[i].school_uid;
                            var school_name = school_content[i].short_name;
                            var type_id = school_content[i].type_id;
                            var tracking_number = (type_id == 1 ? "EA" : (type_id == 2 ? "EM" : (type_id == 3 ? "ES"  : (type_id == 4 ? "EC" : null)))) + "-20001008-"+ id;
                            var registration_number = school_content[i].registration_number;
                            var registration_date = school_content[i].registration_date;
                            var phone_number = school_content[i].phone_number;
                            var ward_uid = school_content[i].ward_uid;
                            var village_uid = school_content[i].village_uid;
                            var email = school_content[i].email;
                            var address = school_content[i].address;
                            // var type = school_content[i].type;
                            var registration_status = 1;
                            var stage = 3;
                            var user_id = 71;
                            var userId = 71;
                            var application_category = 4;
                            var registry_type_id = 3;
                            var is_for_disabled=0;
                            var is_approved = 2;
                            var status_id = 1;
                            var is_complete=1;
                            var is_hostel=0;
                            var created_at = formatDate(new Date());
                            var updated_at = formatDate(new Date());

                            established_schools.push([id,school_name,secure_token,phone_number,tracking_number,is_for_disabled,is_hostel,stage,ward_uid,village_uid,email,address,type_id,created_at,updated_at,]);
                            applications.push([id, userId,secure_token , secure_token,tracking_number , user_id , application_category, registry_type_id , is_approved, status_id, is_complete , created_at, updated_at]);
                            school_registrations.push([id, secure_token, id, tracking_number , registration_date,registration_number, registration_status , created_at, updated_at]);

                        }
                        // store schools
                        schoolModel.storeSchools(
                          established_schools,
                          applications,
                          school_registrations,
                          //callback function
                          (success) => {
                            console.log("Schools migrated successfully");
                            if (!success) {
                              return res.send({
                                statusCode: 306,
                                message:
                                  "Hajafanikiwa kuvuta Shule zote kuna tatizo",
                              });
                            }
                          }
                        );
              }
            }
          );
        }

            return res.send({
                statusCode: 300,
                message: "Imefanikiwa kuvuta Shule",
            });
      }
    }
  );
});

module.exports = schoolRouter;
