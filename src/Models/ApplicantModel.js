// src/Models/ApplicantModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const Applicant = db.define(
  "Applicant",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "display_name",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "title",
    },
    secure_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "secure_token",
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "email",
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "phone",
    },
    box: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "box",
    },
    lga_box_location: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: "lga_box_location",
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "address",
    },
    street_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "street_id",
    },
    // ===== POLYMORPHIC FIELDS =====
    applicantable_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "applicantable_id",
    },
    applicantable_type: {
      // Keep as string to support both legacy and normalized polymorphic values.
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "applicantable_type",
    },
    // ===============================
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
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
    tableName: "applicants",
    timestamps: false,
    indexes: [
      {
        name: "unique_applicantable",
        unique: true,
        fields: ["applicantable_id", "applicantable_type"],
      },
      {
        name: "applicants_user_id_index",
        fields: ["user_id"],
      },
    ],
  },
);

// src/Models/ApplicantModel.js

module.exports = Applicant;
