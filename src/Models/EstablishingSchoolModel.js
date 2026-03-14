// src/Models/EstablishingSchoolModel.js
const { DataTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const EstablishingSchool = db.define(
  "EstablishingSchool",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    secure_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "secure_token",
    },
    school_category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "school_category_id",
    },
    school_sub_category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "school_sub_category_id",
    },
    school_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "school_name",
    },
    registry_type_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "registry_type_id",
    },
    school_size: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: true,
      field: "school_size",
    },
    area: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: true,
      field: "area",
    },
    stream: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "stream",
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "website",
    },
    language_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "language_id",
    },
    building_structure_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "building_structure_id",
    },
    school_gender_type_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "school_gender_type_id",
    },
    school_specialization_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "school_specialization_id",
    },
    ward_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "ward_id",
    },
    village_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "village_id",
    },
    latitude: {
      type: DataTypes.DECIMAL(20, 10),
      allowNull: true,
      field: "latitude",
    },
    longitude: {
      type: DataTypes.DECIMAL(20, 10),
      allowNull: true,
      field: "longitude",
    },
    registration_structure_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "registration_structure_id",
    },
    curriculum_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "curriculum_id",
    },
    certificate_type_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "certificate_type_id",
    },
    sect_name_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "sect_name_id",
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
    tracking_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "tracking_number",
    },
    applicant_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "applicant_id",
    },
    school_phone: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "school_phone",
    },
    school_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "school_email",
      validate: {
        isEmail: {
          args: true,
          msg: "Invalid email format",
        },
      },
    },
    po_box: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "po_box",
    },
    stage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "stage",
    },
    school_address: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "school_address",
    },
    number_of_students: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "number_of_students",
    },
    lessons_and_courses: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "lessons_and_courses",
    },
    number_of_teachers: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "number_of_teachers",
    },
    teacher_student_ratio_recommendation: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "teacher_student_ratio_recommendation",
    },
    teacher_information: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      field: "teacher_information",
    },
    is_for_disabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_for_disabled",
    },
    control_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "control_number",
    },
    is_hostel: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_hostel",
    },
    file_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "file_number",
    },
    school_folio: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "school_folio",
    },
    max_folio: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "max_folio",
    },
    male_capacity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "male_capacity",
    },
    female_capacity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "female_capacity",
    },
  },
  {
    tableName: "establishing_schools",
    timestamps: false,
    indexes: [
      {
        name: "establishing_schools_school_category_id_index",
        fields: ["school_category_id"],
      },
      {
        name: "establishing_schools_school_sub_category_id_index",
        fields: ["school_sub_category_id"],
      },
      {
        name: "establishing_schools_language_id_index",
        fields: ["language_id"],
      },
      {
        name: "establishing_schools_building_structure_id_index",
        fields: ["building_structure_id"],
      },
      {
        name: "establishing_schools_school_gender_type_id_index",
        fields: ["school_gender_type_id"],
      },
      {
        name: "establishing_schools_school_specialization_id_index",
        fields: ["school_specialization_id"],
      },
      {
        name: "establishing_schools_ward_id_index",
        fields: ["ward_id"],
      },
      {
        name: "establishing_schools_registration_structure_id_index",
        fields: ["registration_structure_id"],
      },
      {
        name: "establishing_schools_curriculum_id_index",
        fields: ["curriculum_id"],
      },
      {
        name: "establishing_schools_certificate_type_id_index",
        fields: ["certificate_type_id"],
      },
      {
        name: "establishing_schools_sect_name_id_index",
        fields: ["sect_name_id"],
      },
      {
        name: "idx_establishing_schools_village_id",
        fields: ["village_id"],
      },
      {
        name: "establishing_school_secure_token_index",
        fields: ["secure_token"],
      },
      {
        name: "fk_establishing_schools_applicant",
        fields: ["applicant_id"],
      },
    ],
  },
);

module.exports = EstablishingSchool;
