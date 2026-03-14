// src/Models/index.js
const Staff = require("./StaffModel");
const Role = require("./RoleModel");
const Application = require("./ApplicationModel");
const ApplicationCategory = require("./ApplicationCategoryModel");
const Comment = require("./CommentModel");
const Attachment = require("./AttachmentModel");
const AttachmentType = require("./AttachmentTypeModel");
const User = require("./UserModel");
const EstablishingSchool = require("./EstablishingSchoolModel");
const Applicant = require("./ApplicantModel");
const PersonalInfo = require("./PersonalInfoModel");
const InstituteInfo = require("./InstituteInfoModel");
const SchoolCategory = require("./SchoolCategoryModel");
const SchoolSubCategory = require("./SchoolSubCategoryModel");
const SchoolRegistration = require("./SchoolRegistrationModel");
const RegistryType = require("./RegistryTypeModel");
const Language = require("./LanguageModel");
const BuildingStructure = require("./BuildingStructureModel");
const SchoolGenderType = require("./SchoolGenderTypeModel");
const SchoolSpecialization = require("./SchoolSpecializationModel");
const RegistrationStructure = require("./RegistrationStructureModel");
const Curriculum = require("./CurriculumModel");
const CertificateType = require("./CertificateTypeModel");
const Combination = require("./CombinationModel");
const SchoolCombination = require("./SchoolCombinationModel");
const SectName = require("./SectNameModel");
const Street = require("./StreetModel");
const Ward = require("./WardModel");
const District = require("./DistrictModel");
const Region = require("./RegionModel");

// Define associations between models here
Application.belongsTo(ApplicationCategory, {
  foreignKey: "application_category_id",
  targetKey: "id",
  as: "application_category",
});

Application.belongsTo(User, {
  foreignKey: "user_id",
  targetKey: "id",
  as: "applicant",
});

Application.belongsTo(Staff, {
  foreignKey: "staff_id",
  targetKey: "id",
  as: "assigned_staff",
});

Application.hasMany(Comment, {
  foreignKey: "trackingNo",
  sourceKey: "tracking_number",
  as: "comments",
});

Application.hasMany(Attachment, {
  foreignKey: "tracking_number",
  sourceKey: "tracking_number",
  as: "attachments",
});

Application.belongsTo(EstablishingSchool, {
  foreignKey: "establishing_school_id",
  targetKey: "id",
  as: "establishing_school",
});

EstablishingSchool.belongsTo(Applicant, {
    foreignKey: "applicant_id",
    targetKey: "id",
    as: "contact_person",
})

EstablishingSchool.belongsTo(SchoolCategory, {
  foreignKey: "school_category_id",
  targetKey: "id",
  as: "school_type",
});

EstablishingSchool.belongsTo(SchoolSubCategory, {
  foreignKey: "school_sub_category_id",
  targetKey: "id",
  as: "school_sub_category",
});

EstablishingSchool.belongsTo(RegistryType, {
  foreignKey: "registry_type_id",
  targetKey: "id",
  as: "registry_type",
});

EstablishingSchool.belongsTo(Language, {
  foreignKey: "language_id",
  targetKey: "id",
  as: "language",
});

EstablishingSchool.belongsTo(BuildingStructure, {
  foreignKey: "building_structure_id",
  targetKey: "id",
  as: "building_structure",
});

EstablishingSchool.belongsTo(SchoolGenderType, {
  foreignKey: "school_gender_type_id",
  targetKey: "id",
  as: "school_gender_type",
});

EstablishingSchool.belongsTo(SchoolSpecialization, {
  foreignKey: "school_specialization_id",
  targetKey: "id",
  as: "school_specialization",
});

EstablishingSchool.belongsTo(RegistrationStructure, {
  foreignKey: "registration_structure_id",
  targetKey: "id",
  as: "registration_structure",
});

EstablishingSchool.belongsTo(Curriculum, {
  foreignKey: "curriculum_id",
  targetKey: "id",
  as: "curriculum",
});

EstablishingSchool.belongsTo(CertificateType, {
  foreignKey: "certificate_type_id",
  targetKey: "id",
  as: "certificate_type",
});

EstablishingSchool.belongsTo(SectName, {
  foreignKey: "sect_name_id",
  targetKey: "id",
  as: "sect_name",
});

EstablishingSchool.hasOne(SchoolRegistration, {
  foreignKey: "establishing_school_id",
  sourceKey: "id",
  as: "school_registration",
});

SchoolRegistration.belongsTo(EstablishingSchool, {
  foreignKey: "establishing_school_id",
  targetKey: "id",
  as: "establishing_school",
});

SchoolRegistration.belongsTo(RegistryType, {
  foreignKey: "level_of_education",
  targetKey: "id",
  as: "registration",
});

SchoolRegistration.hasMany(SchoolCombination, {
  foreignKey: "school_registration_id",
  sourceKey: "id",
  as: "school_combinations",
});

SchoolCombination.belongsTo(SchoolRegistration, {
  foreignKey: "school_registration_id",
  targetKey: "id",
  as: "school_registration",
});

SchoolCombination.belongsTo(Combination, {
  foreignKey: "combination_id",
  targetKey: "id",
  as: "combination",
});

Combination.hasMany(SchoolCombination, {
  foreignKey: "combination_id",
  sourceKey: "id",
  as: "school_combinations",
});

Combination.belongsTo(CertificateType, {
  foreignKey: "certificate_type_id",
  targetKey: "id",
  as: "certificate_type",
});

Combination.belongsTo(SchoolSpecialization, {
  foreignKey: "school_specialization_id",
  targetKey: "id",
  as: "school_specialization",
});

Staff.belongsTo(Role, {
  foreignKey: "user_level",
  targetKey: "id",
  as: "role",
});

Role.hasMany(Staff, {
  foreignKey: "user_level",
  sourceKey: "id",
  as: "staffs",
});

// Associations for Comment (Maoni)
Comment.belongsTo(Staff, {
  foreignKey: "user_from",
  targetKey: "id",
  as: "sender",
});

Comment.belongsTo(Staff, {
  foreignKey: "user_to",
  targetKey: "id",
  as: "receiver",
});

Comment.belongsTo(Application, {
  foreignKey: "trackingNo",
  targetKey: "tracking_number",
  as: "application",
});

Attachment.belongsTo(Application, {
  foreignKey: "tracking_number",
  targetKey: "tracking_number",
  as: "application",
});

Attachment.belongsTo(AttachmentType, {
  foreignKey: "attachment_type_id",
  targetKey: "id",
  as: "attachment_type",
});

// ============================================
// ASSOCIATIONS - Hizi zitawekwa kwenye index.js
// ============================================
/*
EstablishingSchool.belongsTo(SchoolCategory, {
  foreignKey: "school_category_id",
  as: "school_category",
});

EstablishingSchool.belongsTo(SchoolSubCategory, {
  foreignKey: "school_sub_category_id",
  as: "school_sub_category",
});

EstablishingSchool.belongsTo(RegistryType, {
  foreignKey: "registry_type_id",
  as: "registry_type",
});

EstablishingSchool.belongsTo(Language, {
  foreignKey: "language_id",
  as: "language",
});

EstablishingSchool.belongsTo(BuildingStructure, {
  foreignKey: "building_structure_id",
  as: "building_structure",
});

EstablishingSchool.belongsTo(SchoolGenderType, {
  foreignKey: "school_gender_type_id",
  as: "school_gender_type",
});

EstablishingSchool.belongsTo(SchoolSpecialization, {
  foreignKey: "school_specialization_id",
  as: "school_specialization",
});

EstablishingSchool.belongsTo(Ward, {
  foreignKey: "ward_id",
  targetKey: "WardCode",
  as: "ward",
});

EstablishingSchool.belongsTo(Village, {
  foreignKey: "village_id",
  targetKey: "VillageCode", // Assume ina VillageCode field
  as: "village",
});

EstablishingSchool.belongsTo(RegistrationStructure, {
  foreignKey: "registration_structure_id",
  as: "registration_structure",
});

EstablishingSchool.belongsTo(Curriculum, {
  foreignKey: "curriculum_id",
  as: "curriculum",
});

EstablishingSchool.belongsTo(CertificateType, {
  foreignKey: "certificate_type_id",
  as: "certificate_type",
});

EstablishingSchool.belongsTo(SectName, {
  foreignKey: "sect_name_id",
  as: "sect_name",
});

EstablishingSchool.belongsTo(Applicant, {
  foreignKey: "applicant_id",
  as: "applicant",
});
*/

// ===== POLYMORPHIC ASSOCIATIONS (kwa Applicant) =====
// Applicant belongs to either PersonalInfo or InstituteInfo
Applicant.belongsTo(PersonalInfo, {
  foreignKey: "applicantable_id",
  constraints: false,
  as: "personal_info",
});

Applicant.belongsTo(InstituteInfo, {
  foreignKey: "applicantable_id",
  constraints: false,
  as: "institute_info"
});

Applicant.belongsTo(District, {
  foreignKey: "lga_box_location",
  targetKey: "LgaCode",
  constraints: false,
  as: "lga_district",
});

Ward.belongsTo(District, {
  foreignKey: "LgaCode",
  targetKey: "LgaCode",
  constraints: false,
  as: "district",
});

// Reverse: PersonalInfo has one Applicant
PersonalInfo.hasOne(Applicant, {
  foreignKey: "applicantable_id",
  constraints: false,
  as: "applicant",
  scope: {
    applicantable_type: "App\\Models\\Personal_info"
  }
});

// Reverse: InstituteInfo has one Applicant
InstituteInfo.hasOne(Applicant, {
  foreignKey: "applicantable_id",
  constraints: false,
  as: "applicant",
  scope: {
    applicantable_type: "App\\Models\\Institute_info"
  }
});

module.exports = {
  Staff,
  Role,
  Application,
  EstablishingSchool,
  Applicant,
  ApplicationCategory,
  User,
  Comment,
  Attachment,
  AttachmentType,
  PersonalInfo,
  InstituteInfo,
  SchoolCategory,
  SchoolSubCategory,
  SchoolRegistration,
  RegistryType,
  Language,
  BuildingStructure,
  SchoolGenderType,
  SchoolSpecialization,
  RegistrationStructure,
  Curriculum,
  CertificateType,
  Combination,
  SchoolCombination,
  SectName,
  Street,
  Ward,
  District,
  Region,
};
