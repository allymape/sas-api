// src/Models/ZoneModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const Zone = db.define(
  "Zone",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    zone_code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "zone_code",
    },
    zone_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "zone_name",
    },
    box: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "box",
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
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "status_id",
    },
  },
  {
    tableName: "zones",
    timestamps: false,
    indexes: [
      {
        name: "idx_zones_zone_code",
        fields: ["zone_code"],
      },
      {
        name: "idx_zones_status_id",
        fields: ["status_id"],
      },
    ],
  },
);

module.exports = Zone;
