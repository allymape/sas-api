// Src/Models/Application.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");
const ApplicationCategory = require("./ApplicationCategoryModel");
const Staff = require("./StaffModel");

const Application = db.define(
  "Application",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    establishing_school_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    secure_token: {
      type: DataTypes.STRING,
    },
    foreign_token: {
      type: DataTypes.STRING,
    },
    tracking_number: {
      type: DataTypes.STRING,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    registry_type_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    application_category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    is_approved: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status_id: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approved_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    control_number: {
      type: DataTypes.STRING,
    },
    payment_status_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      defaultValue: 2,
    },
    amount: {
      type: DataTypes.STRING,
    },
    expire_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    kumb_na: {
      type: DataTypes.STRING(50),
    },
    folio: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    is_complete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "applications",
    timestamps: false,
  },
);

module.exports = Application;
