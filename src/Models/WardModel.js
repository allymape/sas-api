// src/Models/WardModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const Ward = db.define(
  "Ward",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    LgaCode: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "LgaCode",
    },
    WardCode: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "WardCode",
    },
    WardName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "WardName",
    },
    tamisemi_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "tamisemi_id",
    },
    parent_area: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "parent_area",
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "description",
    },
    area_type_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "area_type_id",
    },
    label: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "label",
    },
    area_short_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "area_short_name",
    },
    area_hq_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "area_hq_id",
    },
    area_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "area_code",
    },
    establishment_date_approximated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "establishment_date_approximated",
    },
    mof_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "mof_code",
    },
  },
  {
    tableName: "wards",
    timestamps: false,
    indexes: [
      {
        name: "idx_wards_WardCode",
        fields: ["WardCode"],
      },
      {
        name: "idx_wards_LgaCode",
        fields: ["LgaCode"],
      },
    ],
  },
);

module.exports = Ward;
