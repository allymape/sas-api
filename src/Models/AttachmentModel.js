// src/Models/AttachmentModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const Attachment = db.define(
  "Attachment",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    secure_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "secure_token",
    },
    uploader_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "uploader_token",
    },
    tracking_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "tracking_number",
    },
    attachment_type_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "attachment_type_id",
    },
    attachment_path: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      field: "attachment_path",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "user_id",
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
    tableName: "attachments",
    timestamps: false,
  },
);

module.exports = Attachment;
