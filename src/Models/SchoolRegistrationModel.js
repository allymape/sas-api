// src/Models/SchoolRegistrationModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const SchoolRegistration = db.define(
  "SchoolRegistration",
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
    establishing_school_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "establishing_school_id",
    },
    tracking_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "tracking_number",
    },
    school_opening_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "school_opening_date",
    },
    registration_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "registration_date",
    },
    level_of_education: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "level_of_education",
    },
    is_seminary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_seminary",
    },
    registration_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "registration_number",
    },
    reg_status: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 2,
      field: "reg_status",
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_verified",
    },
    sharti: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "sharti",
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at",
    },
  },
  {
    tableName: "school_registrations",
    timestamps: false,
  },
);

module.exports = SchoolRegistration;
