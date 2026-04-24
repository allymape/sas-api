const sharedModel = require("../../models/sharedModel");

const DEFAULT_LIMIT = Number.parseInt(process.env.RIPOTI_USAJILI_PIVOT_DEFAULT_LIMIT || "500", 10);
const MAX_LIMIT = Number.parseInt(process.env.RIPOTI_USAJILI_PIVOT_MAX_LIMIT || "10000", 10);

const MONTH_NAMES_SW = {
  1: "Januari",
  2: "Februari",
  3: "Machi",
  4: "Aprili",
  5: "Mei",
  6: "Juni",
  7: "Julai",
  8: "Agosti",
  9: "Septemba",
  10: "Oktoba",
  11: "Novemba",
  12: "Desemba",
};

const SUMMARY_DIMENSIONS = {
  region_name: {
    label: "Mkoa",
    key: "COALESCE(NULLIF(TRIM(r.RegionName), ''), 'Haijulikani')",
    display: "Mkoa",
  },
  district_name: {
    label: "Wilaya",
    key: "COALESCE(NULLIF(TRIM(d.LgaName), ''), 'Haijulikani')",
    display: "Wilaya",
  },
  council_name: {
    label: "Halmashauri",
    key: "COALESCE(NULLIF(TRIM(d.LgaName), ''), 'Haijulikani')",
    display: "Halmashauri",
  },
  ownership_name: {
    label: "Umiliki",
    key: "COALESCE(NULLIF(TRIM(rt.registry), ''), 'Nyingine')",
    display: "Umiliki",
  },
  level_name: {
    label: "Ngazi",
    key: "COALESCE(NULLIF(TRIM(ct.certificate), ''), COALESCE(NULLIF(TRIM(ct.level), ''), 'Haijulikani'))",
    display: "Ngazi",
  },
  specialization_name: {
    label: "Tahasusi",
    key: "COALESCE(NULLIF(TRIM(ss.specialization), ''), 'Haijulikani')",
    display: "Tahasusi",
  },
  language_name: {
    label: "Lugha",
    key: "COALESCE(NULLIF(TRIM(lang.language), ''), 'Haijulikani')",
    display: "Lugha",
  },
  school_type_name: {
    label: "Aina ya Shule",
    key: "COALESCE(NULLIF(TRIM(sc.category), ''), 'Haijulikani')",
    display: "Aina ya Shule",
  },
  accommodation_name: {
    label: "Malazi",
    key: "COALESCE(NULLIF(TRIM(ssc.subcategory), ''), 'Haijulikani')",
    display: "Malazi",
  },
  education_type_name: {
    label: "Aina ya Shule",
    key: "COALESCE(NULLIF(TRIM(sc.category), ''), 'Haijulikani')",
    display: "Aina ya Shule",
  },
  verification_label: {
    label: "Uthibitisho",
    key: "CASE WHEN COALESCE(sr.is_verified, 0) = 1 THEN 'Verified' ELSE 'Not Verified' END",
    display: "Uthibitisho",
  },
  application_year: {
    label: "Mwaka wa Ombi",
    key: "YEAR(a.created_at)",
    display: "Mwaka",
  },
  application_month: {
    label: "Mwezi wa Ombi",
    key: "DATE_FORMAT(a.created_at, '%Y-%m')",
    display: "Mwezi",
  },
  month_name: {
    label: "Mwezi",
    key: "DATE_FORMAT(a.created_at, '%Y-%m')",
    display: "Mwezi",
  },
  application_year_month: {
    label: "Mwaka-Mwezi wa Ombi",
    key: "DATE_FORMAT(a.created_at, '%Y-%m')",
    display: "Mwaka-Mwezi",
  },
};

const nowMs = () => Number(process.hrtime.bigint() / 1000000n);

const toNumber = (value, fallback = null) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
};

const trimOrNull = (value) => {
  if (value === null || typeof value === "undefined") return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

const parseDateToken = (value) => {
  const text = trimOrNull(value);
  if (!text) return null;
  const normalized = text.replace(/\//g, "-");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const parseDateRange = (dateRange) => {
  const text = trimOrNull(dateRange);
  if (!text) return { startDate: null, endDate: null };

  const parts = text.split("to").map((item) => parseDateToken(item));
  if (parts.length < 2) {
    const single = parseDateToken(text);
    return { startDate: single, endDate: single };
  }

  return {
    startDate: parts[0],
    endDate: parts[1],
  };
};

const toIsoDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const toDateOnly = (value) => {
  const iso = toIsoDate(value);
  if (!iso) return null;
  return iso.slice(0, 10);
};

const weekOfYear = (value) => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);
};

const daysDiff = (from, to) => {
  if (!from || !to) return null;
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const ms = end.getTime() - start.getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  if (!Number.isFinite(days)) return null;
  return Number(days.toFixed(2));
};

class UsajiliPivotAnalyticsService {
  normalizeInput(rawInput = {}) {
    const safeDefault = Number.isFinite(DEFAULT_LIMIT) && DEFAULT_LIMIT > 0 ? DEFAULT_LIMIT : 500;
    const safeMax = Number.isFinite(MAX_LIMIT) && MAX_LIMIT > 0 ? MAX_LIMIT : 10000;

    const rawLimitToken = trimOrNull(rawInput.limit);
    const isAllLimitRequested = rawLimitToken && String(rawLimitToken).toLowerCase() === "all";

    let requestedLimit = null;
    let appliedLimit = null;

    if (isAllLimitRequested) {
      requestedLimit = "all";
      appliedLimit = null;
    } else {
      const limitInput = toNumber(rawInput.limit, safeDefault) || safeDefault;
      const boundedLimit = Math.min(safeMax, Math.max(100, limitInput || safeDefault));
      requestedLimit = boundedLimit;
      appliedLimit = boundedLimit;
    }

    const year = toNumber(rawInput.year, null);
    const ownership = toNumber(rawInput.ownership, null);
    const level = toNumber(rawInput.level, null);
    const verificationStatus = trimOrNull(rawInput.verification_status);

    const region = trimOrNull(rawInput.region);
    const district = trimOrNull(rawInput.district);
    const council = trimOrNull(rawInput.council);
    const q = trimOrNull(rawInput.q || rawInput.tracking_number);

    const applicationDateFrom = parseDateToken(rawInput.date_from);
    const applicationDateTo = parseDateToken(rawInput.date_to);
    const range = parseDateRange(rawInput.date_range);

    const dateFrom = applicationDateFrom || range.startDate;
    const dateTo = applicationDateTo || range.endDate;

    return {
      limit: appliedLimit,
      requestedLimit,
      appliedLimit,
      year,
      ownership,
      level,
      verificationStatus,
      region,
      district,
      council,
      q,
      dateFrom,
      dateTo,
    };
  }

  buildBaseSql({ user = {}, filters = {} }) {
    const { sehemu, zone_id, district_code } = user;

    const params = [];
    const where = [];

    where.push("AND a.is_approved = 2");
    where.push("AND COALESCE(sr.reg_status, 0) = 1");

    if (sehemu === "k1" && zone_id) {
      where.push("AND r.zone_id = ?");
      params.push(String(zone_id));
    }

    if (sehemu === "w1" && district_code) {
      where.push("AND d.LgaCode = ?");
      params.push(String(district_code));
    }

    if (filters.year) {
      const year = Number(filters.year);
      where.push("AND a.created_at >= ? AND a.created_at < ?");
      params.push(`${year}-01-01 00:00:00`, `${year + 1}-01-01 00:00:00`);
    }

    if (filters.ownership) {
      where.push("AND COALESCE(a.registry_type_id, e.registry_type_id, e_tracking.school_registry_type_id) = ?");
      params.push(Number(filters.ownership));
    }

    if (filters.level) {
      where.push("AND COALESCE(e.certificate_type_id, e_tracking.certificate_type_id) = ?");
      params.push(Number(filters.level));
    }

    if (filters.verificationStatus) {
      const normalizedStatus = String(filters.verificationStatus).toLowerCase();
      if (["verified", "1", "ndiyo", "yes"].includes(normalizedStatus)) {
        where.push("AND COALESCE(sr.is_verified, 0) = 1");
      } else if (["not_verified", "0", "hapana", "no"].includes(normalizedStatus)) {
        where.push("AND COALESCE(sr.is_verified, 0) = 0");
      }
    }

    if (filters.region) {
      where.push("AND r.RegionCode = ?");
      params.push(String(filters.region));
    }

    const districtFilter = filters.council || filters.district;
    if (districtFilter) {
      where.push("AND d.LgaCode = ?");
      params.push(String(districtFilter));
    }

    if (filters.dateFrom && filters.dateTo) {
      where.push("AND a.created_at >= ? AND a.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
      params.push(`${filters.dateFrom} 00:00:00`, `${filters.dateTo} 00:00:00`);
    } else if (filters.dateFrom) {
      where.push("AND a.created_at >= ?");
      params.push(`${filters.dateFrom} 00:00:00`);
    } else if (filters.dateTo) {
      where.push("AND a.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
      params.push(`${filters.dateTo} 00:00:00`);
    }

    if (filters.q) {
      where.push(`
        AND (
          a.tracking_number LIKE ?
          OR COALESCE(e.school_name, e_tracking.school_name) LIKE ?
          OR own.owner_name LIKE ?
        )
      `);
      const like = `%${String(filters.q)}%`;
      params.push(like, like, like);
    }

    const latestOwnerSql = `
      SELECT o1.establishing_school_id, o1.owner_name
      FROM owners o1
      INNER JOIN (
        SELECT establishing_school_id, MAX(id) AS max_id
        FROM owners
        WHERE establishing_school_id IS NOT NULL
        GROUP BY establishing_school_id
      ) latest_owner ON latest_owner.max_id = o1.id
    `;

    const latestRegistrationSql = `
      SELECT sr1.establishing_school_id, sr1.reg_status, sr1.is_verified
      FROM school_registrations sr1
      INNER JOIN (
        SELECT establishing_school_id, MAX(id) AS max_id
        FROM school_registrations
        WHERE establishing_school_id IS NOT NULL
        GROUP BY establishing_school_id
      ) latest_sr ON latest_sr.max_id = sr1.id
    `;

    const fromSql = `
      FROM applications a
      LEFT JOIN establishing_schools e ON e.id = a.establishing_school_id
      LEFT JOIN (
        SELECT
          id,
          tracking_number,
          school_name,
          registry_type_id AS school_registry_type_id,
          school_category_id,
          school_sub_category_id,
          language_id,
          school_specialization_id,
          ward_id,
          village_id,
          certificate_type_id
        FROM establishing_schools
      ) e_tracking
        ON e_tracking.tracking_number = a.tracking_number
        AND a.establishing_school_id IS NULL
      LEFT JOIN registry_types rt
        ON rt.id = COALESCE(a.registry_type_id, e.registry_type_id, e_tracking.school_registry_type_id)
      LEFT JOIN school_categories sc ON sc.id = COALESCE(e.school_category_id, e_tracking.school_category_id)
      LEFT JOIN school_sub_categories ssc ON ssc.id = COALESCE(e.school_sub_category_id, e_tracking.school_sub_category_id)
      LEFT JOIN certificate_types ct ON ct.id = COALESCE(e.certificate_type_id, e_tracking.certificate_type_id)
      LEFT JOIN languages lang ON lang.id = COALESCE(e.language_id, e_tracking.language_id)
      LEFT JOIN school_specializations ss ON ss.id = COALESCE(e.school_specialization_id, e_tracking.school_specialization_id)
      LEFT JOIN (${latestOwnerSql}) own ON own.establishing_school_id = COALESCE(e.id, e_tracking.id)
      LEFT JOIN (${latestRegistrationSql}) sr ON sr.establishing_school_id = COALESCE(e.id, e_tracking.id)
      LEFT JOIN streets st ON st.StreetCode = COALESCE(e.village_id, e_tracking.village_id)
      LEFT JOIN wards w ON w.WardCode = COALESCE(e.ward_id, e_tracking.ward_id, st.WardCode)
      LEFT JOIN districts d ON d.LgaCode = w.LgaCode
      LEFT JOIN regions r ON r.RegionCode = d.RegionCode
      LEFT JOIN zones z ON z.id = r.zone_id
      WHERE 1=1
      ${where.join("\n")}
    `;

    return {
      fromSql,
      params,
    };
  }

  mapRow(row = {}) {
    const submittedAt = toIsoDate(row.submitted_at);
    const reviewedAt = toIsoDate(row.reviewed_at);
    const approvedAt = toIsoDate(row.approved_at);
    const applicationDate = toDateOnly(row.application_date || row.submitted_at);

    const applicationDateObj = applicationDate ? new Date(`${applicationDate}T00:00:00`) : null;
    const approvalDateObj = approvedAt ? new Date(approvedAt) : null;

    const applicationYear = applicationDateObj ? applicationDateObj.getFullYear() : null;
    const applicationMonth = applicationDateObj ? applicationDateObj.getMonth() + 1 : null;
    const applicationMonthName = applicationMonth ? MONTH_NAMES_SW[applicationMonth] || null : null;
    const applicationQuarter = applicationMonth ? Math.ceil(applicationMonth / 3) : null;

    const approvalYear = approvalDateObj ? approvalDateObj.getFullYear() : null;
    const approvalMonth = approvalDateObj ? approvalDateObj.getMonth() + 1 : null;
    const approvalQuarter = approvalMonth ? Math.ceil(approvalMonth / 3) : null;

    const verificationStatusRaw = Number(row.verification_status ?? 0);
    const approvalStatusRaw = Number(row.approval_status ?? 0);

    const daysToReview = daysDiff(submittedAt, reviewedAt);
    const daysToApprove = daysDiff(submittedAt, approvedAt);

    return {
      id: row.id,
      application_number: row.tracking_number || row.application_number,
      tracking_number: row.tracking_number,
      school_name: row.school_name || null,
      owner_name: row.owner_name || null,
      ownership_name: row.ownership_name || null,
      region_name: row.region_name || null,
      district_name: row.district_name || null,
      council_name: row.council_name || row.district_name || null,
      ward_name: row.ward_name || null,
      level_name: row.level_name || null,
      school_type_name: row.school_type_name || null,
      accommodation_name: row.accommodation_name || null,
      education_type_name: row.school_type_name || row.education_type_name || null,
      specialization_name: row.specialization_name || null,
      language_name: row.language_name || null,
      verification_status: verificationStatusRaw === 1 ? "Verified" : "Not Verified",
      verification_code: verificationStatusRaw,
      approval_status: approvalStatusRaw,
      institution_status: row.institution_status,
      application_date: applicationDate,
      submitted_at: submittedAt,
      reviewed_at: reviewedAt,
      approved_at: approvedAt,
      year: applicationYear,
      month: applicationMonth,
      month_name: applicationMonthName,
      quarter: applicationQuarter,
      week_of_year: applicationDateObj ? weekOfYear(applicationDateObj) : null,

      application_year: applicationYear,
      application_month: applicationMonth,
      application_month_name: applicationMonthName,
      application_quarter: applicationQuarter,
      application_year_month:
        applicationYear && applicationMonth
          ? `${applicationYear}-${String(applicationMonth).padStart(2, "0")}`
          : null,
      approval_year: approvalYear,
      approval_month: approvalMonth,
      approval_quarter: approvalQuarter,
      geo_hierarchy:
        [row.region_name, row.district_name, row.council_name || row.district_name]
          .filter((item) => item && String(item).trim().length)
          .join(" > ") || null,
      verification_label: verificationStatusRaw === 1 ? "Verified" : "Not Verified",
      approval_label:
        approvalStatusRaw === 2
          ? "Approved"
          : approvalStatusRaw === 3
            ? "Rejected"
            : "Pending",
      has_specialization: row.specialization_name ? "Ndiyo" : "Hapana",
      has_owner: row.owner_name ? "Ndiyo" : "Hapana",
      record_count: 1,
      verified_record: verificationStatusRaw === 1 ? 1 : 0,
      not_verified_record: verificationStatusRaw === 1 ? 0 : 1,
      approved_record: approvalStatusRaw === 2 ? 1 : 0,

      days_to_review: daysToReview,
      days_to_approve: daysToApprove,
      days_from_submission_to_approval: daysToApprove,
      processing_days: daysToApprove,
    };
  }

  resolveSummaryDimension(rawDim, fallbackKey) {
    const key = trimOrNull(rawDim) || fallbackKey;
    if (key && SUMMARY_DIMENSIONS[key]) {
      return { key, meta: SUMMARY_DIMENSIONS[key] };
    }
    return {
      key: fallbackKey,
      meta: SUMMARY_DIMENSIONS[fallbackKey],
    };
  }

  normalizeSummaryInput(rawInput = {}) {
    const baseFilters = this.normalizeInput(rawInput);
    const groupLimitInput = toNumber(rawInput.group_limit, 2000) || 2000;
    const groupLimit = Math.min(5000, Math.max(100, groupLimitInput));

    const rowDimension = this.resolveSummaryDimension("region_name", "region_name");
    const colDimension = this.resolveSummaryDimension(rawInput.col_dim, "ownership_name");

    return {
      filters: baseFilters,
      groupLimit,
      rowDimension,
      colDimension,
    };
  }

  fetchSummary({ user = {}, input = {}, callback }) {
    const serviceStarted = nowMs();
    const normalized = this.normalizeSummaryInput(input);
    const filters = normalized.filters;
    const { fromSql, params } = this.buildBaseSql({ user, filters });
    const rowMeta = normalized.rowDimension.meta;
    const colMeta = normalized.colDimension.meta;

    const sqlSummary = `
      SELECT
        ${rowMeta.key} AS row_key,
        ${rowMeta.key} AS row_label,
        ${colMeta.key} AS col_key,
        ${colMeta.key} AS col_label,
        COUNT(DISTINCT a.id) AS total_applications,
        SUM(CASE WHEN COALESCE(sr.is_verified, 0) = 1 THEN 1 ELSE 0 END) AS verified_count,
        SUM(CASE WHEN COALESCE(sr.is_verified, 0) = 1 THEN 0 ELSE 1 END) AS not_verified_count,
        AVG(
          CASE
            WHEN a.approved_at IS NULL THEN NULL
            ELSE TIMESTAMPDIFF(DAY, a.created_at, a.approved_at)
          END
        ) AS avg_processing_days
      ${fromSql}
      GROUP BY row_key, row_label, col_key, col_label
      ORDER BY total_applications DESC
      LIMIT ?
    `;

    sharedModel.paginate(
      sqlSummary,
      null,
      (error, rows, numRows, timings) => {
        if (error) {
          callback(error, null);
          return;
        }

        const list = Array.isArray(rows) ? rows : [];
        const groupRows = list.map((item) => ({
          row_key: trimOrNull(item.row_key) || "Haijulikani",
          row_label: trimOrNull(item.row_label) || "Haijulikani",
          col_key: trimOrNull(item.col_key) || "Haijulikani",
          col_label: trimOrNull(item.col_label) || "Haijulikani",
          total_applications: Number(item.total_applications || 0),
          verified_count: Number(item.verified_count || 0),
          not_verified_count: Number(item.not_verified_count || 0),
          avg_processing_days:
            item.avg_processing_days === null || typeof item.avg_processing_days === "undefined"
              ? null
              : Number(Number(item.avg_processing_days).toFixed(2)),
        }));

        const rowTotalsMap = new Map();
        const colTotalsMap = new Map();

        let grandTotal = 0;
        let grandVerified = 0;
        let grandNotVerified = 0;
        let weightedProcessingSum = 0;
        let weightedProcessingCount = 0;

        groupRows.forEach((item) => {
          grandTotal += item.total_applications;
          grandVerified += item.verified_count;
          grandNotVerified += item.not_verified_count;

          const rowKey = String(item.row_key);
          const colKey = String(item.col_key);

          const rowEntry = rowTotalsMap.get(rowKey) || {
            row_key: item.row_key,
            row_label: item.row_label,
            total_applications: 0,
            verified_count: 0,
            not_verified_count: 0,
          };
          rowEntry.total_applications += item.total_applications;
          rowEntry.verified_count += item.verified_count;
          rowEntry.not_verified_count += item.not_verified_count;
          rowTotalsMap.set(rowKey, rowEntry);

          const colEntry = colTotalsMap.get(colKey) || {
            col_key: item.col_key,
            col_label: item.col_label,
            total_applications: 0,
            verified_count: 0,
            not_verified_count: 0,
          };
          colEntry.total_applications += item.total_applications;
          colEntry.verified_count += item.verified_count;
          colEntry.not_verified_count += item.not_verified_count;
          colTotalsMap.set(colKey, colEntry);

          if (item.avg_processing_days !== null) {
            weightedProcessingSum += item.avg_processing_days * item.total_applications;
            weightedProcessingCount += item.total_applications;
          }
        });

        const rowTotals = Array.from(rowTotalsMap.values()).sort(
          (a, b) => Number(b.total_applications || 0) - Number(a.total_applications || 0),
        );
        const colTotals = Array.from(colTotalsMap.values()).sort(
          (a, b) => Number(b.total_applications || 0) - Number(a.total_applications || 0),
        );

        const enrichedGroups = groupRows.map((item) => {
          const rowTotal = Number(rowTotalsMap.get(String(item.row_key))?.total_applications || 0);
          const colTotal = Number(colTotalsMap.get(String(item.col_key))?.total_applications || 0);
          return {
            ...item,
            percent_of_total:
              grandTotal > 0 ? Number(((item.total_applications / grandTotal) * 100).toFixed(2)) : 0,
            percent_of_row:
              rowTotal > 0 ? Number(((item.total_applications / rowTotal) * 100).toFixed(2)) : 0,
            percent_of_col:
              colTotal > 0 ? Number(((item.total_applications / colTotal) * 100).toFixed(2)) : 0,
          };
        });

        const queryMs = Number(timings?.rows_ms || 0);
        const serviceTotalMs = nowMs() - serviceStarted;
        const transformMs = Math.max(0, serviceTotalMs - queryMs);

        callback(null, {
          groups: enrichedGroups,
          loadedGroups: enrichedGroups.length,
          grouping: {
            row_dim: normalized.rowDimension.key,
            col_dim: normalized.colDimension.key,
            row_label: rowMeta.label,
            col_label: colMeta.label,
          },
          totals: {
            grand_total: grandTotal,
            verified_total: grandVerified,
            not_verified_total: grandNotVerified,
            verified_rate: grandTotal > 0 ? Number(((grandVerified / grandTotal) * 100).toFixed(2)) : 0,
            not_verified_rate:
              grandTotal > 0 ? Number(((grandNotVerified / grandTotal) * 100).toFixed(2)) : 0,
            avg_processing_days:
              weightedProcessingCount > 0
                ? Number((weightedProcessingSum / weightedProcessingCount).toFixed(2))
                : null,
          },
          rowTotals,
          colTotals,
          activeFilters: {
            year: filters.year,
            region: filters.region,
            district: filters.district,
            council: filters.council,
            ownership: filters.ownership,
            level: filters.level,
            verification_status: filters.verificationStatus,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
            q: filters.q,
            row_dim: normalized.rowDimension.key,
            col_dim: normalized.colDimension.key,
          },
          maxGroupLimit: normalized.groupLimit,
          timings: {
            ...(timings || {}),
            query_ms: queryMs,
            transform_ms: transformMs,
            response_ms: Number(Math.max(0, serviceTotalMs - queryMs - transformMs)),
            service_total_ms: serviceTotalMs,
          },
          lastRefreshed: new Date().toISOString(),
        });
      },
      {
        rows: [...params, normalized.groupLimit],
      },
    );
  }

  fetch({ user = {}, input = {}, callback }) {
    const serviceStarted = nowMs();
    const filters = this.normalizeInput(input);
    const { fromSql, params } = this.buildBaseSql({ user, filters });

    const numericLimit = Number(filters.appliedLimit);
    const hasNumericLimit = Number.isFinite(numericLimit) && numericLimit > 0;
    const fetchLimit = hasNumericLimit ? numericLimit + 1 : null;

    const sqlRows = `
      SELECT
        a.id AS id,
        a.id AS application_number,
        a.tracking_number AS tracking_number,
        COALESCE(e.school_name, e_tracking.school_name) AS school_name,
        own.owner_name AS owner_name,
        COALESCE(NULLIF(TRIM(rt.registry), ''), 'Nyingine') AS ownership_name,
        COALESCE(NULLIF(TRIM(r.RegionName), ''), 'Haijulikani') AS region_name,
        COALESCE(NULLIF(TRIM(d.LgaName), ''), 'Haijulikani') AS district_name,
        COALESCE(NULLIF(TRIM(d.LgaName), ''), 'Haijulikani') AS council_name,
        COALESCE(NULLIF(TRIM(w.WardName), ''), 'Haijulikani') AS ward_name,
        COALESCE(NULLIF(TRIM(ct.certificate), ''), COALESCE(NULLIF(TRIM(ct.level), ''), 'Haijulikani')) AS level_name,
        COALESCE(NULLIF(TRIM(sc.category), ''), 'Haijulikani') AS school_type_name,
        COALESCE(NULLIF(TRIM(ssc.subcategory), ''), 'Haijulikani') AS accommodation_name,
        COALESCE(NULLIF(TRIM(ss.specialization), ''), '') AS specialization_name,
        COALESCE(NULLIF(TRIM(lang.language), ''), '') AS language_name,
        COALESCE(sr.is_verified, 0) AS verification_status,
        a.is_approved AS approval_status,
        COALESCE(sr.reg_status, 0) AS institution_status,
        DATE(a.created_at) AS application_date,
        a.created_at AS submitted_at,
        a.updated_at AS reviewed_at,
        a.approved_at AS approved_at
      ${fromSql}
      ORDER BY a.id DESC${hasNumericLimit ? "\n      LIMIT ?" : ""}
    `;

    sharedModel.paginate(
      sqlRows,
      null,
      (error, rows, numRows, timings) => {
        if (error) {
          callback(error, null);
          return;
        }

        const rawRows = Array.isArray(rows) ? rows : [];
        const seen = new Set();
        const uniqueRows = [];

        for (let i = 0; i < rawRows.length; i += 1) {
          const row = rawRows[i];
          const key = String(row.id || "");
          if (!key || seen.has(key)) continue;
          seen.add(key);
          uniqueRows.push(row);

          if (hasNumericLimit && uniqueRows.length > numericLimit) break;
        }

        const hasMore = hasNumericLimit ? uniqueRows.length > numericLimit : false;
        const selectedRows = hasMore ? uniqueRows.slice(0, numericLimit) : uniqueRows;

        const transformStarted = nowMs();
        const flatData = selectedRows.map((row) => this.mapRow(row));
        const transformMs = nowMs() - transformStarted;

        const queryMs = Number(timings?.rows_ms || 0);
        const serviceTotalMs = nowMs() - serviceStarted;
        const lastRefreshed = new Date().toISOString();

        callback(null, {
          records: flatData,
          totalRecords: hasMore ? null : flatData.length,
          exactTotal: !hasMore,
          hasMore,
          loadedRecords: flatData.length,
          truncated: hasMore,
          requestedLimit: filters.requestedLimit,
          appliedLimit: hasNumericLimit ? numericLimit : null,
          maxLimit: hasNumericLimit ? numericLimit : null,
          activeFilters: {
            year: filters.year,
            region: filters.region,
            district: filters.district,
            council: filters.council,
            ownership: filters.ownership,
            level: filters.level,
            verification_status: filters.verificationStatus,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
            q: filters.q,
          },
          timings: {
            ...(timings || {}),
            query_ms: queryMs,
            transform_ms: transformMs,
            response_ms: Number(Math.max(0, serviceTotalMs - queryMs - transformMs)),
            service_total_ms: serviceTotalMs,
          },
          lastRefreshed,
        });
      },
      {
        rows: hasNumericLimit ? [...params, fetchLimit] : [...params],
      },
    );
  }
}

module.exports = UsajiliPivotAnalyticsService;
