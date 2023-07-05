require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
var nodeMailer = require("nodemailer");
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
const { default: axios } = require("axios");

module.exports = {
  generateToken: (user, permissions) => {
    // console.log(permissions);
    return jwt.sign(
      {
        id: user[0].id,
        userPermissions: permissions,
      },
      process.env.JWT_SECRET || "the-super-strong-secrect",
      {
        expiresIn: "30d",
      }
    );
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
  formatDate: (date) => {
    var newDate = new Date(
      (typeof date === "string" ? new Date(date) : date).toLocaleString(
        "en-US",
        {
          timeZone: process.env.TZ || "Africa/Dar_es_salaam",
        }
      )
    );
    return newDate;
  },
  // Check user permission
  permit: (permission) => {
    // return a middleware
    return (req, res, next) => {
      const { user } = req;
      if (user && user.userPermissions.includes(permission)) {
        next(); // role is allowed, so continue on the next middleware
      } else {
        res.status(403).json({ message: "Forbidden" }); // user is forbidden
      }
    };
  },
  // Hash text
  hash: (plainText, callback) => {
    var hashed = false;
    bcrypt.hash(plainText, 10, (err, hash) => {
      if (!err) {
        hashed = true;
      }
      callback(hashed, hash);
    });
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
  uniqueArray : (array1 , array2) =>{
    // unique permissions (user + system);
      var duplicated_array = array1.concat(array2);
      var unique_array = duplicated_array.filter((item, pos) =>duplicated_array.indexOf(item) === pos);
          return unique_array;
  },
  promiseRequest: async (admin_area_url, segment , per_page = 2000) => {
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
              admin_area_url + segment +"?page=" + index + "&per_page=" + per_page
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
};
