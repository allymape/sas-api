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
  localeLowerCase,
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
        kanda : user.kanda,
        region_code: user.region_code,
        district_code: user.district_code,
        userPermissions: permissions,
        user_level: Number(user.user_level),
        section_id: Number(user.section_id),
        ngazi: user.ngazi, //wizara,kanda au wilaya
        sehemu: user.sehemu, // KE,ADSA,HICT,W1,K1,MUS,DLSU
        cheo: user.cheo, // W4,W5,K2,K3, USJ1,USJ2,USJ3,ADSA,KE,MUS,
        jukumu: user.jukumu,
      },
      process.env.JWT_SECRET || "the-super-strong-secrect",
      {
        expiresIn: process.env.EXPIRED_IN || "1800s",
      }
    );
  },
  getUserOffice: (user) => {
    if (!user.zone_id && !user.district_code) {
      return 1; // Makao Makuu
    }

    if (user.zone_id && !user.district_code) {
      return 2; // Kanda
    }

    if (user.district_code) {
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
      res.status(401).send({ message: `You are not authenticated.` });
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
  randomInt: (min = 0, max = 0) => {
    if (max > 0) {
      return Math.ceil(Math.random() * max);
    }
    return min;
  },
  generateRandomInt: (min, max, except = []) => {
    var i = ObjectFuctions.randomInt(min, max);
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

  formatDate: (date, format = "YYYY-MM-DD HH:mm:ss") => {
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
                // console.log(
                //   roleName + " has permissions to " + permission_name,
                //   "role_id " + roleId,
                //   "permission_id " + permissionId
                // );
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
  selectConditionByRanks: (user) => {
    const { office } = user;
    let $select = "";
    switch (Number(office)) {
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
  selectStaffsBySection: (user) => {
    const { cheo, ngazi, id, sehemu, district_code, zone_id } = user;
    // console.log('hapa',user);
    var str = `AND s.id <> ${id} `;
    if (ngazi == "wizara") {
      if (cheo == "ke") {
        str += ` OR LOWER(r.name) IN ('adsa','mus','dsne') `;
      }
      // if (sehemu == "dahrm" || sehemu == "masjala" || sehemu == "registry") {
      //   str += ` AND is_approved = 2`;
      // } else {
      //   str += ` AND applications.staff_id = ${id} AND is_approved <> 2`;
      // }
    } else if (ngazi == "kanda") {
      //  K1 && Officers
      str += ` AND s.zone_id = ${zone_id} AND s.district_code IS NULL`;
    } else if (ngazi == "wilaya") {
      str += ` AND s.zone_id IS NOT NULL AND s.district_code = "${district_code}"`;
    } else {
      str += ` AND s.id = -1`;
    }
    return str;
  },
  getMyNextBoss: (user, application_category, staff_id) => {
    const { cheo, ngazi, id, sehemu, district_code, zone_id } = user;
   
    if (staff_id == 0 || staff_id == "" || staff_id == null) {
      var str = ``;
      // Business Flow base on application category
      if ([1, 2, 7, 8].includes(application_category)) {
        // W1->ADSA->KE
        switch (cheo) {
          case "w1":
            str = ` AND LOWER(r.name) =  'adsa' AND s.zone_id IS NULL `;
            break;
          case "adsa":
            str = ` AND LOWER(r.name) =  'ke' AND s.zone_id IS NULL `;
            break;
          default:
            str = ` AND s.id < -1`;
            break;
        }
      }
      if ([4, 5, 6, 12, 13, 14].includes(application_category)) {
        // W1->K1->MUS->KE
        switch (cheo) {
          case "w1":
            str = ` AND LOWER(r.name) =  'k1' AND s.zone_id = ${zone_id} `;
            break;
          case "k1":
            str = ` AND LOWER(r.name) =  'mus' AND s.zone_id IS NULL `;
            break;
          case "mus":
            str = ` AND LOWER(r.name) =  'ke' AND s.zone_id IS NULL `;
            break;
          case "adsa":
            str = ` AND LOWER(r.name) =  'ke' AND s.zone_id IS NULL `;
            break;
          default:
            str = ` AND s.id < -1`;
            break;
        }
      }
      if ([9, 10, 11].includes(application_category)) {
        //W1->K1->ADSA->KE
        switch (cheo) {
          case "w1":
            str = ` AND LOWER(r.name) =  'k1' AND s.zone_id = ${zone_id} `;
            break;
          case "k1":
            str = ` AND LOWER(r.name) =  'adsa' AND s.zone_id IS NULL `;
            break;
          case "adsa":
            str = ` AND LOWER(r.name) =  'ke' AND s.zone_id IS NULL `;
            break;
          default:
            str = ` AND s.id < -1`;
            break;
        }
      }
      return str;
    }
    return ` AND s.id < -1`;
  },
  selectConditionByTitle: (user, useAlias = false , notification = false) => {
    const { cheo, ngazi, id, sehemu, district_code, zone_id, jukumu } = user;
    // console.log(sehemu);
    var str = ``;
    // console.log(jukumu)
    if (ngazi == "wizara") {
      if (
        (ObjectFuctions.lowerCase(jukumu) == "super-admin" ||
          ObjectFuctions.lowerCase(jukumu) == "super admin") &&
        !["w1", "k1", "adsa", "masjala", "mus", "dlsu", "dsne", "ke"].includes(
          sehemu
        )
      ) {
        // return `AND is_approved <> 2`;
        if (notification) {
          return ` AND 1 < 0`;
        }
        return ``;
      }

      if (sehemu == "dahrm" || sehemu == "masjala" || sehemu == "registry") {
          if (notification) {
            return ` AND 1 < 0`; 
          }
        str += ``;
        // str += ` AND is_approved = 2`;
      } else {
        // console.log(cheo , id)
        str += ` AND ${useAlias ? "a.staff_id" : "applications.staff_id"} = ${id}`;
        // str += ` AND ${useAlias ? "a.staff_id" : "applications.staff_id"} = ${id} 
        // AND is_approved <> 2`;
      }

      return str;
    } else if (ngazi == "kanda") {
      //  K1 && Officers
      // str += ` AND ${useAlias ? "a.staff_id" : "applications.staff_id"} = ${id} AND is_approved <> 2 AND ${useAlias ? "r.zone_id" : "regions.zone_id"} = ${zone_id}`;
      str += ` AND ${useAlias ? "a.staff_id" : "applications.staff_id"} = ${id} AND ${useAlias ? "r.zone_id" : "regions.zone_id"} = ${zone_id}`;
    } else if (ngazi == "wilaya") {
      //  W1
      if (cheo == "w1") {
        // console.log("I am w1 " + user.id);
        str += ` AND (${
          useAlias ? "a.staff_id" : "applications.staff_id"
        } = ${id} OR  ${
          useAlias ? "a.staff_id" : "applications.staff_id"
        } IS NULL)`;
      } else {
        //Officer W1
        console.log("I am w1 Officer");
        str += ` AND ${
          useAlias ? "a.staff_id" : "applications.staff_id"
        } = ${id}`;
      }
      str += ` AND ${
        useAlias ? "d.LgaCode" : "districts.LgaCode"
      } = "${district_code}"`;
      return str;
    } else {
      str += ` AND ${useAlias ? "a.staff_id" : "applications.staff_id"} = -1`;
      return str;
    }
    return str;
  },

  filterByUserOffice: (
    user,
    start_with = "",
    table_zone_alias = "r.zone_id",
    table_lga_alias = "d.LgaCode",
    more_sql_filter = ""
  ) => {
    const { office, zone_id, district_code } = user;
    let $where = ``;
    switch (Number(office)) {
      case 1:
        break;
      case 2:
        $where = `${start_with} ${table_zone_alias} = ${zone_id} AND ${table_lga_alias} IS NULL ${more_sql_filter}`;
        break;
      case 3:
        $where = `${start_with} ${table_lga_alias} = "${district_code}" ${more_sql_filter} `;
        break;
      default:
        $where = `${start_with} 1 < 1 `;
        break;
    }
    return $where;
  },
  schoolLocationsSqlJoin: () => {
    return `LEFT JOIN streets   st ON st.StreetCode = e.village_id
            LEFT JOIN wards      w ON w.WardCode = e.ward_id
            LEFT JOIN districts  d ON d.LgaCode = w.LgaCode
            LEFT JOIN regions    r ON r.RegionCode = d.RegionCode
            LEFT JOIN zones z ON  z.id = r.zone_id`;
    // this need  to be reviewed wardCode
  },
  establishedApplicationRegisteredSchoolsSqlJoin: () => {
    return `JOIN applications a ON a.tracking_number = e.tracking_number
            JOIN school_registrations s ON s.establishing_school_id = e.id`;
  },
  applicationEstablishedRegisteredSchoolsSqlJoin: () => {
    return `JOIN establishing_schools e ON a.tracking_number = e.tracking_number
            JOIN school_registrations s ON s.establishing_school_id = e.id`;
  },
  registeredSchoolsEstablishedApplicationSqlJoin: () => {
    return `JOIN establishing_schools e ON s.establishing_school_id = e.id
            JOIN  applications a ON a.tracking_number = e.tracking_number`;
  },
  joinsByApplicationCategory : (category) => {
       var sqlJoin = ``;
       if(category == 1){
          sqlJoin = `LEFT JOIN establishing_schools e ON a.tracking_number = e.tracking_number`;
       }
       if(category == 2) {
         sqlJoin = `LEFT JOIN owners o ON o.tracking_number = a.tracking_number 
                    LEFT JOIN establishing_schools e ON o.establishing_school_id = e.id`;
       }
       if(category == 4) {
          sqlJoin = `LEFT JOIN establishing_schools e ON a.tracking_number = e.tracking_number
                    LEFT JOIN school_registrations s ON s.establishing_school_id = e.id `;
       }
        if (category == 7) {
          sqlJoin = `LEFT JOIN former_owners fo ON fo.tracking_number = a.tracking_number 
                     LEFT JOIN establishing_schools e ON fo.establishing_school_id = e.id`;
        }
        if (category == 8) {
          sqlJoin = `LEFT JOIN former_managers fm ON fm.tracking_number = a.tracking_number 
                     LEFT JOIN establishing_schools e ON fm.establishing_school_id = e.id`;
        }
        if (category == 12) {
          sqlJoin = `LEFT JOIN former_school_combinations fsc ON fsc.tracking_number = a.tracking_number 
                     LEFT JOIN establishing_schools e ON fsc.establishing_school_id = e.id`;
        }
       if([5, 6, 9, 10, 11, 13, 14].includes(category)) {
           sqlJoin = `LEFT JOIN former_school_infos fsi ON fsi.tracking_number = a.tracking_number 
                      LEFT JOIN establishing_schools e ON fsi.establishing_school_id = e.id`; 
       }
       console.log(category)
       return sqlJoin;
  },
  InsertAuditTrail: (
    user_id,
    event_type,
    new_body,
    api_router,
    browser_used,
    rollId,
    message,
    ip_address,
    tableId
  ) => {
    // console.log(JSON.stringify(new_body));
    db.query(
      "INSERT INTO audit_trail (user_id, event_type, new_body, " +
        "created_at, ip_address, api_router, browser_used, rollId, message, tableName) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        user_id,
        event_type,
        JSON.stringify(new_body),
        new Date(),
        ip_address,
        api_router,
        browser_used,
        rollId,
        message,
        tableId,
      ],
      (err, result) => {
        if (err) {
          console.log(err);
          return {
            error: true,
            statusCode: 400,
            message: err,
          };
        }
        return "sent";
      }
    );
  },
  auditTrail : (req , action , comment , module) => {
         if(action == 'new'){
              ObjectFuctions.InsertAuditTrail(
                req.user.id,
                "created",
                req.body,
                req.url,
                req.body.browser_used,
                null,
                comment,
                req.body.ip_address,
                module
              );
         }
         console.log(req)
         if(action == 'edit'){
              ObjectFuctions.UpdateAuditTrail(
                req.user.id,
                "updated",
                req.body,
                req.url,
                req.body.browser_used,
                null,
                comment,
                req.body.ip_address,
                module
              );
         }
  },
  calculcateRemainDays: (fromDate) => {
    var today = new Date();
    var diffInSeconds = Math.abs(today - new Date(fromDate)) / 1000;
    var days = Math.floor(diffInSeconds / 60 / 60 / 24);
    var hours = Math.floor((diffInSeconds / 60 / 60) % 24);
    var minutes = Math.floor((diffInSeconds / 60) % 60);
    var seconds = Math.floor(diffInSeconds % 60);
    var milliseconds = Math.round(
      (diffInSeconds - Math.floor(diffInSeconds)) * 1000
    );
    var remain_days = null;
    if (days > 7) {
      remain_days = ObjectFuctions.formatDate(fromDate, "DD-MM-YYYY HH:mm:ss");
    } else if (days > 0) {
      remain_days = `Siku ${days} ${days > 1 ? "zilizopita" : "iliyopita"} `;
    } else if (days <= 0 && hours <= 0 && minutes <= 0) {
      remain_days = `Sekunde ${seconds} ${
        seconds > 1 ? "zilizopita" : "iliyopita"
      }`;
    } else if (days <= 0 && hours <= 0) {
      remain_days = `Dakika ${minutes} ${
        minutes > 1 ? "zilizopita" : "iliyopita"
      }`;
    } else if (days <= 0) {
      remain_days = `Saa ${hours} ${hours > 1 ? "zilizopita" : "iliyopita"}`;
    }
    return remain_days;
  },
  notificationUrl: (application_category_id, registry_id, tracking_number) => {
    let url = `#`;
    switch (application_category_id) {
      case 1:
        if (registry_id != 3) {
          url = `/TaarifaOmbi/${tracking_number}`;
        }
        break;
      case 2:
        url = `/ViewOmbi/${tracking_number}`;
        break;
      case 4:
        if (registry_id == 3) {
          url = `/SajiliOmbiSerikali/${tracking_number}`;
        } else {
          url = `/SajiliOmbi/${tracking_number}`;
        }
        break;
      case 5:
        url = `/BadiliMkondo/${tracking_number}`;
        break;
      case 6:
        url = `/BadiliAinaUsajili/${tracking_number}`;
        break;
      case 7:
        url = `/ViewOmbiMmiliki/${tracking_number}`;
        break;
      case 8:
        url = `/ViewOmbiMeneja/${tracking_number}`;
        break;
      case 9:
        url = `/BadiliShule/${tracking_number}`;
        break;
      case 10:
        url = `/HamishaShuleDetails/${tracking_number}`;
        break;
      case 11:
        url = `/FutaShuleTaarifa/${tracking_number}`;
        break;
      case 12:
        url = `/BadiliTahasusi/${tracking_number}`;
        break;
      case 13:
        url = `/BadiliDahalia/${tracking_number}`;
        break;
      case 14:
        url = `/BadiliBweni/${tracking_number}`;
        break;
      default:
        url = `#`;
        break;
    }
    return url;
  },
  staffCommonJoins: () => {
    const commonJoin = `LEFT JOIN roles r ON r.id = s.user_level
                   LEFT JOIN vyeo v ON v.id = r.vyeoId
                   LEFT JOIN role_management rm ON rm.id = s.new_role_id
                   LEFT JOIN zones z ON z.id = s.zone_id
                   LEFT JOIN regions rg ON rg.RegionCode = s.region_code
                   LEFT JOIN districts d ON d.LgaCode = s.district_code`;
    return commonJoin;
  },
  notificationArrayData: (results, callback) => {
    const data = [];
    results.forEach((item) => {
      var count = 60;
      const {
        tracking_number,
        task,
        application_category_id,
        registry_type_id,
        school_name,
        created_at,
        comments,
        staff_name,
        title,
      } = item;
      data.push({
        tracking_number: tracking_number,
        task: `Ombi la ${task}`,
        url: ObjectFuctions.notificationUrl(
          application_category_id,
          registry_type_id,
          tracking_number
        ),
        school_name: school_name,
        remain_days: ObjectFuctions.calculcateRemainDays(created_at),
        created_at: ObjectFuctions.formatDate(
          created_at,
          "DD-MM-YYYY HH:mm:ss"
        ),
        comments:
          comments != null && comments.length > count
            ? comments.slice(0, count) + (comments.length > count ? " ..." : "")
            : comments,
        staff_name: staff_name
          ? ObjectFuctions.capitalCase(ObjectFuctions.lowerCase(staff_name))
          : "",
        title: title ? ObjectFuctions.upperCase(title) : "",
      });
    });

    // console.log(data);

    callback(data);
  },
  UpdateAuditTrail: (
    user_id,
    event_type,
    new_body,
    api_router,
    browser_used,
    rollId,
    message,
    ip_address,
    old_body,
    tableId
  ) => {
    // console.log(JSON.stringify(new_body))
    db.query(
      "INSERT INTO audit_trail (user_id, event_type, new_body, " +
        "created_at, ip_address, api_router, browser_used, rollId, message, old_body, tableName) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        user_id,
        event_type,
        JSON.stringify(new_body),
        new Date(),
        ip_address,
        api_router,
        browser_used,
        rollId,
        message,
        JSON.stringify(old_body),
        tableId,
      ],
      (err, result) => {
        if (err) {
          console.log(err);
          return {
            error: true,
            statusCode: 400,
            message: err,
          };
        }
        return "sent";
      }
    );
  },
  applicationView : (application_category_id) => {
          var table_view = '';
          switch (Number(application_category_id)) {
            case 1:
              table_view = "established_schools_view";
              break;
            case 2:
              table_view = "school_owners_view";
              break;
            case 3:
              table_view = "school_managers_view";
              break;
            case 4:
              table_view = "registered_schools_view";
              break;
            case 5:
              table_view = "streams_change_view";
              break;
            case 6:
              table_view = "registration_change_view";
              break;
            case 7:
              table_view = "owners_change_view";
              break;
            case 8:
              table_view = "managers_change_view";
              break;
            case 9:
              table_view = "name_change_view";
              break;
            case 10:
              table_view = "transfer_change_view";
              break;
            case 11:
              table_view = "deregistration_change_view";
              break;
            case 12:
              table_view = "tahasusi_change_view";
              break;
            case 13:
              table_view = "dahalia_change_view";
              break;
            case 14:
              table_view = "bweni_change_view";
              break;
            default:
              break;
          }
          return table_view;
  },
  approvalStatuses : (status) => {
       var status_id = '';
        switch (status) {
          case "pending":
            status_id = "(0,1)";
            break;
          case "approved":
            status_id =  "(2)";
            break;
          case "rejected":
            status_id =  "(3)";
            break;
          default:
            status_id = null;
            break;
        }
        return status_id;
  }
};

module.exports = ObjectFuctions;