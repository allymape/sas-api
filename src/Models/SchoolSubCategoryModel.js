// src/Models/SchoolSubCategoryModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const SchoolSubCategory = db.define(
  "SchoolSubCategory",
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
    subcategory: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "subcategory",
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "code",
    },
  },
  {
    tableName: "school_sub_categories",
    timestamps: false,
  },
);

module.exports = SchoolSubCategory;
