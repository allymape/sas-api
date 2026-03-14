// src/Models/StreetModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const Street = db.define(
  "Street",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    StreetCode: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: "StreetCode",
    },
    StreetName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "StreetName",
    },
    WardCode: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "WardCode",
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
    tableName: "streets",
    timestamps: false,
    indexes: [
      {
        name: "idx_streets_StreetCode",
        fields: ["StreetCode"],
      },
      {
        name: "idx_streets_WardCode",
        fields: ["WardCode"],
      },
    ],
  },
);

module.exports = Street;
