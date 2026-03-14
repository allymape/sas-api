// src/Models/RegistrationStructureModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const RegistrationStructure = db.define(
  "RegistrationStructure",
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
    structure: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "structure",
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "code",
    },
  },
  {
    tableName: "registration_structures",
    timestamps: false,
  },
);

module.exports = RegistrationStructure;
