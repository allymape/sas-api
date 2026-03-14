// src/Models/LanguageModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const Language = db.define(
  "Language",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    secure_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "secure_token",
    },
    language: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "language",
    },
  },
  {
    tableName: "languages",
    timestamps: false,
  },
);

module.exports = Language;
