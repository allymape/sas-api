// src/Models/RegionModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const Region = db.define(
  "Region",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
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
      type: DataTypes.TEXT,
      allowNull: true,
      field: "description",
    },
    area_type_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "area_type_id",
    },
    area_type_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "area_type_name",
    },
    area_type_name_sw: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "area_type_name_sw",
    },
    area_type_order_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "area_type_order_id",
    },
    RegionCode: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "RegionCode",
    },
    RegionName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "RegionName",
    },
    zone_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "zone_id",
    },
    box: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: "box",
    },
    sqa_zone: {
      type: DataTypes.TINYINT,
      allowNull: true,
      field: "sqa_zone",
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
  },
  {
    tableName: "regions",
    timestamps: false,
    indexes: [
      {
        name: "idx_regions_RegionCode",
        fields: ["RegionCode"],
      },
      {
        name: "idx_regions_zone_id",
        fields: ["zone_id"],
      },
    ],
  },
);

module.exports = Region;
