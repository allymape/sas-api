// src/Models/InstituteInfoModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const InstituteInfo = db.define(
  "InstituteInfo",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    secure_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: "secure_token",
    },
    category: {
      type: DataTypes.ENUM("Government", "Non-Government"),
      allowNull: true,
      field: "category",
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "name",
    },
    registration_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "registration_number",
    },
    registration_certificate_copy: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      field: "registration_certificate_copy",
    },
    organizational_constitution: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      field: "organizational_constitution",
    },
    agreement_document: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      field: "agreement_document",
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
  },
  {
    tableName: "institute_infos",
    timestamps: false,
    indexes: [
      {
        name: "secure_token_UNIQUE",
        unique: true,
        fields: ["secure_token"],
      },
    ],
  },
);

module.exports = InstituteInfo;
