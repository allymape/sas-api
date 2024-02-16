require("dotenv").config();
const express = require("express");
const handoverRouter = express.Router();
const sharedModel = require("../models/sharedModel");
const { isAuth, formatDate } = require("../utils");
const handoverModel = require("../models/handoverModel");

// List of
handoverRouter.get("/handover-list", isAuth, (req, res) => {  
    const per_page = parseInt(req.body.per_page);
    const page = parseInt(req.body.page);
    const offset = (page - 1) * per_page;
    const {user} = req
    const sqlTables = `FROM handover h
                        JOIN staffs s ON s.id = h.staff_id 
                        WHERE handover_by = ${user.id}`;
    const sql_rows = `SELECT h.id AS id, s.name AS name , start , end , reason , h.created_at AS created_at , active 
                      ${sqlTables}
                      ORDER BY h.created_at DESC
                      LIMIT ?,?`;
    const  sql_count = `SELECT COUNT(*) AS num_rows 
                        ${sqlTables}`
    sharedModel.paginate(sql_rows , sql_count , (error , handovers , numRows) => {
         sharedModel.myActivehandover(user.id , (activeHandover) => {
                    res.send({
                      statusCode: error ? 306 : 300,
                      handovers,
                      activeHandover: activeHandover,
                      numRows,
                    });
            });
    } , [offset , per_page])
});

handoverRouter.post(`/my-active-handover`, isAuth, (req, res) => {
  sharedModel.myActivehandover(req.user.id, (active) => {
    res.send({
      active: active,
    });
  });
});

handoverRouter.post('/handover' , isAuth , (req , res) => {
    const {staff , reason , dates} = req.body;
    const start = formatDate(dates.split("to")[0], "YYYY-MM-DD HH:mm:ss"); 
    const end = formatDate(dates.split("to")[1], "YYYY-MM-DD 23:59:59");
    const {user} = req;
    const created_at = formatDate(new Date() , "YYYY-MM-DD HH:mm:ss");
    const formData = [
        staff,
        user.id,
        start,
        end,
        reason,
        created_at,
        created_at
    ];
    handoverModel.createHandover(user.id, formData , (success) => {
        res.send({
          statusCode: success ? 300 : 306, 
          message: success ? "Umafanikiwa kukaimisha" : "Haujafanikiwa kukaimisha kuna shida.",
        });
    })
})

handoverRouter.put(`/stop-handover` , isAuth , (req, res) => {
    const {user} = req;
    sharedModel.stopHandover(user.id , (success) => {
        res.send({
             statusCode : success ? 300 : 306,
             message : success ? "Umefanikiwa kuondoa Kaimisho" : " Hakuna Kaimisho."
        });
    })    
});
module.exports = handoverRouter;
