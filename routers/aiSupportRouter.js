require("dotenv").config();
const express = require("express");
const { QueryTypes } = require("sequelize");
const { isAuth, permission, filterByUserOffice } = require("../utils");
const db = require("../src/Config/DbConfig");
const { chat, getAIProvider } = require("../src/Utils/aiClient");
const { buildSupportContext, redactText, extractTrackingNumbers } = require("../src/Utils/aiSupportContext");
const ApplicationAPIService = require("../src/Services/ApplicationAPIService");

const aiSupportRouter = express.Router();

const toText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const safeTrim = (value) => toText(value, "").trim();

const SENSITIVE_ENV_LINE = /^[A-Z][A-Z0-9_]{2,}\s*=\s*.+$/m;
const SENSITIVE_ENV_NAME =
  /\b(OLLAMA_|API_BASE_URL|ACCESS_TOKEN_SECRET|REFRESH_TOKEN_SECRET|DB_|MYSQL_|JWT_|TOKEN|PASSWORD|SECRET|KEY)\w*\s*=/i;
const SIMPLE_GREETING_PATTERN =
  /^(hi+|hello+|hey+|mambo|vipi|habari|habari yako|shikamoo|salaam|hujambo)$/i;
const REGISTERED_SCHOOLS_COUNT_PATTERN =
  /(idadi|jumla|ngapi).*(shule).*(zilizosajiliwa|zimesajiliwa|imesajiliwa|registered)|((registered|zilizosajiliwa).*(schools|shule).*(count|idadi|jumla|ngapi))/i;
const REGISTERED_SCHOOLS_BY_OWNERSHIP_PATTERN =
  /(idadi|jumla|ngapi).*(shule).*(zilizosajiliwa|zimesajiliwa|registered).*(umiliki)|((registered|zilizosajiliwa).*(schools|shule).*(ownership|umiliki))/i;
const PENDING_APPLICATIONS_PATTERN =
  /(idadi|jumla|ngapi).*(maombi).*(yanayosubiri|pending)|((pending|yanayosubiri).*(applications|maombi).*(count|idadi|jumla|ngapi))/i;
const PENDING_APPLICATIONS_BY_CATEGORY_PATTERN =
  /(idadi|jumla|ngapi).*(maombi?|applications?).*(yanayosubiri|pending).*(aina|aina ya maombi|aina ya ombi|kwa aina|kwa aina ya maombi|kwa aina ya ombi|category|categories|application category|ombi)|((pending|yanayosubiri).*(applications?|maombi?).*(aina|aina ya maombi|aina ya ombi|kwa aina|kwa aina ya maombi|kwa aina ya ombi|category|categories|application category|ombi))/i;
const APPROVED_APPLICATIONS_PATTERN =
  /(idadi|jumla|ngapi).*(maombi|applications?).*(yaliyothibitishwa|yaliyoidhinishwa|approved|approved applications|yamethibitishwa)|((approved|yaliyothibitishwa|yaliyoidhinishwa).*(applications?|maombi).*(count|idadi|jumla|ngapi))/i;
const APPROVED_APPLICATIONS_BY_CATEGORY_PATTERN =
  /(idadi|jumla|ngapi).*(maombi|applications?).*(yaliyothibitishwa|yaliyoidhinishwa|approved).*(aina|aina ya maombi|aina ya ombi|kwa aina|kwa aina ya maombi|kwa aina ya ombi|category|categories|application category|ombi)|((approved|yaliyothibitishwa|yaliyoidhinishwa).*(applications?|maombi?).*(aina|aina ya maombi|aina ya ombi|kwa aina|kwa aina ya maombi|kwa aina ya ombi|category|categories|application category|ombi))/i;
const REJECTED_APPLICATIONS_PATTERN =
  /(idadi|jumla|ngapi).*(maombi|applications?).*(yaliyokataliwa|rejected|rejection|yamekataliwa)|((rejected|yaliyokataliwa|yamekataliwa).*(applications?|maombi).*(count|idadi|jumla|ngapi))/i;
const REJECTED_APPLICATIONS_BY_CATEGORY_PATTERN =
  /(idadi|jumla|ngapi).*(maombi|applications?).*(yaliyokataliwa|rejected).*(aina|aina ya maombi|aina ya ombi|kwa aina|category|categories|application category|ombi)|((rejected|yaliyokataliwa).*(applications?|maombi?).*(aina|aina ya maombi|aina ya ombi|kwa aina|category|categories|application category|ombi))/i;
const APPLICATIONS_BY_CATEGORY_PATTERN =
  /(idadi|jumla|ngapi).*(maombi|applications?).*(aina ya maombi|aina ya ombi|kwa aina|category|categories|application category)|((applications?|maombi).*(by category|aina ya maombi|aina ya ombi|category))/i;
const REGISTERED_SCHOOLS_BY_REGION_PATTERN =
  /(shule).*(zilizosajiliwa|registered).*(kwa mkoa|mkoa)|((registered|zilizosajiliwa).*(schools|shule).*(region|mkoa))/i;
const REGISTRATION_GROWTH_BY_REGION_PATTERN =
  /((mkoa|mikoa|region|regions).*(growth).*(registrations?|usajili).*(mwaka huu|this year))|((growth).*(registrations?|usajili).*(mwaka huu|this year).*(mkoa|mikoa|region|regions))|((mkoa|mikoa|region|regions).*(una|yenye|gani).*(growth kubwa).*(registrations?|usajili))/i;
const REGISTRATION_GROWTH_BY_DISTRICT_PATTERN =
  /((wilaya|district|districts).*(growth).*(registrations?|usajili).*(mwaka huu|this year))|((growth).*(registrations?|usajili).*(mwaka huu|this year).*(wilaya|district|districts))|((wilaya|district|districts).*(ina|zenye|gani).*(growth kubwa).*(registrations?|usajili))/i;
const REGISTERED_SCHOOLS_BY_DISTRICT_PATTERN =
  /(shule).*(zilizosajiliwa|registered).*(kwa wilaya|wilaya)|((registered|zilizosajiliwa).*(schools|shule).*(district|wilaya))/i;
const REGISTERED_SCHOOLS_BY_TYPE_PATTERN =
  /(shule).*(zilizosajiliwa|registered).*(aina ya shule|aina ya school|school type|type)|((registered|zilizosajiliwa).*(schools|shule).*(school type|aina ya shule|type))/i;
const REGISTERED_SCHOOLS_BY_LANGUAGE_PATTERN =
  /(idadi|jumla|ngapi).*(shule).*(lugha ya kufundishia|language|lugha)|((shule|schools).*(kwa lugha|by language|language breakdown))/i;
const TOP_ENGLISH_MEDIUM_REGIONS_PATTERN =
  /((mkoa|mikoa|region|regions).*(english medium))|((english medium).*(mkoa|mikoa|region|regions).*(nyingi zaidi|zaidi|top|gani))/i;
const TOP_SWAHILI_MEDIUM_REGIONS_PATTERN =
  /((mkoa|mikoa|region|regions).*(kiswahili medium|swahili medium|kiswahili))|((kiswahili medium|swahili medium|kiswahili).*(mkoa|mikoa|region|regions).*(nyingi zaidi|zaidi|top|gani))/i;
const REGISTERED_SCHOOLS_BY_CURRICULUM_PATTERN =
  /(idadi|jumla|ngapi).*(shule).*(curriculum)|((shule|schools).*(kwa curriculum|by curriculum|curriculum breakdown))/i;
const TOP_CURRICULUM_REGIONS_PATTERN =
  /((mkoa|mikoa|region|regions).*(curriculum))|((curriculum).*(mkoa|mikoa|region|regions).*(nyingi zaidi|zaidi|top|gani))/i;
const CURRICULUM_MOST_USED_PATTERN =
  /(curriculum gani inatumika zaidi|most used curriculum|curriculum most used)/i;
const REGISTERED_SCHOOLS_BY_CERTIFICATE_TYPE_PATTERN =
  /(idadi|jumla|ngapi).*(shule).*(certificate type|aina ya cheti|aina ya certificate)|((shule|schools).*(kwa certificate type|by certificate type|certificate breakdown))/i;
const TOP_CERTIFICATE_TYPE_REGIONS_PATTERN =
  /((mkoa|mikoa|region|regions).*(certificate type|aina ya cheti|certificate))|((certificate type|aina ya cheti|certificate).*(mkoa|mikoa|region|regions).*(nyingi zaidi|zaidi|top|gani))/i;
const CERTIFICATE_TYPE_MOST_USED_PATTERN =
  /(certificate type gani inatumika zaidi|most used certificate type|aina ya cheti gani inatumika zaidi)/i;
const REGISTERED_SCHOOLS_BY_SPECIALIZATION_PATTERN =
  /(idadi|jumla|ngapi).*(shule).*(specialization|tahasusi)|((shule|schools).*(kwa specialization|by specialization|specialization breakdown|kwa tahasusi))/i;
const TOP_SPECIALIZATION_REGIONS_PATTERN =
  /((mkoa|mikoa|region|regions).*(specialization|tahasusi))|((specialization|tahasusi).*(mkoa|mikoa|region|regions).*(nyingi zaidi|zaidi|top|gani))/i;
const TOP_SPECIALIZATION_DISTRICTS_PATTERN =
  /((wilaya|district|districts).*(specialization|tahasusi))|((specialization|tahasusi).*(wilaya|district|districts).*(nyingi zaidi|zaidi|top|gani))/i;
const DEREGISTERED_SCHOOLS_PATTERN =
  /(shule).*(zilizofutiwa usajili|imefutiwa usajili|deregistered|deregistration)|((deregistered|zilizofutiwa usajili).*(schools|shule))/i;
const APPLICATIONS_BY_PERIOD_PATTERN =
  /(maombi).*(leo|wiki hii|mwezi huu)|((applications|maombi).*(today|this week|this month|leo|wiki hii|mwezi huu))/i;
const OVERDUE_APPLICATIONS_PATTERN =
  /((maombi|applications?).*(yote|zote|ote).*(overdue))|((overdue).*(applications?|maombi))|((maombi|applications?).*(yaliyochelewa|yaliyo overdue|yaliyozidi muda))/i;
const TOP_PENDING_REGIONS_PATTERN =
  /((top|juu ya).*(mkoa|mikoa|region|regions).*(pending|yanayosubiri))|((mkoa|mikoa|region|regions).*(pending|yanayosubiri).*(nyingi zaidi|zaidi|top|juu))|((pending|yanayosubiri).*(mkoa|mikoa|region|regions).*(nyingi zaidi|zaidi|top|juu))/i;
const TOP_PENDING_DISTRICTS_PATTERN =
  /((top|juu ya).*(wilaya|district|districts).*(pending|yanayosubiri))|((wilaya|district|districts).*(pending|yanayosubiri).*(nyingi zaidi|zaidi|top|juu))|((pending|yanayosubiri).*(wilaya|district|districts).*(nyingi zaidi|zaidi|top|juu))/i;
const TOP_APPROVED_REGIONS_PATTERN =
  /((top|juu ya).*(mkoa|mikoa|region|regions).*(approved|approvals|yaliyothibitishwa|yamethibitishwa))|((mkoa|mikoa|region|regions).*(approved|approvals|yaliyothibitishwa|yamethibitishwa).*(nyingi zaidi|zaidi|top|juu))|((approved|approvals|yaliyothibitishwa|yamethibitishwa).*(mkoa|mikoa|region|regions).*(nyingi zaidi|zaidi|top|juu))/i;
const TOP_APPROVED_DISTRICTS_PATTERN =
  /((top|juu ya).*(wilaya|district|districts).*(approved|approvals|yaliyothibitishwa|yamethibitishwa))|((wilaya|district|districts).*(approved|approvals|yaliyothibitishwa|yamethibitishwa).*(nyingi zaidi|zaidi|top|juu))|((approved|approvals|yaliyothibitishwa|yamethibitishwa).*(wilaya|district|districts).*(nyingi zaidi|zaidi|top|juu))/i;

const coerceMessages = (messages) => {
  const rows = Array.isArray(messages) ? messages : [];
  const normalized = [];

  for (const row of rows) {
    const role = safeTrim(row?.role).toLowerCase();
    const content = safeTrim(row?.content);
    if (!content) continue;
    if (!["user", "assistant", "system"].includes(role)) continue;
    normalized.push({
      role,
      content: redactText(content).slice(0, 8000),
    });
  }

  // Keep the most recent context only
  return normalized.slice(-20);
};

const sanitizeAssistantReply = (content) => {
  const lines = safeTrim(content)
    .split(/\r?\n/)
    .map((line) => line.trimEnd());

  const filtered = lines.filter((line) => {
    const value = safeTrim(line);
    if (!value) return true;
    if (!SENSITIVE_ENV_LINE.test(value)) return true;
    return !SENSITIVE_ENV_NAME.test(value);
  });

  const sanitized = filtered.join("\n").trim();
  return sanitized;
};

const getFastReply = (message) => {
  const value = safeTrim(message).toLowerCase();
  if (!value) return "";

  if (SIMPLE_GREETING_PATTERN.test(value)) {
    return "Nipo tayari kukusaidia. Eleza tatizo lako la mfumo, error unayoiona, au taja tracking number husika.";
  }

  return "";
};

const looksLikeIndicatorQuery = (message) => {
  const value = safeTrim(message).toLowerCase();
  if (!value) return false;

  const indicatorKeywords = [
    "idadi",
    "jumla",
    "ngapi",
    "top",
    "mkoa",
    "mikoa",
    "wilaya",
    "pending",
    "yanayosubiri",
    "approved",
    "yaliyothibitishwa",
    "yaliyokataliwa",
    "shule",
    "maombi",
  ];

  return indicatorKeywords.some((keyword) => value.includes(keyword));
};

const REGISTERED_LOCATION_JOINS_SQL = `
  LEFT JOIN streets st ON st.StreetCode = e.village_id
  LEFT JOIN wards w ON w.WardCode = COALESCE(e.ward_id, st.WardCode)
  LEFT JOIN districts d ON d.LgaCode = w.LgaCode
  LEFT JOIN regions r ON r.RegionCode = d.RegionCode
`;

const normalizeIndicatorUserScope = (user = {}) => {
  const zoneId = Number(user?.zone_id || 0);
  const districtCode = safeTrim(user?.district_code);
  const office = Number(user?.office || 0);

  if (districtCode) {
    return { ...user, office: 3, district_code: districtCode };
  }

  if (zoneId > 0) {
    return { ...user, office: 2, zone_id: zoneId };
  }

  if ([1, 2, 3].includes(office)) {
    return { ...user, office };
  }

  return { ...user, office: 1 };
};

const officeFilterSqlForRegistered = (user) =>
  filterByUserOffice(normalizeIndicatorUserScope(user), "AND", "r.zone_id", "d.LgaCode");

const officeFilterSqlForApplications = (user) =>
  filterByUserOffice(normalizeIndicatorUserScope(user), "AND", "r.zone_id", "d.LgaCode");

const getIndicatorScopeLabel = (user = {}) => {
  const normalized = normalizeIndicatorUserScope(user);
  const office = Number(normalized?.office || 1);

  if (office === 3) return "kwenye halmashauri yako";
  if (office === 2) return "kwenye kanda yako";
  return "nchi nzima";
};

const detectIntent = (message) => {
  const value = safeTrim(message);
  if (!value) return null;
  if (SIMPLE_GREETING_PATTERN.test(value)) return "simple_greeting";
  if (REGISTERED_SCHOOLS_BY_OWNERSHIP_PATTERN.test(value)) return "registered_schools_by_ownership";
  if (APPROVED_APPLICATIONS_BY_CATEGORY_PATTERN.test(value)) return "approved_applications_by_category";
  if (APPROVED_APPLICATIONS_PATTERN.test(value)) return "approved_applications_count";
  if (TOP_APPROVED_DISTRICTS_PATTERN.test(value)) return "top_approved_districts";
  if (TOP_APPROVED_REGIONS_PATTERN.test(value)) return "top_approved_regions";
  if (REJECTED_APPLICATIONS_BY_CATEGORY_PATTERN.test(value)) return "rejected_applications_by_category";
  if (REJECTED_APPLICATIONS_PATTERN.test(value)) return "rejected_applications_count";
  if (PENDING_APPLICATIONS_BY_CATEGORY_PATTERN.test(value)) return "pending_applications_by_category";
  if (PENDING_APPLICATIONS_PATTERN.test(value)) return "pending_applications_count";
  if (TOP_PENDING_DISTRICTS_PATTERN.test(value)) return "top_pending_districts";
  if (TOP_PENDING_REGIONS_PATTERN.test(value)) return "top_pending_regions";
  if (APPLICATIONS_BY_CATEGORY_PATTERN.test(value)) return "applications_by_category";
  if (TOP_ENGLISH_MEDIUM_REGIONS_PATTERN.test(value)) return "top_english_medium_regions";
  if (TOP_SWAHILI_MEDIUM_REGIONS_PATTERN.test(value)) return "top_swahili_medium_regions";
  if (CURRICULUM_MOST_USED_PATTERN.test(value)) return "curriculum_most_used";
  if (TOP_CURRICULUM_REGIONS_PATTERN.test(value)) return "top_curriculum_regions";
  if (REGISTERED_SCHOOLS_BY_CURRICULUM_PATTERN.test(value)) return "registered_schools_by_curriculum";
  if (CERTIFICATE_TYPE_MOST_USED_PATTERN.test(value)) return "certificate_type_most_used";
  if (TOP_CERTIFICATE_TYPE_REGIONS_PATTERN.test(value)) return "top_certificate_type_regions";
  if (REGISTERED_SCHOOLS_BY_CERTIFICATE_TYPE_PATTERN.test(value)) return "registered_schools_by_certificate_type";
  if (TOP_SPECIALIZATION_DISTRICTS_PATTERN.test(value)) return "top_specialization_districts";
  if (TOP_SPECIALIZATION_REGIONS_PATTERN.test(value)) return "top_specialization_regions";
  if (REGISTERED_SCHOOLS_BY_SPECIALIZATION_PATTERN.test(value)) return "registered_schools_by_specialization";
  if (REGISTRATION_GROWTH_BY_DISTRICT_PATTERN.test(value)) return "registration_growth_by_district";
  if (REGISTRATION_GROWTH_BY_REGION_PATTERN.test(value)) return "registration_growth_by_region";
  if (REGISTERED_SCHOOLS_BY_REGION_PATTERN.test(value)) return "registered_schools_by_region";
  if (REGISTERED_SCHOOLS_BY_DISTRICT_PATTERN.test(value)) return "registered_schools_by_district";
  if (REGISTERED_SCHOOLS_BY_TYPE_PATTERN.test(value)) return "registered_schools_by_type";
  if (REGISTERED_SCHOOLS_BY_LANGUAGE_PATTERN.test(value)) return "registered_schools_by_language";
  if (DEREGISTERED_SCHOOLS_PATTERN.test(value)) return "deregistered_schools_count";
  if (APPLICATIONS_BY_PERIOD_PATTERN.test(value)) return "applications_by_period";
  if (OVERDUE_APPLICATIONS_PATTERN.test(value)) return "overdue_applications";
  if (REGISTERED_SCHOOLS_COUNT_PATTERN.test(value)) return "registered_schools_count";
  return null;
};

const formatCount = (value) => new Intl.NumberFormat("en-US").format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return safeTrim(value) || "-";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const normalizeToLocalDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const countBusinessDaysBetween = (startValue, endValue) => {
  const startDate = normalizeToLocalDate(startValue);
  const endDate = normalizeToLocalDate(endValue);
  if (!startDate || !endDate || endDate <= startDate) return 0;

  const cursor = new Date(startDate);
  cursor.setDate(cursor.getDate() + 1);

  let businessDays = 0;
  while (cursor <= endDate) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      businessDays += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return businessDays;
};

const getOverdueStatusLine = (referenceDate, overdueDays) => {
  const parsedOverdueDays = Number.parseInt(overdueDays, 10);
  if (!referenceDate || !Number.isFinite(parsedOverdueDays) || parsedOverdueDays <= 0) {
    return "";
  }

  const startDate = new Date(referenceDate);
  if (Number.isNaN(startDate.getTime())) return "";

  const now = new Date();
  const elapsedMs = now.getTime() - startDate.getTime();
  if (elapsedMs < 0) return "";

  const elapsedDays = countBusinessDaysBetween(startDate, now);
  if (elapsedDays > parsedOverdueDays) {
    return `Ombi limekaa siku ${formatCount(elapsedDays)} za kazi wakati muda wa hatua hii ni siku ${formatCount(parsedOverdueDays)} za kazi (overdue).`;
  }

  return `Ombi limekaa siku ${formatCount(elapsedDays)} za kazi kati ya siku ${formatCount(parsedOverdueDays)} za kazi zinazokubalika.`;
};

const getCurrentOfficerDurationLine = (referenceDate) => {
  if (!referenceDate) return "";

  const elapsedDays = countBusinessDaysBetween(referenceDate, new Date());
  return `Kwa officer wa sasa limekaa siku ${formatCount(elapsedDays)} za kazi tangu apokee.`;
};

const getOverdueApplicationsReply = async (user) => {
  const rows = await db.query(
    `
    SELECT
      ap.id AS application_process_id,
      ap.tracking_number,
      ap.status AS process_status,
      ap.started_at,
      ap.acted_at,
      ap.assigned_to,
      a.application_category_id,
      a.is_approved,
      a.created_at AS applicant_created_at,
      ac.app_name AS application_category_name,
      e.school_name,
      d.LgaName AS district_name,
      r.RegionName AS region_name,
      z.zone_name,
      assigned_role.name AS assigned_role_name,
      workflow_role.rank_name AS workflow_unit_name,
      workflow_role.overdue AS workflow_overdue_days
    FROM application_processes ap
    INNER JOIN (
      SELECT tracking_number, MAX(id) AS latest_process_id
      FROM application_processes
      WHERE LOWER(TRIM(COALESCE(status, ''))) IN ('pending', 'in-progress')
      GROUP BY tracking_number
    ) latest ON latest.latest_process_id = ap.id
    INNER JOIN applications a ON a.tracking_number = ap.tracking_number
    LEFT JOIN application_categories ac ON ac.id = a.application_category_id
    LEFT JOIN establishing_schools e
      ON e.id = a.establishing_school_id
      OR e.tracking_number = a.tracking_number
    LEFT JOIN streets st ON st.StreetCode = e.village_id
    LEFT JOIN wards w ON w.WardCode = COALESCE(e.ward_id, st.WardCode)
    LEFT JOIN districts d ON d.LgaCode = w.LgaCode
    LEFT JOIN regions r ON r.RegionCode = d.RegionCode
    LEFT JOIN zones z ON z.id = r.zone_id
    LEFT JOIN staffs assigned_staff ON assigned_staff.id = ap.assigned_to
    LEFT JOIN roles assigned_role ON assigned_role.id = assigned_staff.user_level
    LEFT JOIN work_flow wf ON wf.id = ap.work_flow_id
    LEFT JOIN vyeo workflow_role ON workflow_role.id = wf.unit_id
    WHERE 1 = 1
      ${officeFilterSqlForApplications(user)}
    ORDER BY ap.started_at ASC, ap.id ASC
    `,
    { type: QueryTypes.SELECT },
  );

  const overdueRows = [];
  for (const row of rows) {
    const overdueDays = Number.parseInt(row?.workflow_overdue_days, 10);
    const startedAt = row?.started_at || row?.applicant_created_at;
    if (!startedAt || !Number.isFinite(overdueDays) || overdueDays <= 0) continue;

    const businessDays = countBusinessDaysBetween(startedAt, new Date());
    if (businessDays <= overdueDays) continue;

    const handledBy = await formatWorkflowUnitDisplay(
      safeTrim(row?.assigned_role_name) || safeTrim(row?.workflow_unit_name),
      row,
    );

    overdueRows.push({
      tracking_number: safeTrim(row?.tracking_number) || "-",
      application_type: safeTrim(row?.application_category_name) || "-",
      school_name: safeTrim(row?.school_name) || "-",
      handled_by: handledBy || "-",
      processing_date: formatDateTime(row?.started_at),
      business_days: businessDays,
      sla_days: overdueDays,
      delay_days: Math.max(0, businessDays - overdueDays),
    });
  }

  const scopeLabel = getIndicatorScopeLabel(user);
  if (!overdueRows.length) {
    return {
      reply: `Hakuna maombi overdue yaliyopatikana ${scopeLabel}.`,
      context_used: {
        fast_path: "overdue_applications",
        total: 0,
        scope: scopeLabel,
      },
      summary_list: [],
    };
  }

  return {
    reply: `Kwa sasa kuna maombi ${formatCount(overdueRows.length)} overdue ${scopeLabel}.`,
    context_used: {
      fast_path: "overdue_applications",
      total: overdueRows.length,
      scope: scopeLabel,
    },
    summary_list: [{
      title: "Fungua Track Ombi",
      body: "",
      href: `/TrackOmbi?filter=overdue`,
      action_label: "Fungua Track Ombi",
    }],
  };
};

const getApplicationStatusLabel = (value) => {
  const status = Number(value);
  if (status === 0) return "Limewasilishwa";
  if (status === 1) return "Linachakatwa";
  if (status === 2) return "Limeidhinishwa";
  if (status === 3) return "Limekataliwa";
  return "Haijulikani";
};

const getProcessStatusLabel = (value) => {
  const normalized = safeTrim(value).toLowerCase();
  if (!normalized) return "Pending";
  if (normalized === "pending") return "Pending";
  if (normalized === "completed") return "Completed";
  if (normalized === "returned") return "Returned";
  return safeTrim(value);
};

const getZoneNameByCode = async (zoneCode) => {
  const normalizedZoneCode = safeTrim(zoneCode).toUpperCase();
  if (!normalizedZoneCode) return "";

  const rows = await db.query(
    `
      SELECT zone_name
      FROM zones
      WHERE UPPER(TRIM(zone_code)) = :zoneCode
      LIMIT 1
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { zoneCode: normalizedZoneCode },
    },
  );

  return safeTrim(rows?.[0]?.zone_name);
};

const looksLikeWorkflowUnitCode = (value) => {
  const normalizedValue = safeTrim(value).toUpperCase();
  if (!normalizedValue) return false;
  if (/^(W|KW)\d+$/i.test(normalizedValue)) return true;
  if (/^K\d+$/i.test(normalizedValue)) return true;
  return ["ADSA", "MUS", "DLSU", "DSNE", "HLSU", "KE", "REGISTRY", "MASJALA"].includes(normalizedValue);
};

const formatWorkflowUnitDisplay = async (unitCode, application = {}) => {
  const normalizedCode = safeTrim(unitCode).toUpperCase();
  if (!normalizedCode) return "";

  if (/^W\d+$/i.test(normalizedCode) || /^KW\d+$/i.test(normalizedCode)) {
    const districtName = safeTrim(application?.district_name);
    return districtName ? `${normalizedCode} (${districtName})` : normalizedCode;
  }

  if (/^K\d+$/i.test(normalizedCode)) {
    const zoneName = safeTrim(application?.zone_name) || (await getZoneNameByCode(normalizedCode));
    return zoneName ? `${normalizedCode} (${zoneName})` : normalizedCode;
  }

  if (!looksLikeWorkflowUnitCode(normalizedCode)) {
    return safeTrim(unitCode);
  }

  return `${normalizedCode} (HQ)`;
};

const getTrackingNumberReply = async (trackingNumber) => {
  const normalizedTracking = safeTrim(trackingNumber).toUpperCase();
  if (!normalizedTracking) return null;

  const rows = await db.query(
    `
      SELECT
        a.id,
        a.tracking_number,
        a.application_category_id,
        ac.app_name AS application_category_name,
        a.is_approved,
        a.is_complete,
        a.created_at,
        a.updated_at,
        a.staff_id,
        app_user.name AS applicant_name,
        e.school_name,
        assigned_role.name AS application_staff_role_name,
        d.LgaName AS district_name,
        r.RegionName AS region_name,
        z.zone_name,
        z.zone_code
      FROM applications a
      LEFT JOIN application_categories ac ON ac.id = a.application_category_id
      LEFT JOIN users app_user ON app_user.id = a.user_id
      LEFT JOIN establishing_schools e
        ON e.id = a.establishing_school_id
        OR e.tracking_number = a.tracking_number
      LEFT JOIN staffs assigned_staff ON assigned_staff.id = a.staff_id
      LEFT JOIN roles assigned_role ON assigned_role.id = assigned_staff.user_level
      LEFT JOIN streets st ON st.StreetCode = e.village_id
      LEFT JOIN wards w ON w.WardCode = COALESCE(e.ward_id, st.WardCode)
      LEFT JOIN districts d ON d.LgaCode = w.LgaCode
      LEFT JOIN regions r ON r.RegionCode = d.RegionCode
      LEFT JOIN zones z ON z.id = r.zone_id
      WHERE a.tracking_number = :trackingNumber
      LIMIT 1
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { trackingNumber: normalizedTracking },
    },
  );

  const application = rows?.[0] || null;
  if (!application) {
    return {
      reply: `Sijapata ombi lenye namba ${normalizedTracking} kwenye mfumo.`,
      context_used: {
        fast_path: "tracking_number_lookup",
        tracking_number: normalizedTracking,
        found: false,
      },
    };
  }

  const currentProcess = await ApplicationAPIService.fetchCurrentProcess(normalizedTracking);
  let assignedProcessStaff = null;

  if (Number(currentProcess?.assigned_to || 0) > 0) {
    const staffRows = await db.query(
      `
        SELECT s.id, role.name AS role_name
        FROM staffs s
        LEFT JOIN roles role ON role.id = s.user_level
        WHERE s.id = :staffId
        LIMIT 1
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { staffId: Number(currentProcess.assigned_to) },
      },
    );
    assignedProcessStaff = staffRows?.[0] || null;
  }

  const assignedRoleDisplay = await formatWorkflowUnitDisplay(
    safeTrim(assignedProcessStaff?.role_name) || safeTrim(application.application_staff_role_name),
    application,
  );
  const workflowUnitDisplay = await formatWorkflowUnitDisplay(currentProcess?.current_workflow_unit?.name, application);
  const assignedRoleLooksLikeUnit = looksLikeWorkflowUnitCode(
    safeTrim(assignedProcessStaff?.role_name) || safeTrim(application.application_staff_role_name),
  );

  const handledBy =
    assignedRoleDisplay ||
    workflowUnitDisplay ||
    safeTrim(currentProcess?.current_workflow_unit?.name) ||
    "Hakijapangiwa officer maalum bado";

  const handledByLabel = `Lipo kwa: ${handledBy}`;
  const overdueStatusLine = getOverdueStatusLine(
    currentProcess?.started_at || application.created_at,
    currentProcess?.current_workflow_unit?.overdue,
  );
  const currentOfficerDurationLine = getCurrentOfficerDurationLine(currentProcess?.acted_at);

  const replyLines = [
    `Namba ya Ombi: ${normalizedTracking}`,
    `Aina ya ombi: ${safeTrim(application.application_category_name) || "-"}`,
    `Hali ya sasa: ${getApplicationStatusLabel(application.is_approved)}`,
    `Hali: ${getProcessStatusLabel(currentProcess?.status)}`,
    `Mwombaji: ${safeTrim(application.applicant_name) || "-"}`,
    `Shule husika: ${safeTrim(application.school_name) || "-"}`,
    `Tarehe ya mwombaji: ${formatDateTime(application.created_at)}`,
    `Tarehe ya kuingia kuchakatwa: ${formatDateTime(currentProcess?.started_at)}`,
    handledByLabel,
    overdueStatusLine,
    currentOfficerDurationLine,
  ];

  return {
    reply: replyLines.filter(Boolean).join("\n"),
    context_used: {
      fast_path: "tracking_number_lookup",
      tracking_number: normalizedTracking,
      application_id: application.id,
      work_flow_id: currentProcess?.work_flow_id || null,
      assigned_to: currentProcess?.assigned_to || application.staff_id || null,
    },
  };
};

const getRegisteredSchoolsCountReply = async (user) => {
  const rows = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM establishing_schools e
      JOIN school_registrations sr ON sr.establishing_school_id = e.id
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE sr.reg_status = 1
        AND sr.deleted_at IS NULL
        ${officeFilterSqlForRegistered(user)}
    `,
    { type: QueryTypes.SELECT },
  );

  const total = Number(rows?.[0]?.total || 0);
  const scopeLabel = getIndicatorScopeLabel(user);
  return {
    reply: `Kwa sasa kuna shule ${formatCount(total)} zilizosajiliwa ${scopeLabel}.`,
    context_used: {
      fast_path: "registered_schools_count",
      total,
      reg_status: 1,
      scope: scopeLabel,
    },
  };
};

const getPendingApplicationsCountReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        COUNT(DISTINCT a.id) AS total,
        COUNT(DISTINCT CASE WHEN a.is_approved = 0 THEN a.id END) AS submitted_total,
        COUNT(DISTINCT CASE WHEN a.is_approved = 1 THEN a.id END) AS in_progress_total
      FROM applications a
      LEFT JOIN establishing_schools e
        ON e.id = a.establishing_school_id
        OR e.tracking_number = a.tracking_number
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE a.is_approved IN (0, 1)
        ${officeFilterSqlForApplications(user)}
    `,
    { type: QueryTypes.SELECT },
  );

  const total = Number(rows?.[0]?.total || 0);
  const submittedTotal = Number(rows?.[0]?.submitted_total || 0);
  const inProgressTotal = Number(rows?.[0]?.in_progress_total || 0);
  return {
    reply:
      `Kwa sasa kuna maombi ${formatCount(total)} yanayosubiri kushughulikiwa ${scopeLabel}.\n` +
      `Kati ya hayo, ${formatCount(submittedTotal)} yameingia na ${formatCount(inProgressTotal)} yanachakatwa.`,
    context_used: {
      fast_path: "pending_applications_count",
      total,
      submitted_total: submittedTotal,
      in_progress_total: inProgressTotal,
      is_approved: [0, 1],
      scope: scopeLabel,
    },
  };
};

const getPendingApplicationsByCategoryReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const [rows, categoryRows] = await Promise.all([
    db.query(
      `
        SELECT
          COUNT(DISTINCT a.id) AS total,
          COUNT(DISTINCT CASE WHEN a.is_approved = 0 THEN a.id END) AS submitted_total,
          COUNT(DISTINCT CASE WHEN a.is_approved = 1 THEN a.id END) AS in_progress_total
        FROM applications a
        LEFT JOIN establishing_schools e
          ON e.id = a.establishing_school_id
          OR e.tracking_number = a.tracking_number
        ${REGISTERED_LOCATION_JOINS_SQL}
        WHERE a.is_approved IN (0, 1)
          ${officeFilterSqlForApplications(user)}
      `,
      { type: QueryTypes.SELECT },
    ),
    db.query(
      `
        SELECT
          ac.app_name AS category,
          COUNT(DISTINCT a.id) AS total
        FROM application_categories ac
        INNER JOIN applications a ON a.application_category_id = ac.id
        LEFT JOIN establishing_schools e
          ON e.id = a.establishing_school_id
          OR e.tracking_number = a.tracking_number
        ${REGISTERED_LOCATION_JOINS_SQL}
        WHERE a.is_approved IN (0, 1)
          ${officeFilterSqlForApplications(user)}
        GROUP BY ac.id, ac.app_name
        ORDER BY total DESC, ac.app_name ASC
      `,
      { type: QueryTypes.SELECT },
    ),
  ]);

  const total = Number(rows?.[0]?.total || 0);
  const submittedTotal = Number(rows?.[0]?.submitted_total || 0);
  const inProgressTotal = Number(rows?.[0]?.in_progress_total || 0);
  const categoryLines = categoryRows
    .map((row) => `${safeTrim(row.category)}: ${formatCount(row.total)}`)
    .slice(0, 10);
  const categorySuffix =
    categoryRows.length > categoryLines.length
      ? `\nNa category nyingine ${formatCount(categoryRows.length - categoryLines.length)} zaidi.`
      : "";

  return {
    reply:
      `Kwa sasa kuna maombi ${formatCount(total)} yanayosubiri kushughulikiwa ${scopeLabel}.\n` +
      `Kati ya hayo, ${formatCount(submittedTotal)} yameingia na ${formatCount(inProgressTotal)} yanachakatwa.\n` +
      `Mgawanyo kwa aina ya maombi ni:\n${categoryLines.join("\n")}${categorySuffix}`,
    context_used: {
      fast_path: "pending_applications_by_category",
      total,
      submitted_total: submittedTotal,
      in_progress_total: inProgressTotal,
      categories: categoryRows,
      is_approved: [0, 1],
      scope: scopeLabel,
    },
  };
};

const getApprovedApplicationsCountReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT COUNT(DISTINCT a.id) AS total
      FROM applications a
      LEFT JOIN establishing_schools e
        ON e.id = a.establishing_school_id
        OR e.tracking_number = a.tracking_number
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE a.is_approved = 2
        ${officeFilterSqlForApplications(user)}
    `,
    { type: QueryTypes.SELECT },
  );

  const total = Number(rows?.[0]?.total || 0);
  return {
    reply: `Kwa sasa kuna maombi ${formatCount(total)} yaliyothibitishwa ${scopeLabel}.`,
    context_used: {
      fast_path: "approved_applications_count",
      total,
      is_approved: 2,
      scope: scopeLabel,
    },
  };
};

const getApprovedApplicationsByCategoryReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const [rows, categoryRows] = await Promise.all([
    db.query(
      `
        SELECT COUNT(DISTINCT a.id) AS total
        FROM applications a
        LEFT JOIN establishing_schools e
          ON e.id = a.establishing_school_id
          OR e.tracking_number = a.tracking_number
        ${REGISTERED_LOCATION_JOINS_SQL}
        WHERE a.is_approved = 2
          ${officeFilterSqlForApplications(user)}
      `,
      { type: QueryTypes.SELECT },
    ),
    db.query(
      `
        SELECT
          ac.app_name AS category,
          COUNT(DISTINCT a.id) AS total
        FROM application_categories ac
        INNER JOIN applications a ON a.application_category_id = ac.id
        LEFT JOIN establishing_schools e
          ON e.id = a.establishing_school_id
          OR e.tracking_number = a.tracking_number
        ${REGISTERED_LOCATION_JOINS_SQL}
        WHERE a.is_approved = 2
          ${officeFilterSqlForApplications(user)}
        GROUP BY ac.id, ac.app_name
        ORDER BY total DESC, ac.app_name ASC
      `,
      { type: QueryTypes.SELECT },
    ),
  ]);

  const total = Number(rows?.[0]?.total || 0);
  const categoryLines = categoryRows
    .map((row) => `${safeTrim(row.category)}: ${formatCount(row.total)}`)
    .slice(0, 10);
  const categorySuffix =
    categoryRows.length > categoryLines.length
      ? `\nNa aina nyingine ${formatCount(categoryRows.length - categoryLines.length)} zaidi.`
      : "";

  return {
    reply:
      `Kwa sasa kuna maombi ${formatCount(total)} yaliyothibitishwa ${scopeLabel}.\n` +
      `Mgawanyo kwa aina ya maombi ni:\n${categoryLines.join("\n")}${categorySuffix}`,
    context_used: {
      fast_path: "approved_applications_by_category",
      total,
      categories: categoryRows,
      is_approved: 2,
      scope: scopeLabel,
    },
  };
};

const getRejectedApplicationsCountReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT COUNT(DISTINCT a.id) AS total
      FROM applications a
      LEFT JOIN establishing_schools e
        ON e.id = a.establishing_school_id
        OR e.tracking_number = a.tracking_number
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE a.is_approved = 3
        ${officeFilterSqlForApplications(user)}
    `,
    { type: QueryTypes.SELECT },
  );

  const total = Number(rows?.[0]?.total || 0);
  return {
    reply: `Kwa sasa kuna maombi ${formatCount(total)} yaliyokataliwa ${scopeLabel}.`,
    context_used: {
      fast_path: "rejected_applications_count",
      total,
      is_approved: 3,
      scope: scopeLabel,
    },
  };
};

const getRejectedApplicationsByCategoryReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const [rows, categoryRows] = await Promise.all([
    db.query(
      `
        SELECT COUNT(DISTINCT a.id) AS total
        FROM applications a
        LEFT JOIN establishing_schools e
          ON e.id = a.establishing_school_id
          OR e.tracking_number = a.tracking_number
        ${REGISTERED_LOCATION_JOINS_SQL}
        WHERE a.is_approved = 3
          ${officeFilterSqlForApplications(user)}
      `,
      { type: QueryTypes.SELECT },
    ),
    db.query(
      `
        SELECT
          ac.app_name AS category,
          COUNT(DISTINCT a.id) AS total
        FROM application_categories ac
        INNER JOIN applications a ON a.application_category_id = ac.id
        LEFT JOIN establishing_schools e
          ON e.id = a.establishing_school_id
          OR e.tracking_number = a.tracking_number
        ${REGISTERED_LOCATION_JOINS_SQL}
        WHERE a.is_approved = 3
          ${officeFilterSqlForApplications(user)}
        GROUP BY ac.id, ac.app_name
        ORDER BY total DESC, ac.app_name ASC
      `,
      { type: QueryTypes.SELECT },
    ),
  ]);

  const total = Number(rows?.[0]?.total || 0);
  const lines = categoryRows.slice(0, 10).map((row) => `${safeTrim(row.category)}: ${formatCount(row.total)}`);
  const suffix =
    categoryRows.length > lines.length
      ? `\nNa aina nyingine ${formatCount(categoryRows.length - lines.length)} zaidi.`
      : "";

  return {
    reply:
      `Kwa sasa kuna maombi ${formatCount(total)} yaliyokataliwa ${scopeLabel}.\n` +
      `Mgawanyo kwa aina ya maombi ni:\n${lines.join("\n")}${suffix}`,
    context_used: {
      fast_path: "rejected_applications_by_category",
      total,
      categories: categoryRows,
      is_approved: 3,
      scope: scopeLabel,
    },
  };
};

const getApplicationsByCategoryReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        ac.app_name AS category,
        COUNT(DISTINCT a.id) AS total
      FROM application_categories ac
      INNER JOIN applications a ON a.application_category_id = ac.id
      LEFT JOIN establishing_schools e
        ON e.id = a.establishing_school_id
        OR e.tracking_number = a.tracking_number
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE 1 = 1
        ${officeFilterSqlForApplications(user)}
      GROUP BY ac.id, ac.app_name
      ORDER BY total DESC, ac.app_name ASC
    `,
    { type: QueryTypes.SELECT },
  );

  const total = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const lines = rows.slice(0, 10).map((row) => `${safeTrim(row.category)}: ${formatCount(row.total)}`);
  const suffix =
    rows.length > lines.length
      ? `\nNa aina nyingine ${formatCount(rows.length - lines.length)} zaidi.`
      : "";

  return {
    reply:
      `Kwa sasa kuna maombi ${formatCount(total)} ${scopeLabel}.\n` +
      `Mgawanyo kwa aina ya maombi ni:\n${lines.join("\n")}${suffix}`,
    context_used: {
      fast_path: "applications_by_category",
      total,
      categories: rows,
      scope: scopeLabel,
    },
  };
};

const getRegisteredSchoolsByTypeReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        CASE
          WHEN e.school_category_id = 1 THEN 'Awali'
          WHEN e.school_category_id = 2 THEN 'Msingi'
          WHEN e.school_category_id = 3 THEN 'Sekondari'
          WHEN e.school_category_id = 4 THEN 'Vyuo vya Ualimu'
          ELSE COALESCE(NULLIF(TRIM(sc.category), ''), CONCAT('Aina ', e.school_category_id))
        END AS school_type,
        COUNT(*) AS total
      FROM establishing_schools e
      JOIN school_registrations sr ON sr.establishing_school_id = e.id
      LEFT JOIN school_categories sc ON sc.id = e.school_category_id
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE sr.reg_status = 1
        AND sr.deleted_at IS NULL
        ${officeFilterSqlForRegistered(user)}
      GROUP BY e.school_category_id, school_type
      ORDER BY total DESC, school_type ASC
    `,
    { type: QueryTypes.SELECT },
  );

  const lines = rows.map((row) => `${safeTrim(row.school_type)}: ${formatCount(row.total)}`);
  return {
    reply: `Idadi ya shule zilizosajiliwa kwa aina ya shule ${scopeLabel} ni:\n${lines.join("\n")}`,
    context_used: {
      fast_path: "registered_schools_by_type",
      categories: rows,
      reg_status: 1,
      scope: scopeLabel,
    },
  };
};

const getRegisteredSchoolsByLanguageReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        COALESCE(NULLIF(TRIM(l.language), ''), 'Unknown') AS language,
        COUNT(*) AS total
      FROM establishing_schools e
      JOIN school_registrations sr ON sr.establishing_school_id = e.id
      LEFT JOIN languages l ON l.id = e.language_id
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE sr.reg_status = 1
        AND sr.deleted_at IS NULL
        ${officeFilterSqlForRegistered(user)}
      GROUP BY language
      ORDER BY total DESC, language ASC
    `,
    { type: QueryTypes.SELECT },
  );

  return {
    reply: `Idadi ya shule kwa lugha ya kufundishia ${scopeLabel} ni:\n${rows.map((row) => `${safeTrim(row.language)}: ${formatCount(row.total)}`).join("\n")}`,
    context_used: {
      fast_path: "registered_schools_by_language",
      rows,
      reg_status: 1,
      scope: scopeLabel,
    },
  };
};

const getTopRegionsByLanguageReply = async ({ user, languagePattern, label }) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        COALESCE(NULLIF(TRIM(r.RegionName), ''), 'Unknown') AS region,
        COUNT(*) AS total
      FROM establishing_schools e
      JOIN school_registrations sr ON sr.establishing_school_id = e.id
      LEFT JOIN languages l ON l.id = e.language_id
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE sr.reg_status = 1
        AND sr.deleted_at IS NULL
        AND LOWER(TRIM(COALESCE(l.language, ''))) REGEXP :languagePattern
        ${officeFilterSqlForRegistered(user)}
      GROUP BY region
      ORDER BY total DESC, region ASC
      LIMIT 10
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { languagePattern },
    },
  );

  return {
    reply: rows.length
      ? `Top mikoa yenye shule nyingi za ${label} ${scopeLabel} ni:\n${rows.map((row) => `${safeTrim(row.region)}: ${formatCount(row.total)}`).join("\n")}`
      : `Hakuna shule zilizosajiliwa zenye lugha ya ${label} zilizopatikana ${scopeLabel}.`,
    context_used: {
      fast_path: `top_regions_${label.toLowerCase().replace(/\s+/g, "_")}`,
      rows,
      reg_status: 1,
      language: label,
      scope: scopeLabel,
    },
  };
};

const getRegisteredSchoolsByDimensionReply = async ({
  user,
  joinSql,
  labelSql,
  groupSql,
  replyPrefix,
}) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        ${labelSql} AS label,
        COUNT(*) AS total
      FROM establishing_schools e
      JOIN school_registrations sr ON sr.establishing_school_id = e.id
      ${joinSql}
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE sr.reg_status = 1
        AND sr.deleted_at IS NULL
        ${officeFilterSqlForRegistered(user)}
      GROUP BY ${groupSql}
      ORDER BY total DESC, label ASC
    `,
    { type: QueryTypes.SELECT },
  );

  return {
    reply: rows.length
      ? `${replyPrefix}\n${rows.map((row) => `${safeTrim(row.label)}: ${formatCount(row.total)}`).join("\n")}`
      : `Hakuna data iliyopatikana ${scopeLabel} kwa kiashiria hicho kwenye rekodi za sasa.`,
    context_used: {
      rows,
      reg_status: 1,
      scope: scopeLabel,
    },
  };
};

const getTopRegionsByDimensionReply = async ({
  user,
  joinSql,
  filterSql,
  replacements = {},
  label,
}) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        COALESCE(NULLIF(TRIM(r.RegionName), ''), 'Unknown') AS region,
        COUNT(*) AS total
      FROM establishing_schools e
      JOIN school_registrations sr ON sr.establishing_school_id = e.id
      ${joinSql}
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE sr.reg_status = 1
        AND sr.deleted_at IS NULL
        AND ${filterSql}
        ${officeFilterSqlForRegistered(user)}
      GROUP BY region
      ORDER BY total DESC, region ASC
      LIMIT 10
    `,
    { type: QueryTypes.SELECT, replacements },
  );

  return {
    reply: rows.length
      ? `Top mikoa yenye shule nyingi za ${label} ${scopeLabel} ni:\n${rows.map((row) => `${safeTrim(row.region)}: ${formatCount(row.total)}`).join("\n")}`
      : `Hakuna shule zilizosajiliwa zenye ${label} zilizopatikana ${scopeLabel}.`,
    context_used: {
      rows,
      reg_status: 1,
      label,
      scope: scopeLabel,
    },
  };
};

const getTopDistrictsByDimensionReply = async ({
  user,
  joinSql,
  filterSql,
  replacements = {},
  label,
}) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        COALESCE(NULLIF(TRIM(d.LgaName), ''), 'Unknown') AS district,
        COUNT(*) AS total
      FROM establishing_schools e
      JOIN school_registrations sr ON sr.establishing_school_id = e.id
      ${joinSql}
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE sr.reg_status = 1
        AND sr.deleted_at IS NULL
        AND ${filterSql}
        ${officeFilterSqlForRegistered(user)}
      GROUP BY district
      ORDER BY total DESC, district ASC
      LIMIT 10
    `,
    { type: QueryTypes.SELECT, replacements },
  );

  return {
    reply: rows.length
      ? `Top wilaya zenye shule nyingi za ${label} ${scopeLabel} ni:\n${rows.map((row) => `${safeTrim(row.district)}: ${formatCount(row.total)}`).join("\n")}`
      : `Hakuna shule zilizosajiliwa zenye ${label} zilizopatikana ${scopeLabel}.`,
    context_used: {
      rows,
      reg_status: 1,
      label,
      scope: scopeLabel,
    },
  };
};

const getTopPendingRegionsReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        COALESCE(NULLIF(TRIM(r.RegionName), ''), 'Unknown') AS region,
        COUNT(DISTINCT a.id) AS total
      FROM applications a
      LEFT JOIN establishing_schools e
        ON e.id = a.establishing_school_id
        OR e.tracking_number = a.tracking_number
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE a.is_approved IN (0, 1)
        ${officeFilterSqlForApplications(user)}
      GROUP BY region
      ORDER BY total DESC, region ASC
      LIMIT 10
    `,
    { type: QueryTypes.SELECT },
  );

  return {
    reply: rows.length
      ? `Top mikoa yenye pending nyingi ${scopeLabel} ni:\n${rows.map((row) => `${safeTrim(row.region)}: ${formatCount(row.total)}`).join("\n")}`
      : `Hakuna maombi yanayosubiri yaliyopatikana ${scopeLabel}.`,
    context_used: {
      fast_path: "top_pending_regions",
      rows,
      is_approved: [0, 1],
      scope: scopeLabel,
    },
  };
};

const getTopPendingDistrictsReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        COALESCE(NULLIF(TRIM(d.LgaName), ''), 'Unknown') AS district,
        COUNT(DISTINCT a.id) AS total
      FROM applications a
      LEFT JOIN establishing_schools e
        ON e.id = a.establishing_school_id
        OR e.tracking_number = a.tracking_number
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE a.is_approved IN (0, 1)
        ${officeFilterSqlForApplications(user)}
      GROUP BY district
      ORDER BY total DESC, district ASC
      LIMIT 10
    `,
    { type: QueryTypes.SELECT },
  );

  return {
    reply: rows.length
      ? `Top wilaya zenye pending nyingi ${scopeLabel} ni:\n${rows.map((row) => `${safeTrim(row.district)}: ${formatCount(row.total)}`).join("\n")}`
      : `Hakuna maombi yanayosubiri yaliyopatikana ${scopeLabel}.`,
    context_used: {
      fast_path: "top_pending_districts",
      rows,
      is_approved: [0, 1],
      scope: scopeLabel,
    },
  };
};

const getTopApprovedRegionsReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        COALESCE(NULLIF(TRIM(r.RegionName), ''), 'Unknown') AS region,
        COUNT(DISTINCT a.id) AS total
      FROM applications a
      LEFT JOIN establishing_schools e
        ON e.id = a.establishing_school_id
        OR e.tracking_number = a.tracking_number
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE a.is_approved = 2
        ${officeFilterSqlForApplications(user)}
      GROUP BY region
      ORDER BY total DESC, region ASC
      LIMIT 10
    `,
    { type: QueryTypes.SELECT },
  );

  return {
    reply: rows.length
      ? `Top mikoa yenye approvals nyingi ${scopeLabel} ni:\n${rows.map((row) => `${safeTrim(row.region)}: ${formatCount(row.total)}`).join("\n")}`
      : `Hakuna maombi yaliyothibitishwa yaliyopatikana ${scopeLabel}.`,
    context_used: {
      fast_path: "top_approved_regions",
      rows,
      is_approved: 2,
      scope: scopeLabel,
    },
  };
};

const getTopApprovedDistrictsReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        COALESCE(NULLIF(TRIM(d.LgaName), ''), 'Unknown') AS district,
        COUNT(DISTINCT a.id) AS total
      FROM applications a
      LEFT JOIN establishing_schools e
        ON e.id = a.establishing_school_id
        OR e.tracking_number = a.tracking_number
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE a.is_approved = 2
        ${officeFilterSqlForApplications(user)}
      GROUP BY district
      ORDER BY total DESC, district ASC
      LIMIT 10
    `,
    { type: QueryTypes.SELECT },
  );

  return {
    reply: rows.length
      ? `Top wilaya zenye approvals nyingi ${scopeLabel} ni:\n${rows.map((row) => `${safeTrim(row.district)}: ${formatCount(row.total)}`).join("\n")}`
      : `Hakuna maombi yaliyothibitishwa yaliyopatikana ${scopeLabel}.`,
    context_used: {
      fast_path: "top_approved_districts",
      rows,
      is_approved: 2,
      scope: scopeLabel,
    },
  };
};

const getRegisteredSchoolsByRegionReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        COALESCE(NULLIF(TRIM(r.RegionName), ''), 'Unknown') AS region,
        COUNT(*) AS total
      FROM establishing_schools e
      JOIN school_registrations sr ON sr.establishing_school_id = e.id
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE sr.reg_status = 1
        AND sr.deleted_at IS NULL
        ${officeFilterSqlForRegistered(user)}
      GROUP BY region
      ORDER BY total DESC, region ASC
    `,
    { type: QueryTypes.SELECT },
  );

  const parts = rows.map((row) => `${safeTrim(row.region)}: ${formatCount(row.total)}`);
  return {
    reply: `Idadi ya shule zilizosajiliwa kwa mkoa ${scopeLabel} ni:\n${parts.join("\n")}`,
    context_used: {
      fast_path: "registered_schools_by_region",
      rows_count: rows.length,
      scope: scopeLabel,
    },
  };
};

const getRegistrationGrowthByRegionReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        COALESCE(NULLIF(TRIM(r.RegionName), ''), 'Unknown') AS region,
        SUM(CASE WHEN YEAR(sr.created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS current_year_total,
        SUM(CASE WHEN YEAR(sr.created_at) = YEAR(CURDATE()) - 1 THEN 1 ELSE 0 END) AS previous_year_total
      FROM establishing_schools e
      JOIN school_registrations sr ON sr.establishing_school_id = e.id
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE sr.reg_status = 1
        AND sr.deleted_at IS NULL
        AND YEAR(sr.created_at) IN (YEAR(CURDATE()), YEAR(CURDATE()) - 1)
        ${officeFilterSqlForRegistered(user)}
      GROUP BY region
      HAVING current_year_total > 0 OR previous_year_total > 0
      ORDER BY (current_year_total - previous_year_total) DESC, current_year_total DESC, region ASC
      LIMIT 1
    `,
    { type: QueryTypes.SELECT },
  );

  const topRow = rows?.[0];
  if (!topRow) {
    return {
      reply: `Hakuna data ya usajili wa mwaka huu au mwaka uliopita iliyopatikana ${scopeLabel}.`,
      context_used: {
        fast_path: "registration_growth_by_region",
        scope: scopeLabel,
      },
    };
  }

  const region = safeTrim(topRow.region) || "Unknown";
  const currentYearTotal = Number(topRow.current_year_total || 0);
  const previousYearTotal = Number(topRow.previous_year_total || 0);
  const growth = currentYearTotal - previousYearTotal;
  const trendLabel = growth >= 0 ? "imeongezeka" : "imepungua";

  return {
    reply:
      `Mkoa wenye growth kubwa ya registrations mwaka huu ${scopeLabel} ni ${region}.\n` +
      `Mwaka huu una registrations ${formatCount(currentYearTotal)}, mwaka uliopita ulikuwa na ${formatCount(previousYearTotal)}, hivyo usajili ${trendLabel} kwa ${formatCount(Math.abs(growth))}.`,
    context_used: {
      fast_path: "registration_growth_by_region",
      region,
      current_year_total: currentYearTotal,
      previous_year_total: previousYearTotal,
      growth,
      scope: scopeLabel,
    },
  };
};

const getRegistrationGrowthByDistrictReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        COALESCE(NULLIF(TRIM(d.LgaName), ''), 'Unknown') AS district,
        SUM(CASE WHEN YEAR(sr.created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS current_year_total,
        SUM(CASE WHEN YEAR(sr.created_at) = YEAR(CURDATE()) - 1 THEN 1 ELSE 0 END) AS previous_year_total
      FROM establishing_schools e
      JOIN school_registrations sr ON sr.establishing_school_id = e.id
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE sr.reg_status = 1
        AND sr.deleted_at IS NULL
        AND YEAR(sr.created_at) IN (YEAR(CURDATE()), YEAR(CURDATE()) - 1)
        ${officeFilterSqlForRegistered(user)}
      GROUP BY district
      HAVING current_year_total > 0 OR previous_year_total > 0
      ORDER BY (current_year_total - previous_year_total) DESC, current_year_total DESC, district ASC
      LIMIT 1
    `,
    { type: QueryTypes.SELECT },
  );

  const topRow = rows?.[0];
  if (!topRow) {
    return {
      reply: `Hakuna data ya usajili wa mwaka huu au mwaka uliopita iliyopatikana ${scopeLabel}.`,
      context_used: {
        fast_path: "registration_growth_by_district",
        scope: scopeLabel,
      },
    };
  }

  const district = safeTrim(topRow.district) || "Unknown";
  const currentYearTotal = Number(topRow.current_year_total || 0);
  const previousYearTotal = Number(topRow.previous_year_total || 0);
  const growth = currentYearTotal - previousYearTotal;
  const trendLabel = growth >= 0 ? "imeongezeka" : "imepungua";

  return {
    reply:
      `Wilaya yenye growth kubwa ya registrations mwaka huu ${scopeLabel} ni ${district}.\n` +
      `Mwaka huu ina registrations ${formatCount(currentYearTotal)}, mwaka uliopita ilikuwa na ${formatCount(previousYearTotal)}, hivyo usajili ${trendLabel} kwa ${formatCount(Math.abs(growth))}.`,
    context_used: {
      fast_path: "registration_growth_by_district",
      district,
      current_year_total: currentYearTotal,
      previous_year_total: previousYearTotal,
      growth,
      scope: scopeLabel,
    },
  };
};

const getRegisteredSchoolsByDistrictReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT
        COALESCE(NULLIF(TRIM(d.LgaName), ''), 'Unknown') AS district,
        COUNT(*) AS total
      FROM establishing_schools e
      JOIN school_registrations sr ON sr.establishing_school_id = e.id
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE sr.reg_status = 1
        AND sr.deleted_at IS NULL
        ${officeFilterSqlForRegistered(user)}
      GROUP BY district
      ORDER BY total DESC, district ASC
    `,
    { type: QueryTypes.SELECT },
  );

  const topRows = rows.slice(0, 20);
  const parts = topRows.map((row) => `${safeTrim(row.district)}: ${formatCount(row.total)}`);
  const suffix =
    rows.length > topRows.length
      ? `\nNa wilaya nyingine ${formatCount(rows.length - topRows.length)} zaidi.`
      : "";

  return {
    reply: `Idadi ya shule zilizosajiliwa kwa wilaya ${scopeLabel} (top 20) ni:\n${parts.join("\n")}${suffix}`,
    context_used: {
      fast_path: "registered_schools_by_district",
      rows_count: rows.length,
      returned_rows: topRows.length,
      scope: scopeLabel,
    },
  };
};

const getDeregisteredSchoolsCountReply = async (user) => {
  const scopeLabel = getIndicatorScopeLabel(user);
  const rows = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM establishing_schools e
      JOIN school_registrations sr ON sr.establishing_school_id = e.id
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE sr.reg_status = 0
        ${officeFilterSqlForRegistered(user)}
    `,
    { type: QueryTypes.SELECT },
  );

  const total = Number(rows?.[0]?.total || 0);
  return {
    reply: `Kwa sasa kuna shule ${formatCount(total)} zilizofutiwa usajili ${scopeLabel}.`,
    context_used: {
      fast_path: "deregistered_schools_count",
      total,
      reg_status: 0,
      scope: scopeLabel,
    },
  };
};

const getApplicationsByPeriodReply = async (user) => {
  const rows = await db.query(
    `
      SELECT
        SUM(CASE WHEN DATE(a.created_at) = CURDATE() THEN 1 ELSE 0 END) AS today_total,
        SUM(CASE WHEN YEARWEEK(a.created_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 ELSE 0 END) AS week_total,
        SUM(CASE WHEN YEAR(a.created_at) = YEAR(CURDATE()) AND MONTH(a.created_at) = MONTH(CURDATE()) THEN 1 ELSE 0 END) AS month_total
      FROM applications a
      LEFT JOIN establishing_schools e ON e.id = a.establishing_school_id
      ${REGISTERED_LOCATION_JOINS_SQL}
      WHERE a.establishing_school_id IS NOT NULL
        ${officeFilterSqlForApplications(user)}
    `,
    { type: QueryTypes.SELECT },
  );

  const todayTotal = Number(rows?.[0]?.today_total || 0);
  const weekTotal = Number(rows?.[0]?.week_total || 0);
  const monthTotal = Number(rows?.[0]?.month_total || 0);
  const scopeLabel = getIndicatorScopeLabel(user);

  return {
    reply: `Maombi ${scopeLabel}: leo ni ${formatCount(todayTotal)}, wiki hii ni ${formatCount(weekTotal)}, na mwezi huu ni ${formatCount(monthTotal)}.`,
    context_used: {
      fast_path: "applications_by_period",
      today_total: todayTotal,
      week_total: weekTotal,
      month_total: monthTotal,
      scope: scopeLabel,
    },
  };
};

const getRegisteredSchoolsByOwnershipReply = async (user) => {
  const rows = await db.query(
    `
      SELECT
        CASE
          WHEN es.registry_type_id IN (1, 2) THEN 'Non Government'
          WHEN es.registry_type_id = 3 THEN 'Government'
          ELSE 'Unknown'
        END AS ownership,
        COUNT(*) AS total
      FROM school_registrations sr
      INNER JOIN establishing_schools es ON es.id = sr.establishing_school_id
      ${REGISTERED_LOCATION_JOINS_SQL.replaceAll("e.", "es.")}
      WHERE sr.reg_status = 1
        AND sr.deleted_at IS NULL
        ${officeFilterSqlForRegistered({ ...user, office: normalizeIndicatorUserScope(user).office }).replaceAll("e.", "es.")}
      GROUP BY
        CASE
          WHEN es.registry_type_id IN (1, 2) THEN 'Non Government'
          WHEN es.registry_type_id = 3 THEN 'Government'
          ELSE 'Unknown'
        END
      ORDER BY total DESC, ownership ASC
    `,
    { type: QueryTypes.SELECT },
  );

  const totals = rows.reduce((acc, row) => {
    acc[safeTrim(row.ownership) || "Unknown"] = Number(row.total || 0);
    return acc;
  }, {});

  const government = Number(totals.Government || 0);
  const nonGovernment = Number(totals["Non Government"] || 0);
  const unknown = Number(totals.Unknown || 0);
  const scopeLabel = getIndicatorScopeLabel(user);
  const parts = [
    `Government: ${formatCount(government)}`,
    `Non Government: ${formatCount(nonGovernment)}`,
  ];

  if (unknown > 0) {
    parts.push(`Unknown: ${formatCount(unknown)}`);
  }

  return {
    reply: `Idadi ya shule zilizosajiliwa kwa umiliki ${scopeLabel} ni ${parts.join(", ")}.`,
    context_used: {
      fast_path: "registered_schools_by_ownership",
      breakdown: totals,
      reg_status: 1,
      scope: scopeLabel,
    },
  };
};

const buildSystemPrompt = (context) => {
  const ctxJson = JSON.stringify(context || {}, null, 2);
  return `
Wewe ni msaidizi mahiri wa mfumo wa School Accreditation System (SAS).

Malengo:
- Jibu maswali ya watumiaji wa SAS (sas-admin) kwa Kiswahili, kwa ufupi na kwa vitendo.
- Tumia taarifa za "SYSTEM_CONTEXT" (chini) kuongoza majibu; usibuni data ambazo hazipo.
- Ukiulizwa "nifanye nini", toa hatua 3-7 za kufuata, na eleza sababu fupi.
- Ukiwa hujui, uliza swali la kufafanua (1-2 maswali tu), au eleza data gani inahitajika.

Mwongozo wa usalama:
- Usionyeshe taarifa nyeti (token, password, secure_token, n.k.). Kama ipo kwenye context, iwe imesha-redact.
- Usitoe env vars, config values, secrets, au mistari ya aina \`KEY=value\` kwenye jibu.

Output format (markdown):
1) Jibu
2) Hatua za kuchukua
3) Ikiwa inahitajika: Kitu cha kuangalia kwenye mfumo (menu/URL/permission)

SYSTEM_CONTEXT:
\`\`\`json
${ctxJson}
\`\`\`
  `.trim();
};

aiSupportRouter.post("/ai-support/chat", isAuth, permission("view-dashboard"), async (req, res) => {
  try {
    const messages = coerceMessages(req.body?.messages);
    if (!messages.length) {
      return res.send({
        error: true,
        statusCode: 422,
        message: "Tuma angalau ujumbe mmoja (messages).",
      });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const trackingNumbers = extractTrackingNumbers(lastUserMessage);
    if (trackingNumbers.length === 1) {
      const result = await getTrackingNumberReply(trackingNumbers[0]);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    const intent = detectIntent(lastUserMessage);
    if (intent === "simple_greeting") {
      const fastReply = getFastReply(lastUserMessage);
      return res.send({
        error: false,
        statusCode: 300,
        data: {
          reply: fastReply,
          context_used: {
            fast_path: "simple_greeting",
          },
        },
        message: "AI response",
      });
    }

    if (intent === "registered_schools_count") {
      const result = await getRegisteredSchoolsCountReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "registered_schools_by_ownership") {
      const result = await getRegisteredSchoolsByOwnershipReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "pending_applications_count") {
      const result = await getPendingApplicationsCountReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "pending_applications_by_category") {
      const result = await getPendingApplicationsByCategoryReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "approved_applications_count") {
      const result = await getApprovedApplicationsCountReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "approved_applications_by_category") {
      const result = await getApprovedApplicationsByCategoryReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "top_approved_regions") {
      const result = await getTopApprovedRegionsReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "top_approved_districts") {
      const result = await getTopApprovedDistrictsReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "rejected_applications_count") {
      const result = await getRejectedApplicationsCountReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "rejected_applications_by_category") {
      const result = await getRejectedApplicationsByCategoryReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "applications_by_category") {
      const result = await getApplicationsByCategoryReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "top_pending_regions") {
      const result = await getTopPendingRegionsReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "top_pending_districts") {
      const result = await getTopPendingDistrictsReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "registered_schools_by_region") {
      const result = await getRegisteredSchoolsByRegionReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "registration_growth_by_region") {
      const result = await getRegistrationGrowthByRegionReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "registration_growth_by_district") {
      const result = await getRegistrationGrowthByDistrictReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "registered_schools_by_type") {
      const result = await getRegisteredSchoolsByTypeReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "registered_schools_by_language") {
      const result = await getRegisteredSchoolsByLanguageReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "top_english_medium_regions") {
      const result = await getTopRegionsByLanguageReply({
        user: req.user,
        languagePattern: "english",
        label: "English medium",
      });
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "top_swahili_medium_regions") {
      const result = await getTopRegionsByLanguageReply({
        user: req.user,
        languagePattern: "kiswahili|swahili",
        label: "Kiswahili medium",
      });
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "registered_schools_by_curriculum") {
      const result = await getRegisteredSchoolsByDimensionReply({
        user: req.user,
        joinSql: "LEFT JOIN curricula c ON c.id = e.curriculum_id",
        labelSql: "COALESCE(NULLIF(TRIM(c.curriculum), ''), 'Unknown')",
        groupSql: "label",
        replyPrefix: "Idadi ya shule kwa curriculum ni:",
      });
      return res.send({ error: false, statusCode: 300, data: result, message: "AI response" });
    }

    if (intent === "top_curriculum_regions") {
      const result = await getTopRegionsByDimensionReply({
        user: req.user,
        joinSql: "LEFT JOIN curricula c ON c.id = e.curriculum_id",
        filterSql: "c.id IS NOT NULL",
        label: "curriculum mbalimbali",
      });
      return res.send({ error: false, statusCode: 300, data: result, message: "AI response" });
    }

    if (intent === "curriculum_most_used") {
      const result = await getRegisteredSchoolsByDimensionReply({
        user: req.user,
        joinSql: "LEFT JOIN curricula c ON c.id = e.curriculum_id",
        labelSql: "COALESCE(NULLIF(TRIM(c.curriculum), ''), 'Unknown')",
        groupSql: "label",
        replyPrefix: "Curriculum zinazotumika zaidi ni:",
      });
      return res.send({ error: false, statusCode: 300, data: result, message: "AI response" });
    }

    if (intent === "registered_schools_by_certificate_type") {
      const result = await getRegisteredSchoolsByDimensionReply({
        user: req.user,
        joinSql: "LEFT JOIN certificate_types ct ON ct.id = e.certificate_type_id",
        labelSql: "COALESCE(NULLIF(TRIM(ct.certificate), ''), 'Unknown')",
        groupSql: "label",
        replyPrefix: "Idadi ya shule kwa certificate type ni:",
      });
      return res.send({ error: false, statusCode: 300, data: result, message: "AI response" });
    }

    if (intent === "top_certificate_type_regions") {
      const result = await getTopRegionsByDimensionReply({
        user: req.user,
        joinSql: "LEFT JOIN certificate_types ct ON ct.id = e.certificate_type_id",
        filterSql: "ct.id IS NOT NULL",
        label: "certificate type mbalimbali",
      });
      return res.send({ error: false, statusCode: 300, data: result, message: "AI response" });
    }

    if (intent === "certificate_type_most_used") {
      const result = await getRegisteredSchoolsByDimensionReply({
        user: req.user,
        joinSql: "LEFT JOIN certificate_types ct ON ct.id = e.certificate_type_id",
        labelSql: "COALESCE(NULLIF(TRIM(ct.certificate), ''), 'Unknown')",
        groupSql: "label",
        replyPrefix: "Certificate type zinazotumika zaidi ni:",
      });
      return res.send({ error: false, statusCode: 300, data: result, message: "AI response" });
    }

    if (intent === "registered_schools_by_specialization") {
      const result = await getRegisteredSchoolsByDimensionReply({
        user: req.user,
        joinSql: "LEFT JOIN school_specializations ss ON ss.id = e.school_specialization_id",
        labelSql: "COALESCE(NULLIF(TRIM(ss.specialization), ''), 'Unknown')",
        groupSql: "label",
        replyPrefix: "Idadi ya shule kwa specialization ni:",
      });
      return res.send({ error: false, statusCode: 300, data: result, message: "AI response" });
    }

    if (intent === "top_specialization_regions") {
      const result = await getTopRegionsByDimensionReply({
        user: req.user,
        joinSql: "LEFT JOIN school_specializations ss ON ss.id = e.school_specialization_id",
        filterSql: "ss.id IS NOT NULL",
        label: "specialization mbalimbali",
      });
      return res.send({ error: false, statusCode: 300, data: result, message: "AI response" });
    }

    if (intent === "top_specialization_districts") {
      const result = await getTopDistrictsByDimensionReply({
        user: req.user,
        joinSql: "LEFT JOIN school_specializations ss ON ss.id = e.school_specialization_id",
        filterSql: "ss.id IS NOT NULL",
        label: "specialization mbalimbali",
      });
      return res.send({ error: false, statusCode: 300, data: result, message: "AI response" });
    }

    if (intent === "registered_schools_by_district") {
      const result = await getRegisteredSchoolsByDistrictReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "deregistered_schools_count") {
      const result = await getDeregisteredSchoolsCountReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "applications_by_period") {
      const result = await getApplicationsByPeriodReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (intent === "overdue_applications") {
      const result = await getOverdueApplicationsReply(req.user);
      return res.send({
        error: false,
        statusCode: 300,
        data: result,
        message: "AI response",
      });
    }

    if (looksLikeIndicatorQuery(lastUserMessage)) {
      return res.send({
        error: true,
        statusCode: 306,
        message: "Swali la takwimu halijaunganishwa vizuri bado kwenye mfumo. Jaribu wording nyingine ya karibu au ongeza indicator hii kwenye registry ya takwimu.",
      });
    }

    const context = await buildSupportContext({ req, userMessage: lastUserMessage });

    const systemPrompt = buildSystemPrompt(context);
    const ollamaMessages = [{ role: "system", content: systemPrompt }, ...messages];

    const { content } = await chat({
      messages: ollamaMessages,
      model: safeTrim(req.body?.model),
      temperature: req.body?.temperature,
      num_predict: req.body?.num_predict ?? 256,
    });

    const reply = sanitizeAssistantReply(content);
    if (!reply) {
      return res.send({
        error: true,
        statusCode: 306,
        message: "AI haikutoa jibu linaloweza kutumika. Jaribu tena baada ya muda mfupi.",
      });
    }

    return res.send({
      error: false,
      statusCode: 300,
      data: {
        reply,
        context_used: context,
        provider: getAIProvider(),
      },
      message: "AI response",
    });
  } catch (error) {
    const message = safeTrim(error?.message) || "Imeshindikana kuwasiliana na AI (Ollama).";
    return res.send({
      error: true,
      statusCode: 306,
      message:
        error?.code === "AI_CONFIG_ERROR"
          ? "AI provider wa online hajakamilishwa. Hakikisha `OPENAI_API_KEY` na `OPENAI_MODEL` vimewekwa."
          : error?.code === "OLLAMA_TIMEOUT" || error?.code === "AI_TIMEOUT" || /aborted|timed out/i.test(message)
            ? "AI imechelewa kujibu ndani ya muda uliowekwa. Jaribu tena au ongeza timeout ya provider unayotumia."
            : message.includes("fetch failed")
              ? "AI provider haipatikani. Hakikisha service ya AI ina-run au internet ipo sawa, kisha jaribu tena."
              : message,
    });
  }
});

module.exports = aiSupportRouter;
