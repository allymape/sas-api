// src/Models/DistrictModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const District = db.define(
  "District",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    RegionCode: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "RegionCode",
    },
    LgaCode: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "LgaCode",
    },
    LgaName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "LgaName",
    },
    ngazi: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "ngazi",
    },
    sqa_box: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "sqa_box",
    },
    district_box: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "district_box",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "created_at",
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "updated_at",
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
    tableName: "districts",
    timestamps: false,
    indexes: [
      {
        name: "idx_districts_RegionCode",
        fields: ["RegionCode"],
      },
      {
        name: "idx_districts_LgaCode",
        fields: ["LgaCode"],
      },
      {
        name: "districts_ngazi_index",
        fields: ["ngazi"],
      },
    ],
  },
);

module.exports = District;
