// src/Models/CombinationModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const Combination = db.define(
  "Combination",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    school_specialization_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "school_specialization_id",
    },
    combination: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "combination",
    },
    certificate_type_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "certificate_type_id",
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "status_id",
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "code",
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
    tableName: "combinations",
    timestamps: false,
  },
);

module.exports = Combination;
