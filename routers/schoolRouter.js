require("dotenv").config();
const express = require("express");
const request = require("request");
const schoolRouter = express.Router();
var admin_area_url = process.env.LOCATIONS_API_BASE_URL;
const { isAuth, isAdmin, formatDate, promiseRequest, generateRandomInt, generateRandomText, randomString, permission } = require("../utils.js");
const schoolModel = require("../models/schoolModel.js");
const sharedModel = require("../models/sharedModel.js");


// List of schools
schoolRouter.get("/all-schools", isAuth, (req, res, next) => {
  const per_page = parseInt(req.query.per_page);
  const page = parseInt(req.query.page);
  const offset = (page - 1) * per_page;
  const keyword = req.body.tafuta !== undefined ? req.body.tafuta : null;
  const type = req.body.aina !== undefined ? req.body.aina : null;
  const owner = req.body.umiliki !== undefined ? req.body.umiliki : null;
  const sign = req.body.sign;
  schoolModel.getAllSchools(offset, 
          per_page, 
          keyword,
          type , 
          owner , 
          sign,
          (error, schools, numRows) => {
    // console.log(schools.length);
    // console.log(schools);
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
  
  sharedModel.getSchoolCategories( (categories) => {
      sharedModel.getSchoolOwnerships((ownerships) => {
        res.send({
          statusCode: 300,
          data: {
            categories: categories,
            ownerships: ownerships,
          }
        })
      })
  })


  // schoolModel.getSchoolsFilters((success, categories, ownerships) => {
   
  // });
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

// Create School
schoolRouter.post(`/add-school` , (req , res) => {
    schoolModel.lastSchoolId( (last_id) => {
        const data = req.body;
        // const {school_name , kata , mtaa, category ,registration_date, registration_number , ownership} = data;
        var established_schools = [];
        var applications = [];
        var school_registrations = [];
        var owners = [];
        var applicants = [];
        // start
        var id = last_id + 1;
        var secure_token = randomString(
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
          20
        );
        var school_name = data.school_name;
        var type_id = data.category;
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
        var registration_number = data.registration_number;
        var registration_date = data.registration_date
          ? formatDate(data.registration_date, "YYYY-MM-DD 00:00:00")
          : null;
        var phone_number = '';
        var ward_uid = data.kata;
        var village_id = data.mtaa;
        var email = '';
        var address = data.address;
        var registration_status = 1;
        var stage = 3;
        var user_id = 10;
        var staff_id = null;
        var application_category = 4; // generateRandomInt(0,14 , [3]);
        var registry_type_id = data.ownership; //generateRandomInt(0,3);//school_content.ownership_id;
        var is_for_disabled = 0;
        var is_approved = 2; //generateRandomInt(0,2);
        var status_id = 1;
        var is_complete = 1;
        var is_hostel = 0;
        var owner_name = data.owner;
        var applicant_name = school_name;
        var created_at = formatDate(new Date());
        var updated_at = formatDate(new Date());
        applications.push([
          id,
          staff_id,
          secure_token,
          secure_token,
          tracking_number,
          user_id,
          application_category,
          registry_type_id,
          is_approved,
          status_id,
          is_complete,
          2,
          null,
          created_at,
          updated_at,
        ]);

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
          updated_at,
        ]);
        
        owners.push([id, secure_token, id, tracking_number,owner_name, created_at]);

        applicants.push([
          id,
          secure_token,
          applicant_name,
          ward_uid,
          created_at,
        ]);
        schoolModel.checkIfExistSchool(registration_number , (exist) => {
             if(exist){
                  res.send({
                      error: true,
                      statusCode: 306,
                      message: "Namba ya Usajili imeshasajiliwa."
                  });
             }else{
              schoolModel.storeSchools( established_schools, applications, school_registrations,owners, applicants , (success) => {
              // console.log(success)
                res.send({
                    error: success ? false : true,
                    statusCode: success ? 300 : 306,
                    message: success ? "Umefanikiwa kuongeza shule." : "Haujafanikiwa kuna tatizo."
                });
        });
             }
        })
    });
})
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
    schoolModel.updateSchool(tracking_number , data , (error , message) => {
         res.send({
           error: error ? true : false,
           statusCode: error ? 306 : 300,
           message: message,
         });
    });
})

// change school name
schoolRouter.post("/change-shule", isAuth, permission('update-school-name'), (req, res) => {
  schoolModel.changeSchoolName(req , (success) => {
      res.send({
                success: success,
                statusCode: success ? 300 : 306,
                message: success ? "Umefanikiwa Kubadili jina la shule" : "Haujafanikiwa kubadili jina",
          });
  })
});

// Fetch all schools from Schools API and store
schoolRouter.post("/existing_schools", isAuth, async (req, res, next) => {
      var established_schools = [];
      var applications = [];
      var school_registrations = [];
      var owners = [];
      var applicants = [];
     
       var results = await promiseRequest(admin_area_url , 'schools');
           if(results){
             //iterate through all datas received and store  to established_schools, applications and school_registrations  array
             for (let i = 0; i < results.length; i++) {
               results[i].forEach((school_content) => {
                      var id = school_content.id;
                      var secure_token = randomString(
                        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
                        20
                      );
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
                      var village_id = school_content.village_uid;
                      var email = school_content.email;
                      var address = school_content.address;
                      var registration_status = 1;
                      var stage = 3;
                      var user_id = 10;
                      var staff_id = null;
                      var application_category = 4;// generateRandomInt(0,14 , [3]);
                      var registry_type_id = school_content.ownership_id; //generateRandomInt(0,3);//school_content.ownership_id;
                      var is_for_disabled = 0;
                      var is_approved = 2;//generateRandomInt(0,2);
                      var status_id = 1;
                      var is_complete = 1;
                      var is_hostel = 0;
                      var owner_name = school_content.owner;
                      var applicant_name = school_name;
                      var created_at = formatDate(new Date());
                      var updated_at = formatDate(new Date());
                      // console.log(village_id);
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
                        staff_id,
                        secure_token,
                        secure_token,
                        tracking_number,
                        user_id,
                        application_category,
                        registry_type_id,
                        is_approved,
                        status_id,
                        is_complete,
                        2,
                        registration_date,
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
                      
                      owners.push([
                        id,
                        secure_token,
                        id,
                        tracking_number,
                        owner_name,
                        created_at
                      ]);

                      applicants.push([
                        id,
                        secure_token,
                        applicant_name,
                        ward_uid,
                        created_at
                      ])
               });
             }
             
             if (
               established_schools.length > 0 ||
               applications.length > 0 ||
               school_registrations.length > 0 ||
               owners.length > 0 ||
               applicants.length > 0
             ) {
               //store data to database
               schoolModel.storeSchools(
                 established_schools,
                 applications,
                 school_registrations,
                 owners,
                 applicants,
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



module.exports = schoolRouter;
