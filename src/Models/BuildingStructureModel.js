// src/Models/BuildingStructureModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const BuildingStructure = db.define(
  "BuildingStructure",
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
    building: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "building",
    },
  },
  {
    tableName: "building_structures",
    timestamps: false,
  },
);

module.exports = BuildingStructure;
