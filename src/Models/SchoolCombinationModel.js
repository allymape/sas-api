// src/Models/SchoolCombinationModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const SchoolCombination = db.define(
  "SchoolCombination",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    school_registration_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "school_registration_id",
    },
    combination_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "combination_id",
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
    tableName: "school_combinations",
    timestamps: false,
  },
);

module.exports = SchoolCombination;
