require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
var nodeMailer = require("nodemailer");
const { default: axios } = require("axios");
const { rolesPermissions, translations } = require("./role_permissions");
const db = require('./dbConnection');

const {
  camelCase,
  pascalCase,
  capitalCase,
  headerCase,
  titleCase,
  pathCase,
  snakeCase,
  paramCase,
  dotCase,
  noCase,
  constantCase,
  lowerCase,
  lowerCaseFirst,
  upperCase,
  upperCaseFirst,
  swapCase,
  sentenceCase,
  isLowerCase,
  isUpperCase,
} = require("text-case");
const dateAndTime = require("date-and-time");


const ObjectFuctions = {
  generateToken: (user, permissions) => {
    // console.log(permissions);
    // console.log(user)
    return jwt.sign(
      {
        id: user.id,
        office: user.office,
        zone_id: user.zone_id,
        region_code: user.region_code,
        district_code: user.district_code,
        userPermissions: permissions,
        user_level: Number(user.user_level),
        section_id : Number(user.section_id),
        ngazi: user.ngazi, //wizara,kanda au wilaya
        sehemu: user.sehemu, // KE,ADSA,HICT,W1,K1,MUS,DLSU
        cheo: user.cheo, // W4,W5,K2,K3, USJ1,USJ2,USJ3,ADSA,KE,MUS,
        jukumu: user.jukumu,
      },
      process.env.JWT_SECRET || "the-super-strong-secrect",
      {
        expiresIn: process.env.EXPIRED_IN || "30d",
      }
    );
  },
  getUserOffice : (user) => {
      if (!user.zone_id && !user.district_code) {
          return 1; // Makao Makuu
      }

      if (user.zone_id && !user.district_code) {
          return 2; // Kanda
      }

      if(user.district_code){
          return 3; // Wilaya 
      }
      return 0; // Haijakuwa Specified.
  },

  isAuth: (req, res, next) => {
    const authorization = req.headers.authorization;
    if (authorization) {
      const token = authorization.slice(7, authorization.length); // Bearer XXXXXX
      //  console.log(token);
      jwt.verify(
        token,
        process.env.JWT_SECRET || "the-super-strong-secrect",
        (err, decode) => {
          if (err) {
            res.status(401).send({ message: "Invalid Token" });
          } else {
            req.user = decode;
            next();
          }
        }
      );
    } else {
      res.status(401).send({ message: "No Token" });
    }
  },

  isAdmin: (req, res, next) => {
    if (req.user && req.user.isAdmin) {
      next();
    } else {
      res.status(401).send({ message: "Invalid Admin Token" });
    }
  },
  // Check user permission
  permission: (permission) => {
    // return a middleware
    return (req, res, next) => {
      const { user } = req;
      if (user && user.userPermissions.includes(permission)) {
        next(); // role is allowed, so continue on the next middleware
      } else {
        // console.log(permission, req);
        return res
          .status(403)
          .json({ statusCode: 403, message: "403 Forbidden" }); // user is forbidden
      }
    };
  },
  // Hash text
  hash: (plainText, callback) => {
    var isHashed = false;
    bcrypt.hash(plainText, 10, (err, encryptedText) => {
      if (!err) {
        isHashed = true;
      } else {
        console.log("Unable to hash ", err);
      }
      callback(isHashed, encryptedText);
    });
  },
  // Generate Random Text
  generateRandomText: (length) => {
    const upperCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowerCharacters = "abcdefghijklmnopqrstuvwxyz";
    const numberCharacters = "0123456789";
    const specialCharacters = "$@&*#%-;:><?!+,.^()[]{}~";
    let result = "";
    result += ObjectFuctions.randomString(upperCharacters, 1);
    result += ObjectFuctions.randomString(lowerCharacters, length - 3);
    result += ObjectFuctions.randomString(specialCharacters, 1);
    result += ObjectFuctions.randomString(numberCharacters, 1);
    return result;
  },
  // return random String
  randomString: (string, length) => {
    var result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * string.length);
      result += string.charAt(randomIndex);
    }
    return result;
  },
  arraySum: (array) => {
    let sum = 0;
    if (array.length > 0) {
      sum = array.reduce((sum, number) => sum + number);
    }
    return sum;
  },
  randomInt : (min = 0 , max = 0) => {
    if(max > 0){
      return Math.ceil(Math.random() * max);
    }
    return min;
  },
  generateRandomInt : (min , max , except = []) => {
      var i = ObjectFuctions.randomInt(min , max);
          while (except.includes(i)) {
              i = ObjectFuctions.randomInt(min, max);  
          }
          return i;
  },
  //Send Email
  sendEmail: (mailOptions, callback) => {
    let transporter = nodeMailer.createTransport({
      host: process.env.MAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
    transporter.sendMail(mailOptions, (error, info) => {
      callback(error, info);
    });
  },
  // Mail options
  setMailOptions: (emailTo, subject, html = "", plainText = "") => {
    return {
      from: '"SAS Administrator" <noreply@codebiz.co.tz>', // sender address
      to: emailTo, // list of receivers
      subject: subject, // Subject line
      text: ``, // plain text body
      html: html, // html body
    };
  },
  //Text Case
  camelCase: (text) => {
    //camelCase
    return camelCase(text);
  },
  pascalCase: (text) => {
    //pascalCase
    return pascalCase(text);
  },
  capitalCase: (text) => {
    //Capital Case
    return capitalCase(text);
  },
  headerCase: (text) => {
    //Header-Case
    return headerCase(text);
  },
  titleCase: (text) => {
    //Title Case
    return titleCase(text);
  },
  pathCase: (text) => {
    //pathCase
    return pathCase(text);
  },
  snakeCase: (text) => {
    //snake_case
    return snakeCase(text);
  },
  paramCase: (text) => {
    //param-case
    return paramCase(text);
  },
  dotCase: (text) => {
    //dot.case
    return dotCase(text);
  },
  noCase: (text) => {
    //no case
    return noCase(text);
  },
  constantCase: (text) => {
    //CONSTANT_CASE
    return constantCase(text);
  },
  lowerCase: (text) => {
    //lower case
    return lowerCase(text);
  },
  lowerCaseFirst: (text) => {
    //lOWER CASE FIRST
    return lowerCaseFirst(text);
  },
  upperCase: (text) => {
    //UPPER CASE
    return upperCase(text);
  },
  upperCaseFirst: (text) => {
    // Upper case first
    return upperCaseFirst(text);
  },
  swapCase: (text) => {
    // sWaP cAsE -> SwAp CaSe
    return swapCase(text);
  },
  sentenceCase: (text) => {
    // Sentence case
    return sentenceCase(text);
  },
  isUpperCase: (text) => {
    return isUpperCase(text); // true or false
  },
  isLowerCase: (text) => {
    // true or false
    return isLowerCase(text);
  },
  mergeArray: (array1, array2) => {
    return array1.concat(array2);
  },
  uniqueArray: (array) => {
    // unique permissions (user + system);
    // var duplicated_array = array1.concat(array2);
    // var duplicated_array = ObjectFuctions.mergeArray(array1, array2);
    var unique_array = array.filter((item, pos) => array.indexOf(item) === pos);
    return unique_array;
  },
  promiseRequest: async (admin_area_url, segment, per_page = 2000) => {
    try {
      let response = await axios.get(admin_area_url + segment);
      if (response.status == 200) {
        let responseData = await response.data;
        if (responseData.success) {
          var total_elements = responseData.pagination.total;
          var num_of_pages = Math.ceil(total_elements / per_page);
          var urls = [];
          for (var index = 1; index <= num_of_pages; index++) {
            urls.push(
              admin_area_url +
                segment +
                "?page=" +
                index +
                "&per_page=" +
                per_page
            );
          }

          if (urls.length > 0) {
            const promises = urls.map((url) =>
              axios.get(url).then((response) => response.data.data)
            );
            const results = await Promise.all(promises);
            return results;
          }
        }
      }

      return null;
    } catch (error) {
      console.log("Error " + error);
      return null;
    }
  },

  formatDate: (date, format = "YYYY-MM-DD hh:mm:ss") => {
    return dateAndTime.format(
      typeof date === "string" ? new Date(date) : date,
      format
    );
  },
  initiliazeRolesAndPermissions: (callback, userId = 1) => {
    let roles = [];
    let permissions = [];
    let permission_role = [];
    let all_permission_names = [];
    let all_display_names = [];
    let role_with_permissions = [];
    // build all role , all permissions names and display names
    Object.entries(rolesPermissions).forEach(([roleName, values], i) => {
      let permission_names = [];
      let display_names = [];
      Object.entries(values).forEach(([moduleName, values]) => {
        values.split(",").forEach((value, j) => {
          var module_en_name = moduleName.split("|")[0];
          var module_sw_name = moduleName.split("|")[1];
          var permission_name = lowerCase(
            paramCase(translations["en"][value] + " " + module_en_name)
          );
          var display_name = capitalCase(
            translations["sw"][value] +
              " " +
              (typeof module_sw_name != "undefined" ? module_sw_name : "")
          );
          permission_names.push(permission_name);
          display_names.push(display_name);
          all_display_names.push(display_name);
          all_permission_names.push(permission_name);
        });
      });
      role_with_permissions.push([roleName, permission_names]);
    });
    // find unique permissions and set to all roles and assign appropriate permission to role
    if (all_permission_names.length > 0) {
      role_with_permissions.forEach(
        ([roleName, rolePermissions], roleIndex) => {
          var unique_permission_names =
            ObjectFuctions.uniqueArray(all_permission_names);
          var unique_display_names =
            ObjectFuctions.uniqueArray(all_display_names);
          var roleId = roleIndex + 1;
          // //  Push roles
          roles.push([
            roleId,
            roleName,
            1,
            ObjectFuctions.formatDate(new Date()),
            userId,
          ]);
          unique_permission_names.forEach(
            (permission_name, permissionIndex) => {
              var permissionId = permissionIndex + 1;
              if (rolePermissions.includes(permission_name)) {
                console.log(
                  roleName + " has permissions to " + permission_name,
                  "role_id " + roleId,
                  "permission_id " + permissionId
                );
                // push permissions view-users, etc
                permissions.push([
                  permissionId,
                  permission_name,
                  unique_display_names[permissionIndex],
                  1,
                  ObjectFuctions.formatDate(new Date()),
                  userId,
                ]);
                // push permission role ids
                permission_role.push([
                  roleId,
                  permissionId,
                  1,
                  ObjectFuctions.formatDate(new Date()),
                  userId,
                ]);
              }
            }
          );
        }
      );
    }
    // console.log(roles , permissions , permission_role);
    callback(roles, permissions, permission_role);
  },
  selectConditionByRanks : (user) => {
    const { office } = user;
    let $select = "";
    switch (office) {
      case 1:
        $select = `r.RegionName AS region`;
        break;
      case 2:
        $select = `d.LgaName AS region`;
        break;
      case 3:
        $select = `w.WardName AS region`;
        break;
      default:
        break;
    }
    return $select;
  },
  selectConditionByTitle : (user) => {
    const {cheo , ngazi , id , sehemu , district_code , zone_id} = user;
      // console.log('hapa',user);
        var str = ``;
        if(ngazi == 'wizara'){
              if(sehemu == 'dahrm' || sehemu == 'masijala'  || sehemu == 'registry'){
                str += ` AND is_approved = 2`;
              }else{
                str += ` AND applications.staff_id = ${id} AND is_approved <> 2`;
              }
        }else if(ngazi == 'kanda'){
              //  K1 && Officers
              str += ` AND applications.staff_id = ${id} AND is_approved <> 2 AND regions.zone_id = ${zone_id}`;
        }else if(ngazi == 'wilaya'){
              //  W1
              if(cheo == 'w1'){ 
                str += ` AND (applications.staff_id = ${id} OR  applications.staff_id IS NULL) AND is_approved <> 2 `;
              }else{ //Officer W1
                str += ` AND applications.staff_id = ${id} AND is_approved <> 2`;
              }
              str += ` AND districts.LgaCode = "${district_code}"`;
        }else{
              str += ` AND applications.staff_id = -1`;
        }
        return str;
  },
  filterByUserOffice : (user , start_with = '' , table_zone_alias = 'r.zone_id' , table_lga_alias = 'd.LgaCode' , more_sql_filter='') => {
    const {office , zone_id  , district_code} = user;
    
    let $where = "";
       switch (office) {
         case 1:
           $where = ``;
           break;
         case 2:
           $where = `${start_with} ${table_zone_alias} = ${zone_id} ${more_sql_filter}`;
           break;
         case 3:
           $where = `${start_with} ${table_lga_alias} = "${district_code}" ${more_sql_filter} `;
           break;
         default:
           $where = ``;
           break;
       }
      return $where;
  },
  schoolLocationsSqlJoin: () => {
    return `JOIN streets   st ON st.id = e.village_id
            JOIN wards      w ON w.WardCode = e.ward_id
            JOIN districts  d ON d.LgaCode = w.LgaCode
            JOIN regions    r ON r.RegionCode = d.RegionCode
            #LEFT JOIN zones z ON  z.id = r.zone_id`;
    // this need  to be reviewed wardCode
  },
  establishedApplicationRegisteredSchoolsSqlJoin: () => {
    return `LEFT JOIN applications a ON a.tracking_number = e.tracking_number
            LEFT JOIN school_registrations s ON s.establishing_school_id = e.id`;
  },
  applicationEstablishedRegisteredSchoolsSqlJoin: () => {
    return `LEFT JOIN establishing_schools e ON a.tracking_number = e.tracking_number
            LEFT JOIN school_registrations s ON s.establishing_school_id = e.id`;
  },
  registeredSchoolsEstablishedApplicationSqlJoin: () => {
    return `JOIN establishing_schools e ON s.establishing_school_id = e.id
            JOIN  applications a ON a.tracking_number = e.tracking_number`;
  },
};

module.exports = ObjectFuctions;