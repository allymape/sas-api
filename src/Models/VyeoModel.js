// src/Models/Vyeo.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const Vyeo = db.define(
  "Vyeo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rank_name: DataTypes.STRING,
    status_id: { type: DataTypes.INTEGER, defaultValue: 1 },
    rank_level: DataTypes.INTEGER,
    overdue: { type: DataTypes.TINYINT, defaultValue: 1 },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    tableName: "vyeo",
    timestamps: false,
  },
);

module.exports = Vyeo;
