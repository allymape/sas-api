require("dotenv").config();
const express = require("express");
const request = require("request");
const schoolRouter = express.Router();
var admin_area_url = process.env.LOCATIONS_API_BASE_URL;
const { isAuth, isAdmin, formatDate, promiseRequest } = require("../utils.js");
const schoolModel = require("../models/schoolModel.js");


// List of schools
schoolRouter.get("/all-schools", isAuth, (req, res, next) => {
  const per_page = parseInt(req.query.per_page);
  const page = parseInt(req.query.page);
  const offset = (page - 1) * per_page;
  const keyword = req.body.tafuta !== undefined ? req.body.tafuta : null;
  const type = req.body.aina !== undefined ? req.body.aina : null;
  const owner = req.body.umiliki !== undefined ? req.body.umiliki : null;
 
  schoolModel.getAllSchools(offset, 
          per_page, 
          keyword,
          type , 
          owner , 
          (error, schools, numRows) => {
    // console.log(schools.length);
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? [] : schools,
      numRows: numRows,
      message: "Orodha ya Shule.",
    });
  });
});
// School Filters
schoolRouter.get("/school-filters", isAuth, function (req, res) {
  schoolModel.getSchoolsFilters((success, categories, ownerships) => {
    res.send({
      statusCode: success ? 300 : 306,
      data: {
        categories: success ? categories : [],
        ownerships: success ? ownerships : [],
      },
      message: success ? "Success" : "Failed",
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
// Edit School
schoolRouter.get(`/edit-school/:id` , (req , res) => {
     const tracking_number = req.params.id;
     schoolModel.editSchool(tracking_number , (error , school) => {
        res.send({
          error : error ? true : false,
          statusCode : error ? 306 : 300,
          data : school,
          message : error ? 'Kuna Tatizo' : 'School Found'
        });
     });
})

// Update School
schoolRouter.put(`/update-school/:id` , (req , res) => {
    const tracking_number = req.params.id;
    const data = req.body;
    schoolModel.updateSchool(tracking_number , data , (error) => {
         res.send({
           error: error ? true : false,
           statusCode: error ? 306 : 300,
           message: error ? "Haujafanikiwa kuna tatizo" : "Umefanikiwa kufanya mabadiliko",
         });
    });
})

// Fetch all schools from Schools API and store
schoolRouter.post("/existing_schools", isAuth, async (req, res, next) => {
      var established_schools = [];
      var applications = [];
      var school_registrations = [];
     
       var results = await promiseRequest(admin_area_url , 'schools');
           if(results){
             //iterate through all datas received and store  to established_schools, applications and school_registrations  array
             for (let i = 0; i < results.length; i++) {
               results[i].forEach((school_content) => {
                      var id = school_content.id;
                      var secure_token = school_content.school_uid;
                      var school_name = school_content.short_name;
                      var type_id = school_content.type_id;
                      var tracking_number =
                        (type_id == 1
                          ? "EA"
                          : type_id == 2
                          ? "EM"
                          : type_id == 3
                          ? "ES"
                          : type_id == 4
                          ? "EC"
                          : null) +
                        "-20001008-" +
                        id;
                      var registration_number = school_content.registration_number;
                      var registration_date = school_content.registration_date ? formatDate(school_content.registration_date , 'YYYY-MM-DD 00:00:00')  : null ;
                      var phone_number = school_content.phone_number;
                      var ward_uid = school_content.ward_uid;
                      var village_id = school_content.village_id
                      var email = school_content.email;
                      var address = school_content.address;
                      var registration_status = 1;
                      var stage = 3;
                      var user_id = 71;
                      var userId = 71;
                      var application_category = 4;
                      var registry_type_id = school_content.ownership_id;
                      var is_for_disabled = 0;
                      var is_approved = 2;
                      var status_id = 1;
                      var is_complete = 1;
                      var is_hostel = 0;
                      var created_at = formatDate(new Date());
                      var updated_at = formatDate(new Date());

                      established_schools.push([
                        id,
                        school_name,
                        secure_token,
                        phone_number,
                        tracking_number,
                        is_for_disabled,
                        is_hostel,
                        stage,
                        ward_uid,
                        village_id,
                        email,
                        address,
                        type_id,
                        created_at,
                        updated_at,
                      ]);
                      applications.push([
                        id,
                        userId,
                        secure_token,
                        secure_token,
                        tracking_number,
                        user_id,
                        application_category,
                        registry_type_id,
                        is_approved,
                        status_id,
                        is_complete,
                        created_at,
                        updated_at,
                      ]);
                      
                      school_registrations.push([
                        id,
                        secure_token,
                        id,
                        tracking_number,
                        registration_date,
                        registration_date,
                        registration_number,
                        registration_status,
                        created_at,
                        registration_date,
                      ]);
                      // console.log(registration_date == "0000-00-00 00:00:00" ? 0 : 1);
               });
             }
             
             if (
               established_schools.length > 0 ||
               applications.length > 0 ||
               school_registrations.length > 0
             ) {
               //store data to database
               schoolModel.storeSchools(
                 established_schools,
                 applications,
                 school_registrations,
                 (isSuccess) => {
                   console.log("schools created successfully");
                   res.send({
                     statusCode: isSuccess ? 300 : 306,
                     message: isSuccess
                       ? "Umefanikiwa kupakia taarifa za Shule kikamilifu."
                       : "Haujafanikiwa kupakia Shule wasiliana na Msimamizi wa Mfumo.",
                   });
                 }
               );
             } else {
               res.send({
                 statusCode: 306,
                 message:
                   "Haujafanikiwa kupakia Shule wasiliana na Msimamizi wa Mfumo.",
               });
             }
           }else{
              res.send({
                statusCode: 306,
                message:
                  "Haujafanikiwa kupakia Shule wasiliana na Msimamizi wa Mfumo.",
              });
           }
});

// // Store Schools
// schoolRouter.get("/existingSchools", isAuth, (req, res, next) => {
//   request(
//     {
//       url: admin_area_url + "schools",
//       method: "GET",
//       headers: {
//         //   'Authorization': 'Bearer' + " " + req.session.Token,
//         "Content-Type": "application/json",
//       },
//     },
//     (error, body) => {
//       if (error) {
//         console.log(new Date() + ": fail to UsajiliGraph " + error);
//         res.send("failed");
//       }
//       if (body !== undefined) {
//         var jsonData = JSON.parse(body);
//         var total_elements = jsonData.pagination.total;
//         var per_page = 1000;
//         var num_of_pages = Math.ceil(total_elements / per_page);
//         var success = false;
//         for (var index = 1; index <= num_of_pages; index++) {
//           request(
//             {
//               url:admin_area_url +"schools?per_page=" +per_page +"&page=" +index,
//               method: "GET",
//               headers: {
//                 //   'Authorization': 'Bearer' + " " + req.session.Token,
//                 "Content-Type": "application/json",
//               },
//               //json: {trackingNo: trackingNo}
//             },
//             (error, response, body) => {
//               if (error) {
//                 console.log(new Date() + ": fail to UsajiliGraph " + error);
//                 res.send("failed");
//               }
//               if (body !== undefined) {
//                 var jsonData = JSON.parse(body);
//                         var school_content = jsonData.data;
//                         var established_schools = [];
//                         var applications = [];
//                         var school_registrations = [];
//                         var success = false;
//                         //   console.log(jsonData.response.content)
//                         for (var i = 0; i < school_content.length; i++) {
//                             var id = school_content.id;
//                             var secure_token = school_content.school_uid;
//                             var school_name = school_content.short_name;
//                             var type_id = school_content.type_id;
//                             var tracking_number = (type_id == 1 ? "EA" : (type_id == 2 ? "EM" : (type_id == 3 ? "ES"  : (type_id == 4 ? "EC" : null)))) + "-20001008-"+ id;
//                             var registration_number = school_content.registration_number;
//                             var registration_date = school_content.registration_date;
//                             var phone_number = school_content.phone_number;
//                             var ward_uid = school_content.ward_uid;
//                             var village_uid = school_content.village_uid;
//                             var email = school_content.email;
//                             var address = school_content.address;
//                             // var type = school_content.type;
//                             var registration_status = 1;
//                             var stage = 3;
//                             var user_id = 71;
//                             var userId = 71;
//                             var application_category = 4;
//                             var registry_type_id = 3;
//                             var is_for_disabled=0;
//                             var is_approved = 2;
//                             var status_id = 1;
//                             var is_complete=1;
//                             var is_hostel=0;
//                             var created_at = formatDate(new Date());
//                             var updated_at = formatDate(new Date());

//                             established_schools.push([id,school_name,secure_token,phone_number,tracking_number,is_for_disabled,is_hostel,stage,ward_uid,village_uid,email,address,type_id,created_at,updated_at,]);
//                             applications.push([id, userId,secure_token , secure_token,tracking_number , user_id , application_category, registry_type_id , is_approved, status_id, is_complete , created_at, updated_at]);
//                             school_registrations.push([id, secure_token, id, tracking_number , registration_date,registration_number, registration_status , created_at, updated_at]);

//                         }
//                         // store schools
//                         schoolModel.storeSchools(
//                           established_schools,
//                           applications,
//                           school_registrations,
//                           //callback function
//                           (success) => {
//                             console.log("Schools migrated successfully");
//                             if (!success) {
//                               return res.send({
//                                 statusCode: 306,
//                                 message:
//                                   "Hajafanikiwa kuvuta Shule zote kuna tatizo",
//                               });
//                             }
//                           }
//                         );
//               }
//             }
//           );
//         }

//             return res.send({
//                 statusCode: 300,
//                 message: "Imefanikiwa kuvuta Shule",
//             });
//       }
//     }
//   );
// });

module.exports = schoolRouter;
