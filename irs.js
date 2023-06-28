const createError = require('http-errors');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const indexRouter = require('./router.js');
// var session = require('express-session');

const app = express();
// app.use(session({
// 	secret: 'secret',
// 	resave: true,
// 	saveUninitialized: true,
// }));

app.use(bodyParser.json({limit: '150MB', type:'application/json'}));
app.use(bodyParser.urlencoded({limit: '150MB', urlencoded: true, type:'application/x-www-form-urlencoding'}));
 
app.use(express.json());
 

 
app.use(cors());

// ##############START##########################
// new Routes make this file short possible
const regionRouter = require('./routers/regionRouter');
const districtRouter = require('./routers/districtRouter.js');
const wardRouter = require('./routers/wardRouter.js');
const streetRouter = require('./routers/streetRouter.js');
const schoolRouter = require('./routers/schoolRouter.js');
const userRouter = require('./routers/userRouter.js');
const permissionRouter = require('./routers/permissionRouter.js');

app.use("/api", regionRouter);
app.use("/api", districtRouter);
app.use("/api", wardRouter);
app.use("/api", streetRouter);
app.use("/api", schoolRouter);
app.use("/api", userRouter);
app.use("/api", permissionRouter);
app.use('/api', indexRouter);


 
// Handling Errors
app.use((err, req, res, next) => {
    console.log(err);
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
    });
});

app.listen(8088,() => console.log('Server is running on port 8088'));