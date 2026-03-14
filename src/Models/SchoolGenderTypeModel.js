// src/Models/SchoolGenderTypeModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const SchoolGenderType = db.define(
  "SchoolGenderType",
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
    gender_type: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "gender_type",
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "code",
    },
  },
  {
    tableName: "school_gender_types",
    timestamps: false,
  },
);

module.exports = SchoolGenderType;
