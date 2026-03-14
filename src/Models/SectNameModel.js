// src/Models/SectNameModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const SectName = db.define(
  "SectName",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    secure_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "secure_token",
    },
    word: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "word",
    },
  },
  {
    tableName: "sect_names",
    timestamps: false,
  },
);

module.exports = SectName;
