require("dotenv").config();
const express = require("express");
const cors = require("cors");
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

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    if (Number(res.statusCode || 0) < 400) return;
    if (String(req?.originalUrl || "").includes("/system-logs")) return;

    writeSystemLog({
      level: res.statusCode >= 500 ? "critical" : "error",
      module: "api",
      event_type: "http-response-error",
      message: `${req.method} ${req.originalUrl} imerudisha status ${res.statusCode}.`,
      source: "sas-api/irs.js:response-monitor",
      status_code: res.statusCode,
      req,
      context: {
        duration_ms: Date.now() - startedAt,
        params: req?.params || null,
        query: req?.query || null,
      },
    });
  });
  next();
});

// ##############START##########################
// new Routes make this file short as possible
const regionRouter = require("./routers/regionRouter");
const districtRouter = require("./routers/districtRouter.js");
const wardRouter = require("./routers/wardRouter.js");
const streetRouter = require("./routers/streetRouter.js");
const schoolRouter = require("./routers/schoolRouter.js");
const userRouter = require("./routers/userRouter.js");
const permissionRouter = require("./routers/permissionRouter.js");
const moduleRouter = require("./routers/moduleRouter.js");
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
const schoolSubCategoryRouter = require("./routers/schoolSubCategoryRouter.js");
const schoolFileNumberMappingRouter = require("./routers/schoolFileNumberMappingRouter.js");
const schoolTypeStandardRouter = require("./routers/schoolTypeStandardRouter.js");
const schoolInfrastructureStandardRouter = require("./routers/schoolInfrastructureStandardRouter.js");
const subjectRouter = require("./routers/subjectRouter.js");
const combinationSubjectRouter = require("./routers/combinationSubjectRouter.js");
const curriculumRouter = require("./routers/curriculumRouter.js");
const actionTypeRouter = require("./routers/actionTypeRouter.js");
const notificationRouter = require("./routers/notificationRouter.js");
const trackApplicationRouter = require("./routers/trackApplicationRouter.js");
const requestSummaryRouter = require("./routers/maombi/requestSummaryRouter.js");
const ripotiKuanzishaRequestRouter = require("./routers/ripoti/ripotiKuanzishaRequestRouter.js");
const ripotiWamilikiRequestRouter = require("./routers/ripoti/ripotiWamilikiRequestRouter.js");
const ripotiMenejaRequestRouter = require("./routers/ripoti/ripotiMenejaRequestRouter.js");
const ripotiUsajiliRequestRouter = require("./routers/ripoti/ripotiUsajiliRequestRouter.js");
const ripotiMikondoChangeRequestRouter = require("./routers/ripoti/ripotiMikondoChangeRequestRouter.js");
const ripotiUhamishoChangeRequestRouter = require("./routers/ripoti/ripotiUhamishoChangeRequestRouter.js");
const ripotiWamilikiChangeRequestRouter = require("./routers/ripoti/ripotiWamilikiChangeRequestRouter.js");
const ripotiMenejaChangeRequestRouter = require("./routers/ripoti/ripotiMenejaChangeRequestRouter.js");
const ripotiJinaChangeRequestRouter = require("./routers/ripoti/ripotiJinaChangeRequestRouter.js");
const ripotiKufutaChangeRequestRouter = require("./routers/ripoti/ripotiKufutaChangeRequestRouter.js");
const ripotiTahasusiChangeRequestRouter = require("./routers/ripoti/ripotiTahasusiChangeRequestRouter.js");
const ripotiBweniChangeRequestRouter = require("./routers/ripoti/ripotiBweniChangeRequestRouter.js");
const ripotiUsajiliChangeRequestRouter = require("./routers/ripoti/ripotiUsajiliChangeRequestRouter.js");
const ripotiDahaliaChangeRequestRouter = require("./routers/ripoti/ripotiDahaliaChangeRequestRouter.js");
const baruaRouter = require("./routers/barua/baruaRouter.js");
const workflowRouter = require("./routers/workflowRouter.js");
const loginActivityRouter = require("./routers/loginActivityRouter.js");
const attachementRouter = require("./routers/attachmentRouter.js");
const auditTrailRouter = require("./routers/auditTrailRouter.js");
const handoverRouter = require("./routers/handoverRouter.js");
const updateSchoolDetailRouter = require("./routers/updateSchoolDetailRouter.js");
const systemLogRouter = require("./routers/systemLogRouter.js");
const { writeSystemLog } = require("./src/Utils/systemLogService");
const applicationApiRoutes = require("./src/Routes/ApplicationApiRoutes.js");
const { bindRequestContext } = require("./src/Utils/requestContext");


// app.use("/api", indexRouter);
app.use(bindRequestContext);
app.use("/api" , anzishaShuleRequestRouter);
app.use("/api" , trackApplicationRouter);
app.use("/api", regionRouter);
app.use("/api", districtRouter);
app.use("/api", wardRouter);
app.use("/api", streetRouter);
app.use("/api", schoolRouter);
app.use("/api", updateSchoolDetailRouter);
app.use("/api", userRouter);
app.use("/api", permissionRouter);
app.use("/api", moduleRouter);
app.use("/api", roleRouter);
app.use("/api", hierarchyRouter);
app.use("/api", rankRouter);
app.use("/api", designationRouter);
app.use("/api", zoneRouter);
app.use("/api", algorithmRouter);
app.use("/api", workflowRouter);
app.use("/api", actionTypeRouter);
app.use("/api", schoolCategoryRouter);
app.use("/api", schoolSubCategoryRouter);
app.use("/api", schoolFileNumberMappingRouter);
app.use("/api", schoolTypeStandardRouter);
app.use("/api", schoolInfrastructureStandardRouter);
app.use("/api", subjectRouter);
app.use("/api", combinationSubjectRouter);
app.use("/api", curriculumRouter);
app.use("/api", attachementTypeRouter);
app.use("/api", applicationCategoryRouter);
app.use("/api", registrationTypeRouter);
app.use("/api", applicantRouter);
app.use("/api", feeRouter);
app.use('/api' , biasRouter);
app.use('/api' , combinationRouter);
app.use('/api' , dashboardRouter);
app.use("/api", attachementRouter); 

app.use("/api", requestSummaryRouter);
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
app.use("/api", ripotiKuanzishaRequestRouter); 
app.use("/api", ripotiWamilikiRequestRouter); 
app.use("/api", ripotiMenejaRequestRouter); 
app.use("/api", ripotiUsajiliRequestRouter); 
app.use("/api", ripotiMikondoChangeRequestRouter); 
app.use("/api", ripotiUsajiliRequestRouter); 
app.use("/api", ripotiUhamishoChangeRequestRouter); 
app.use("/api", ripotiWamilikiChangeRequestRouter); 
app.use("/api", ripotiMenejaChangeRequestRouter); 
app.use("/api", ripotiJinaChangeRequestRouter); 
app.use("/api", ripotiKufutaChangeRequestRouter); 
app.use("/api", ripotiTahasusiChangeRequestRouter); 
app.use("/api", ripotiBweniChangeRequestRouter); 
app.use("/api", ripotiUsajiliChangeRequestRouter); 
app.use("/api", ripotiDahaliaChangeRequestRouter); 
app.use("/api", baruaRouter); 
app.use("/api", loginActivityRouter); 
app.use("/api", auditTrailRouter); 
app.use("/api", handoverRouter); 
app.use("/api", systemLogRouter);
app.use("/api/applications", applicationApiRoutes);
app.use(express.json());
const api_routes = require("./src/Routes/api.js"); // central routes
app.use("/api/v2", api_routes); // <--- Prefix
app.use("/api/v2", handoverRouter); // compatibility for my-active-handover, handover-list
app.use("/api/v2", userRouter); // compatibility for refresh_token and shared auth/session endpoints
app.use("/api/v2", notificationRouter); // compatibility for my-notifications
app.use("/api/v2", auditTrailRouter); // compatibility for audit-trail
app.use("/api/v2", loginActivityRouter); // compatibility for login-activity
app.use("/api/v2", permissionRouter); // compatibility for legacy allPermissions/addPermission endpoints
app.use("/api/v2", moduleRouter); // compatibility for allModules/addModule endpoints
app.use("/api/v2", applicantRouter); // compatibility for all-applicants/find-applicant/look_for_applicants endpoints
app.use("/api/v2", schoolTypeStandardRouter); // compatibility for settings endpoints
app.use("/api/v2", schoolInfrastructureStandardRouter); // compatibility for settings endpoints
app.use("/api/v2", baruaRouter); // compatibility for letters endpoint

// Handling Errors
app.use((err, req, res, next) => {
  console.log(err);
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  writeSystemLog({
    level: err.statusCode >= 500 ? "critical" : "error",
    module: "api",
    event_type: "unhandled-exception",
    message: err.message,
    source: "sas-api/irs.js:error-middleware",
    status_code: err.statusCode,
    req,
    context: {
      request_body: req?.body || null,
      request_query: req?.query || null,
      request_params: req?.params || null,
    },
    error_details: {
      name: err?.name || null,
      stack: typeof err?.stack === "string" ? err.stack.slice(0, 4000) : null,
    },
  });

  res.status(err.statusCode).json({
    statusCode: err.statusCode,
    message: err.message,
  });
});

app.listen(process.env.HTTP_PORT || 80, () => {
   console.log(`API Server is running on  port ${process.env.HTTP_PORT || 80}`);
});
