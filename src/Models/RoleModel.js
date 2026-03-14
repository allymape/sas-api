// src/Models/Role.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const Role = db.define(
  "Role",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    vyeoId: DataTypes.INTEGER,
    status_id: { type: DataTypes.INTEGER, defaultValue: 1 },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    tableName: "roles",
    timestamps: false,
  },
);

module.exports = Role;
