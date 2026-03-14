// src/Models/Staff.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");
const Role = require("./RoleModel");

const Staff = db.define(
  "Staff",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    secure_token: DataTypes.STRING,
    name: DataTypes.STRING,
    username: DataTypes.STRING,
    phone_no: DataTypes.STRING,
    user_status: { type: DataTypes.INTEGER, allowNull: false },
    email: DataTypes.STRING,
    email_notify: { type: DataTypes.TINYINT, defaultValue: 0 },
    password: DataTypes.STRING,
    user_level: DataTypes.STRING,
    last_login: DataTypes.DATE,
    role_id: DataTypes.INTEGER,
    station_level: DataTypes.INTEGER,
    office: DataTypes.STRING,
    zone_id: DataTypes.STRING,
    region_code: DataTypes.STRING,
    district_code: DataTypes.STRING,
    signature: DataTypes.TEXT("long"),
    kaimu: { type: DataTypes.INTEGER, defaultValue: 0 },
    kaimu_cheo: DataTypes.INTEGER,
    twofa: { type: DataTypes.TINYINT, defaultValue: 0 },
    twofa_digit: DataTypes.INTEGER,
    token_id: DataTypes.STRING,
    login_id: { type: DataTypes.INTEGER, defaultValue: 0 },
    new_role_id: DataTypes.STRING,
    is_password_changed: { type: DataTypes.TINYINT, defaultValue: 0 },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    tableName: "staffs",
    timestamps: false,
  },
);

module.exports = Staff;
