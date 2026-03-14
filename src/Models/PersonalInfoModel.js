// src/Models/PersonalInfoModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const PersonalInfo = db.define(
  "PersonalInfo",
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
    first_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "first_name",
    },
    middle_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "middle_name",
    },
    last_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "last_name",
    },
    occupation: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "occupation",
    },
    identity_type_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "identity_type_id",
    },
    personal_id_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "personal_id_number",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "updated_at",
      defaultValue: DataTypes.NOW,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "user_id",
    },
  },
  {
    tableName: "personal_infos",
    timestamps: false,
    indexes: [
      {
        name: "personal_info_secure_token_index",
        fields: ["secure_token"],
      },
      {
        name: "personal_infos_identity_type_id_index",
        fields: ["identity_type_id"],
      },
      {
        name: "personal_infos_user_id_foreign",
        fields: ["user_id"],
      },
    ],
  },
);

module.exports = PersonalInfo;
