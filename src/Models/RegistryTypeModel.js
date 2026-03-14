// src/Models/RegistryTypeModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const RegistryType = db.define(
  "RegistryType",
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
    registry: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "registry",
    },
    registry_type_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "registry_type_code",
    },
  },
  {
    tableName: "registry_types",
    timestamps: false,
  },
);

module.exports = RegistryType;
