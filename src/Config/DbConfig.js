// src/Config/dbConfig.js
require("dotenv").config();
const { Sequelize } = require("sequelize");

const db = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    timezone: process.env.TIMEZONE || "+03:00",
    logging: false, // set true for debugging
    define: {
      freezeTableName: true, // avoid plural table names
      timestamps: false,
    },
  },
);

// Test connection
db.authenticate()
  .then(() =>
    console.log(`Sequelize connected to ${process.env.DB_DATABASE} ✅`),
  )
  .catch((err) => console.error("Sequelize connection error ❌", err));

module.exports = db;
