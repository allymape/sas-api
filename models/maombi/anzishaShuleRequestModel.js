const db = require(`../../dbConnection`)
module.exports = {
  //******** GET A LIST OF APPLICANTS *******************************
  anzishaShuleRequestList : (callback) => {
      var UserLevel = 11;
      var Office = 29;
    db.query(`SELECT school_categories.category as schoolCategory, applications.tracking_number as tracking_number,  
                    applications.created_at as created_at, applications.registry_type_id as registry_type_id,  
                    applications.user_id as user_id, applications.foreign_token as foreign_token,  
                    establishing_schools.school_name as school_name, regions.RegionName as RegionName,  
                    districts.LgaName as LgaName, registry_types.registry as registry  
            FROM    establishing_schools, applications, wards, districts, 
                    school_categories, registry_types,regions 
            WHERE   school_categories.id = establishing_schools.school_category_id AND regions.RegionCode = districts.RegionCode AND  
                    districts.LgaCode = wards.LgaCode AND wards.id = establishing_schools.ward_id  
                    AND establishing_schools.tracking_number = applications.tracking_number 
                    AND registry_types.id = applications.registry_type_id 
                    AND application_category_id = 1 
                    AND is_approved <> 2
                    AND applications.registry_type_id <> 3
                    AND payment_status_id = 2`,
            [1, 2, 3, 2],
      (error, result) => {
        if (error) console.log(error);
        callback(error, result, 10);
      }
    );
  }
};

     