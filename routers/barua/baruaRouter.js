require("dotenv").config();
const express = require("express");
const db = require("../../config/database");
const baruaRouter = express.Router();
const { isAuth, permission } = require("../../utils");
const { writeSystemLog } = require("../../src/Utils/systemLogService");

const LETTER_DATA_SQL = `
SELECT
  a.id AS application_id,
  a.establishing_school_id,
  a.application_category_id,
  a.approved_at,
  e.id AS school_id,
  e.ward_id,
  e.village_id,
  e.applicant_id,
  e.file_number,
  e.school_folio,
  a.folio,
  e.registry_type_id,
  e.school_category_id,
  CASE
    WHEN a.application_category_id = 9 AND fsi.school_name IS NOT NULL THEN fsi.school_name
    ELSE e.school_name
  END AS school_name,
  COALESCE(CASE
    WHEN a.application_category_id = 9 THEN e.school_name
    ELSE NULL
  END, '') AS old_school_name,
  COALESCE(CASE
    WHEN a.application_category_id = 7 THEN fo.owner_name
    WHEN a.application_category_id = 2 AND ? = 'mmiliki' THEN COALESCE(ow_req.owner_name, ow_current.owner_name)
    ELSE NULL
  END, '') AS owner_name,
  COALESCE(CASE
    WHEN a.application_category_id = 7 THEN COALESCE(ow_current.owner_name, ow_req.owner_name)
    ELSE NULL
  END, '') AS old_owner_name,
  COALESCE(CASE
    WHEN a.application_category_id = 8 THEN TRIM(CONCAT_WS(' ', fm.manager_first_name, fm.manager_middle_name, fm.manager_last_name))
    WHEN a.application_category_id = 2 AND ? = 'meneja' THEN TRIM(CONCAT_WS(' ', mg_req.manager_first_name, mg_req.manager_middle_name, mg_req.manager_last_name))
    ELSE NULL
  END, '') AS manager_name,
  COALESCE(CASE
    WHEN a.application_category_id = 8 THEN TRIM(CONCAT_WS(' ', mg_current.manager_first_name, mg_current.manager_middle_name, mg_current.manager_last_name))
    ELSE NULL
  END, '') AS old_manager_name,
  CASE
    WHEN a.application_category_id = 6 THEN COALESCE(sc_new.category, sc.category)
    ELSE sc.category
  END AS category,
  COALESCE(CASE
    WHEN a.application_category_id = 6 THEN sc.category
    ELSE NULL
  END, '') AS old_category,
  sr.registration_number,
  sr.registration_date,
  sr.id AS school_registration_id,
  CASE
    WHEN a.application_category_id = 5 THEN COALESCE(fsi.stream, 0)
    ELSE e.stream
  END AS stream,
  CASE
    WHEN a.application_category_id = 5 THEN COALESCE(e.stream, 0)
    ELSE NULL
  END AS old_stream,
  ssc.subcategory,
  lang.language,
  COALESCE(fcomb.combinations, '') AS combinations,
  COALESCE(e.number_of_students, 0) AS number_of_students,
  sgt.gender_type,
  ct.level,
  CASE
    WHEN a.application_category_id = 10 AND w_former.WardName IS NOT NULL THEN w_former.WardName
    ELSE w_current.WardName
  END AS ward,
  CASE
    WHEN a.application_category_id = 10 THEN w_current.WardName
    ELSE NULL
  END AS t_ward,
  CASE
    WHEN a.application_category_id = 10 THEN d_current.LgaName
    ELSE NULL
  END AS t_district,
  CASE
    WHEN a.application_category_id = 10 THEN r_current.RegionName
    ELSE NULL
  END AS t_region,
  CASE
    WHEN a.application_category_id = 10 THEN s_current.StreetName
    ELSE NULL
  END AS t_street,
  CASE
    WHEN a.application_category_id = 10 THEN s_former.StreetName
    ELSE NULL
  END AS t_old_street,
  CASE
    WHEN a.application_category_id = 10 THEN w_former.WardName
    ELSE NULL
  END AS t_old_ward,
  CASE
    WHEN a.application_category_id = 10 THEN d_former.LgaName
    ELSE NULL
  END AS t_old_district,
  CASE
    WHEN a.application_category_id = 10 THEN r_former.RegionName
    ELSE NULL
  END AS t_old_region,
  COALESCE(fsi.is_hostel, e.is_hostel) AS is_hostel,
  e.is_hostel AS was_hostel,
  e.sharti AS masharti,
  CASE
    WHEN a.application_category_id IN (5, 6, 9, 10, 11, 13, 14) AND r_former.RegionName IS NOT NULL THEN r_former.RegionName
    ELSE r_current.RegionName
  END AS region,
  CASE
    WHEN a.application_category_id IN (5, 6, 9, 10, 11, 13, 14) AND d_former.LgaName IS NOT NULL THEN d_former.LgaName
    ELSE d_current.LgaName
  END AS district,
  CASE
    WHEN a.application_category_id IN (5, 6, 9, 10, 11, 13, 14) AND z_former.zone_name IS NOT NULL THEN z_former.zone_name
    ELSE z_current.zone_name
  END AS zone_name,
  CASE
    WHEN a.application_category_id IN (5, 6, 9, 10, 11, 13, 14) AND z_former.box IS NOT NULL THEN z_former.box
    ELSE z_current.box
  END AS zone_box,
  CASE
    WHEN a.application_category_id IN (5, 6, 9, 10, 11, 13, 14) AND r_former.box IS NOT NULL THEN r_former.box
    ELSE r_current.box
  END AS region_box,
  CASE
    WHEN a.application_category_id IN (5, 6, 9, 10, 11, 13, 14) AND d_former.district_box IS NOT NULL THEN d_former.district_box
    ELSE d_current.district_box
  END AS district_box,
  CASE
    WHEN a.application_category_id IN (5, 6, 9, 10, 11, 13, 14) AND d_former.ngazi IS NOT NULL THEN d_former.ngazi
    ELSE d_current.ngazi
  END AS ngazi_ya_wilaya,
  CASE
    WHEN a.application_category_id IN (5, 6, 9, 10, 11, 13, 14) AND d_former.sqa_box IS NOT NULL THEN d_former.sqa_box
    ELSE d_current.sqa_box
  END AS district_sqa_box,
  CASE
    WHEN a.application_category_id IN (5, 6, 9, 10, 11, 13, 14) AND r_former.zone_id IS NOT NULL THEN r_former.zone_id
    ELSE r_current.zone_id
  END AS zone_id,
  UCASE(app.title) AS address_title,
  UCASE(app.display_name) AS address_name,
  app.box AS address_box,
  r_addr.RegionName AS address_region,
  u.name AS signatory,
  u.signature AS base64signature,
  roles.description AS cheo
FROM applications a
JOIN establishing_schools e ON e.id = a.establishing_school_id
LEFT JOIN former_school_infos fsi ON fsi.tracking_number = a.tracking_number
LEFT JOIN former_owners fo ON fo.tracking_number = a.tracking_number
LEFT JOIN former_managers fm ON fm.tracking_number = a.tracking_number
LEFT JOIN owners ow_req ON ow_req.tracking_number = a.tracking_number
LEFT JOIN owners ow_current ON ow_current.establishing_school_id = e.id
  AND ow_current.tracking_number = e.tracking_number
LEFT JOIN managers mg_req ON mg_req.tracking_number = a.tracking_number
LEFT JOIN managers mg_current ON mg_current.establishing_school_id = e.id
  AND mg_current.tracking_number = e.tracking_number
LEFT JOIN (
  SELECT sr1.*
  FROM school_registrations sr1
  INNER JOIN (
    SELECT establishing_school_id, MAX(id) AS max_id
    FROM school_registrations
    GROUP BY establishing_school_id
  ) latest_sr ON latest_sr.max_id = sr1.id
) sr ON sr.establishing_school_id = e.id
LEFT JOIN school_categories sc ON sc.id = e.school_category_id
LEFT JOIN school_categories sc_new ON sc_new.id = fsi.school_category_id
LEFT JOIN school_sub_categories ssc ON ssc.id = e.school_sub_category_id
LEFT JOIN languages lang ON lang.id = e.language_id
LEFT JOIN school_gender_types sgt ON sgt.id = e.school_gender_type_id
LEFT JOIN certificate_types ct ON ct.id = e.certificate_type_id
LEFT JOIN wards w_current ON w_current.WardCode = e.ward_id
LEFT JOIN districts d_current ON d_current.LgaCode = w_current.LgaCode
LEFT JOIN regions r_current ON r_current.RegionCode = d_current.RegionCode
LEFT JOIN zones z_current ON z_current.id = r_current.zone_id
LEFT JOIN streets s_current ON s_current.StreetCode = e.village_id
LEFT JOIN wards w_former ON w_former.WardCode = fsi.ward_id
LEFT JOIN districts d_former ON d_former.LgaCode = w_former.LgaCode
LEFT JOIN regions r_former ON r_former.RegionCode = d_former.RegionCode
LEFT JOIN zones z_former ON z_former.id = r_former.zone_id
LEFT JOIN streets s_former ON s_former.StreetCode = fsi.village_id
LEFT JOIN applicants app ON app.id = e.applicant_id
LEFT JOIN districts d_addr ON d_addr.LgaCode = app.lga_box_location
LEFT JOIN regions r_addr ON r_addr.RegionCode = d_addr.RegionCode
LEFT JOIN staffs u ON u.id = a.approved_by
LEFT JOIN roles roles ON roles.id = u.user_level
LEFT JOIN (
  SELECT
    fc.tracking_number,
    GROUP_CONCAT(DISTINCT c.combination ORDER BY c.combination SEPARATOR ', ') AS combinations
  FROM former_school_combinations fc
  LEFT JOIN combinations c ON c.id = fc.combination_id
  GROUP BY fc.tracking_number
) fcomb ON fcomb.tracking_number = a.tracking_number
WHERE a.tracking_number = ?
  AND a.is_approved = 2
  AND a.folio IS NOT NULL
LIMIT 1
`;

const BASE_REQUIRED_FIELDS = [
  "application_category_id",
  "registry_type_id",
  "school_category_id",
  "school_name",
  "approved_at",
  "file_number",
  "folio",
  "address_title",
  "address_name",
  "address_box",
  "address_region",
  "region",
  "district",
  "ward",
  "signatory",
  "cheo",
  "zone_name",
  "zone_box",
  "region_box",
  "district_box",
  "district_sqa_box",
  "ngazi_ya_wilaya",
];

const CATEGORY_REQUIRED_FIELDS = {
  2: (type) => (type === "meneja" ? ["manager_name"] : ["owner_name"]),
  4: ["registration_number", "level", "category"],
  5: ["stream", "old_stream"],
  6: ["category", "old_category"],
  7: ["owner_name", "old_owner_name", "registration_number"],
  8: ["manager_name", "old_manager_name"],
  9: ["old_school_name"],
  10: [
    "t_street",
    "t_ward",
    "t_district",
    "t_region",
    "t_old_street",
    "t_old_ward",
    "t_old_district",
    "t_old_region",
  ],
  12: ["combinations", "gender_type"],
  13: ["number_of_students"],
  14: ["number_of_students", "gender_type"],
};

const FIELD_SOURCES = {
  application_category_id: "applications.application_category_id",
  registry_type_id: "establishing_schools.registry_type_id",
  school_category_id: "establishing_schools.school_category_id",
  school_name: "establishing_schools.school_name / former_school_infos.school_name",
  old_school_name: "establishing_schools.school_name",
  approved_at: "applications.approved_at",
  file_number: "establishing_schools.file_number",
  folio: "applications.folio",
  registration_number: "school_registrations.registration_number",
  level: "certificate_types.level",
  category: "school_categories.category",
  old_category: "school_categories.category (old)",
  owner_name: "former_owners.owner_name / owners.owner_name",
  old_owner_name: "owners.owner_name",
  manager_name: "former_managers / managers (name fields)",
  old_manager_name: "managers (name fields)",
  address_title: "applicants.title",
  address_name: "applicants.display_name",
  address_box: "applicants.box",
  address_region: "regions.RegionName via applicants.lga_box_location -> districts -> regions",
  region: "regions.RegionName (current/former school location)",
  district: "districts.LgaName (current/former school location)",
  ward: "wards.WardName (current/former school location)",
  signatory: "staffs.name",
  cheo: "roles.description",
  zone_name: "zones.zone_name (current/former school location)",
  zone_box: "zones.box (current/former school location)",
  region_box: "regions.box (current/former school location)",
  district_box: "districts.district_box (current/former school location)",
  district_sqa_box: "districts.sqa_box (current/former school location)",
  ngazi_ya_wilaya: "districts.ngazi (current/former school location)",
  stream: "establishing_schools.stream / former_school_infos.stream",
  old_stream: "establishing_schools.stream",
  t_street: "streets.StreetName (current school)",
  t_ward: "wards.WardName (current school)",
  t_district: "districts.LgaName (current school)",
  t_region: "regions.RegionName (current school)",
  t_old_street: "streets.StreetName (former_school_infos.village_id)",
  t_old_ward: "wards.WardName (former_school_infos.ward_id)",
  t_old_district: "districts.LgaName (former school)",
  t_old_region: "regions.RegionName (former school)",
  combinations: "former_school_combinations + combinations",
  gender_type: "school_gender_types.gender_type",
  number_of_students: "establishing_schools.number_of_students",
};

const isMissingValue = (value) =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim() === "");

const getRequiredFieldsByCategory = (categoryId, type) => {
  const configured = CATEGORY_REQUIRED_FIELDS[Number(categoryId)];
  if (!configured) return [];
  return typeof configured === "function" ? configured(type) : configured;
};

const validateLetterData = (data, type) => {
  const categoryId = Number(data?.application_category_id || 0);
  const requiredFields = [
    ...BASE_REQUIRED_FIELDS,
    ...getRequiredFieldsByCategory(categoryId, type),
  ];
  const missingFields = [...new Set(requiredFields)].filter((field) =>
    isMissingValue(data?.[field])
  );

  const causes = missingFields.map((field) => ({
    field,
    source: FIELD_SOURCES[field] || "unknown",
  }));

  return { categoryId, missingFields, causes };
};

const logLetterIssue = ({
  stage,
  tracking_number,
  type,
  application_category_id,
  message,
  causes = [],
  context = null,
  error = null,
}) => {
  console.error("[BARUA][ERROR]", {
    stage,
    tracking_number,
    type,
    application_category_id: application_category_id || null,
    message,
    causes,
    context,
    error: error
      ? {
          code: error.code,
          errno: error.errno,
          sqlMessage: error.sqlMessage,
          message: error.message,
        }
      : null,
  });

  const levelByStage = {
    "record-not-found": "warning",
    "required-fields-validation": "warning",
    "query-sqa-zone-region": "error",
    "query-letter-data": "critical",
  };

  writeSystemLog({
    level: levelByStage[String(stage || "").trim()] || (error ? "error" : "warning"),
    module: "barua",
    event_type: stage || "unknown",
    message,
    source: "sas-api/routers/barua/baruaRouter.js",
    application_id: context?.application_id || null,
    tracking_number: tracking_number || context?.tracking_number || null,
    context: {
      ...context,
      type: type || null,
      application_category_id: application_category_id || null,
    },
    causes,
    error_details: error
      ? {
          code: error.code,
          errno: error.errno,
          sqlMessage: error.sqlMessage,
          message: error.message,
        }
      : null,
  });
};

const buildDebugContext = (data) => ({
  application_id: data?.application_id ?? null,
  application_category_id: data?.application_category_id ?? null,
  establishing_school_id: data?.establishing_school_id ?? null,
  school_id: data?.school_id ?? null,
  school_registration_id: data?.school_registration_id ?? null,
  applicant_id: data?.applicant_id ?? null,
  ward_id: data?.ward_id ?? null,
  village_id: data?.village_id ?? null,
  tracking_number: data?.tracking_number || null,
});

// List of
baruaRouter.post(
  "/barua/:tracking_number",
  isAuth,
  permission("view-letters"),
  (req, res) => {
    const tracking_number = req.params.tracking_number;
    const type = String(req.body?.type || "").trim().toLowerCase();

    db.query(LETTER_DATA_SQL, [type, type, tracking_number], (error, results) => {
      if (error) {
        logLetterIssue({
          stage: "query-letter-data",
          tracking_number,
          type,
          message: "Query ya data ya barua imeshindwa.",
          error,
        });
        return res.status(500).send({
          error: true,
          message: "Database error",
          sqlError: error,
        });
      }

      const data = Array.isArray(results) && results.length > 0 ? results[0] : null;
      if (!data) {
        logLetterIssue({
          stage: "record-not-found",
          tracking_number,
          type,
          message:
            "Hakuna data ya barua. Inawezekana ombi halipo, halijakubaliwa (is_approved != 2), au halina folio.",
        });
        return res.send({
          error: false,
          statusCode: 306,
          data: null,
          message: "Not Found",
        });
      }

      const validation = validateLetterData(data, type);
      let warnings = null;
      if (validation.missingFields.length > 0) {
        const missing = validation.missingFields.join(", ");
        const context = buildDebugContext(data);
        logLetterIssue({
          stage: "required-fields-validation",
          tracking_number,
          type,
          application_category_id: validation.categoryId,
          message: `Data muhimu za barua hazijakamilika: ${missing}`,
          causes: validation.causes,
          context,
        });
        warnings = {
          message: `Data ya barua haijakamilika. Fields zilizokosekana: ${missing}`,
          missing_fields: validation.missingFields,
          causes: validation.causes,
          context,
        };
      }

      db.query(
        `SELECT r.RegionName AS sqa_zone_region
         FROM regions r
         WHERE r.zone_id = ? AND r.sqa_zone = 1
         LIMIT 1`,
        [Number(data.zone_id || 0)],
        (zoneError, zoneRows) => {
          if (zoneError) {
            logLetterIssue({
              stage: "query-sqa-zone-region",
              tracking_number,
              type,
              application_category_id: validation.categoryId,
              message: "Imeshindikana kupata sqa_zone_region.",
              error: zoneError,
            });
          }
          const sqa_zone_region =
            Array.isArray(zoneRows) && zoneRows.length > 0
              ? zoneRows[0].sqa_zone_region
              : null;

          return res.send({
            error: false,
            statusCode: 300,
            data,
            sqa_zone_region,
            warnings,
            message: "Success",
          });
        }
      );
    });
  }
);

module.exports = baruaRouter;
