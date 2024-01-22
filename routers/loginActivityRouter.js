require("dotenv").config();
const express = require("express");
const loginActivityRouter = express.Router();
const sharedModel = require("../models/sharedModel");
const { isAuth } = require("../utils");


// List of
loginActivityRouter.post("/login-activity", isAuth, (req, res) => {  
    const per_page = parseInt(req.body.per_page);
    const page = parseInt(req.body.page);
    const offset = (page - 1) * per_page;
   
    const sqlTables = ` FROM login_activity l 
                       INNER JOIN staffs s ON s.id = l.staff_id 
                       ORDER BY l.created_at DESC `;
    const sql_rows = `SELECT s.name AS name, browser , ip , device , l.created_at AS created_at 
                      ${sqlTables}
                      LIMIT ?,?`;
    const  sql_count = `SELECT COUNT(*) AS num_rows 
                        ${sqlTables}`
    sharedModel.paginate(sql_rows , sql_count , (error , activities , numRows) => {
        res.send({
            statusCode : error ? 306 : 300,
            activities,
            numRows
        });
    } , [offset , per_page])
});


module.exports = loginActivityRouter;
