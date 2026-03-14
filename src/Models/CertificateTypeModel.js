// src/Models/CertificateTypeModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const CertificateType = db.define(
  "CertificateType",
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
    certificate: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "certificate",
    },
    school_category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "school_category_id",
    },
    level: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "level",
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "code",
    },
  },
  {
    tableName: "certificate_types",
    timestamps: false,
  },
);

module.exports = CertificateType;
