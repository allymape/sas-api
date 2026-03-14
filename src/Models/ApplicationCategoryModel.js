// src/Models/ApplicationCategory.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const ApplicationCategory = db.define(
  "ApplicationCategory",
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
    app_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "app_name",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "created_at",
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "updated_at",
    },
    application_code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "application_code",
    },
  },
  {
    tableName: "application_categories",
    timestamps: false,
  },
);

module.exports = ApplicationCategory;
