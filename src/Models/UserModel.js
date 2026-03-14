// src/Models/UserModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const User = db.define(
  "User",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "name",
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: "email",
      validate: {
        isEmail: true,
      },
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "email_verified_at",
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password",
    },
    two_factor_secret: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "two_factor_secret",
    },
    two_factor_recovery_codes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "two_factor_recovery_codes",
    },
    remember_token: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "remember_token",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "updated_at",
      defaultValue: DataTypes.NOW,
    },
    secure_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "secure_token",
    },
  },
  {
    tableName: "users",
    timestamps: false, 
    },
);

module.exports = User;