// src/Models/SchoolSpecializationModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const SchoolSpecialization = db.define(
  "SchoolSpecialization",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    specialization: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "specialization",
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
  },
  {
    tableName: "school_specializations",
    timestamps: false,
  },
);

module.exports = SchoolSpecialization;
