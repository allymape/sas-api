// src/Models/SchoolCategoryModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const SchoolCategory = db.define(
  "SchoolCategory",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING(2),
      allowNull: true,
      field: "code",
    },
    secure_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "secure_token",
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "category",
    },
    uk_msambao: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: true,
      field: "uk_msambao",
    },
    uk_ghorofa: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: true,
      field: "uk_ghorofa",
    },
    class_room_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "class_room_id",
    },
  },
  {
    tableName: "school_categories",
    timestamps: false,
  },
);

module.exports = SchoolCategory;
