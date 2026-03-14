// src/Models/CurriculumModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const Curriculum = db.define(
  "Curriculum",
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
    curriculum: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "curriculum",
    },
  },
  {
    tableName: "curricula",
    timestamps: false,
  },
);

module.exports = Curriculum;
