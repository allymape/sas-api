// src/Models/MaoniModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");
const Staff = require("./StaffModel");
const Application = require("./ApplicationModel");

const Comment = db.define(
  "Maoni",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    trackingNo: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: "trackingNo",
    },
    user_from: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "user_from",
    },
    user_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "user_to",
    },
    coments: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "coments",
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "title",
    },
    type_of_comment: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "type_of_comment",
    },
    application_process_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "application_process_id",
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "action",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "maoni",
    timestamps: false, // Tunatumia created_at pekee
  },
);

module.exports = Comment;
