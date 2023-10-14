require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const indexRouter = require("./router.js");
// var session = require('express-session');
process.env.TZ="Africa/Dar_es_Salaam"
const app = express();

app.use(express.json({ limit: "150MB", type: "application/json" }));
app.use(express.urlencoded({
    extended: true,
    limit: "150MB",
    urlencoded: true,
    type: "application/x-www-form-urlencoding",
  })
);

app.use(express.json());

app.use(cors());

// ##############START##########################
// new Routes make this file short possible
const regionRouter = require("./routers/regionRouter");
const districtRouter = require("./routers/districtRouter.js");
const wardRouter = require("./routers/wardRouter.js");
const streetRouter = require("./routers/streetRouter.js");
const schoolRouter = require("./routers/schoolRouter.js");
const userRouter = require("./routers/userRouter.js");
const permissionRouter = require("./routers/permissionRouter.js");
const roleRouter = require("./routers/roleRouter.js");
const zoneRouter = require("./routers/zoneRouter.js");
const attachementTypeRouter = require("./routers/attachmentTypeRouter.js");
const applicationCategoryRouter = require("./routers/applicationCategoryRouter.js");
const registrationTypeRouter = require("./routers/registrationTypeRouter.js");
const designationRouter = require("./routers/designationRouter.js");
const applicantRouter = require("./routers/applicantRouter.js");
const hierarchyRouter = require("./routers/hierarchyRouter.js");
const rankRouter = require("./routers/rankRouter.js");
const feeRouter = require("./routers/feeRouter.js");
const combinationRouter = require("./routers/combinationRouter.js");
const biasRouter = require("./routers/biasRouter.js");
const dashboardRouter = require("./routers/dashboardRouter.js");
const anzishaShuleRequestRouter = require("./routers/maombi/anzishaShuleRequestRouter.js");
const umilikiNaMenejaRequestRouter = require("./routers/maombi/umilikiNaMenejaRequestRouter.js");
const sajiliBinafsiRequestRouter = require("./routers/maombi/sajiliBinafsiRequestRouter.js");
const sajiliSerikaliRequestRouter = require("./routers/maombi/sajiliSerikaliRequestRouter.js");
const badiliMkondoRequestRouter = require("./routers/maombi/badiliMikondoRequestRouter.js");
const badiliJinaRequestRouter = require("./routers/maombi/badiliJinaRequestRouter.js");
const ongezaTahasusiRequestRouter = require("./routers/maombi/ongezaTahasusiRequestRouter.js");
const badiliBweniRequestRouter = require("./routers/maombi/badiliBweniRequestRouter.js");
const hamishaRequestRouter = require("./routers/maombi/hamishaRequestRouter.js");
const badiliMmilikiRequestRouter = require("./routers/maombi/badiliMmilikiRequestRouter.js");
const badiliMenejaRequestRouter = require("./routers/maombi/badiliMenejaRequestRouter.js");
const futaShuleRequestRouter = require("./routers/maombi/futaShuleRequestRouter.js");
const badiliUsajiliRequestRouter = require("./routers/maombi/badiliUsajiliRequestRouter.js");
const ongezaDahaliaRequestRouter = require("./routers/maombi/ongezaDahaliaRequestRouter.js");
const sajiliShuleCommentRouter = require("./routers/maombi/sajiliShuleCommentRouter.js");
const algorithmRouter = require("./routers/algorithmRouter.js");
const schoolCategoryRouter = require("./routers/schoolCategoryRouter.js");
const notificationRouter = require("./routers/notificationRouter.js");

app.use("/api", indexRouter);
// Maombi
app.use("/api" , anzishaShuleRequestRouter);
app.use("/api", regionRouter);
app.use("/api", districtRouter);
app.use("/api", wardRouter);
app.use("/api", streetRouter);
app.use("/api", schoolRouter);
app.use("/api", userRouter);
app.use("/api", permissionRouter);
app.use("/api", roleRouter);
app.use("/api", hierarchyRouter);
app.use("/api", rankRouter);
app.use("/api", designationRouter);
app.use("/api", zoneRouter);
app.use("/api", algorithmRouter);
app.use("/api", schoolCategoryRouter);
app.use("/api", attachementTypeRouter);
app.use("/api", applicationCategoryRouter);
app.use("/api", registrationTypeRouter);
app.use("/api", applicantRouter);
app.use("/api", feeRouter);
app.use('/api' , biasRouter);
app.use('/api' , combinationRouter);
app.use('/api' , dashboardRouter);
app.use("/api", umilikiNaMenejaRequestRouter);
app.use("/api", sajiliBinafsiRequestRouter);
app.use("/api", sajiliSerikaliRequestRouter);
app.use("/api", sajiliShuleCommentRouter);

app.use("/api", badiliMkondoRequestRouter);
app.use("/api", badiliJinaRequestRouter);
app.use("/api", ongezaTahasusiRequestRouter);
app.use("/api", badiliBweniRequestRouter);

app.use("/api", badiliUsajiliRequestRouter);
app.use("/api", hamishaRequestRouter);
app.use("/api", badiliMmilikiRequestRouter);
app.use("/api", badiliMenejaRequestRouter);
app.use("/api", futaShuleRequestRouter); 
app.use("/api", ongezaDahaliaRequestRouter);

app.use("/api", notificationRouter); 


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

app.listen(process.env.HTTP_PORT || 80, () =>
   console.log(`API Server is running on  port ${process.env.HTTP_PORT || 80}`)
);
