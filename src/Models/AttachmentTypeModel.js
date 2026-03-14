// src/Models/AttachmentTypeModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const AttachmentType = db.define(
  "AttachmentType",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    registry_type_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "registry_type_id",
    },
    attachment_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "attachment_name",
    },
    application_category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "application_category_id",
    },
    registration_structure_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "registration_structure_id",
    },
    file_size: {
      type: DataTypes.DOUBLE(4, 2),
      allowNull: true,
      field: "file_size",
    },
    file_format: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "file_format",
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "status_id",
    },
    secure_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "secure_token",
    },
    application_attachment_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "application_attachment_type",
    },
    is_backend: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: "is_backend",
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
    tableName: "attachment_types",
    timestamps: false,
  },
);

module.exports = AttachmentType;
