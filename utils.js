const jwt = require('jsonwebtoken');

module.exports = {
  generateToken: (user , permissions) => {
    console.log(permissions)
    return jwt.sign(
      {
        // _id: user._id,
        // name: user.name,
        // email: user.email,
        // isAdmin: user.isAdmin,
        // isSeller: user.isSeller,
        id : user[0].id,
        userPermissions : permissions 
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
    return new Date(
      (typeof date === "string" ? new Date(date) : date).toLocaleString(
        "en-US",
        {
          timeZone: "Africa/Dar_es_salaam",
        }
      )
    );
  },
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
};


