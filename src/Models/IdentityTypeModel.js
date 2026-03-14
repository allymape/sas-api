// src/Models/IdentityTypeModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const IdentityType = db.define(
  "IdentityType",
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
    id_type: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "id_type",
    },
  },
  {
    tableName: "identity_types",
    timestamps: false,
  },
);

module.exports = IdentityType;
