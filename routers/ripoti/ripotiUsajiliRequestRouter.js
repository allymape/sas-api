require("dotenv").config();
const express = require("express");
const ripotiUsajiliRequestRouter = express.Router();
const { isAuth, formatDate, auditTrail, auditMiddleware } = require("../../utils");
const sharedModel = require("../../models/sharedModel");
const schoolModel = require("../../models/schoolModel");

const ANALYTICS_CACHE_TTL_MS = Number.parseInt(process.env.RIPOTI_ANALYTICS_CACHE_MS || "60000", 10);
const analyticsCache = new Map();

const getCache = (key) => {
  const cached = analyticsCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    analyticsCache.delete(key);
    return null;
  }
  return cached.value;
};

const setCache = (key, value) => {
  const ttl = Number.isFinite(ANALYTICS_CACHE_TTL_MS) && ANALYTICS_CACHE_TTL_MS > 0 ? ANALYTICS_CACHE_TTL_MS : 60000;
  analyticsCache.set(key, { value, expiresAt: Date.now() + ttl });
  // prune
  if (analyticsCache.size > 250) {
    const oldestKey = analyticsCache.keys().next().value;
    if (oldestKey) analyticsCache.delete(oldestKey);
  }
};

const buildUsajiliBaseQuery = ({ user, input }) => {
  const { sehemu, zone_id, district_code } = user || {};
  const toStr = (v) => (v === null || typeof v === "undefined" ? "" : String(v));

  const tracking_number = input.tracking_number;
  const date_range = input.date_range;
  const category = Number(input.category);
  const verified = Number(input.verified);
  const ownership = Number(input.ownership);
  const structure = Number(input.structure);
  const certificate = Number(input.certificate);
  const language = Number(input.language);
  const specialization = Number(input.specialization);
  const stream = input.stream;
  const region = input.region;
  const district = input.district;
  const ward = input.ward;
  const street = input.street;

  let start_date = "";
  let end_date = "";
  if (date_range) {
    start_date = formatDate(date_range.split("to")[0], "YYYY-MM-DD");
    end_date = formatDate(date_range.split("to")[1], "YYYY-MM-DD");
  }

  const where = [];
  const params = [];

  // Latest registration application per school (category 4).
  const latestRegistrationApplicationSql = `
    SELECT a1.id, a1.establishing_school_id, a1.registry_type_id, a1.tracking_number, a1.is_approved, a1.approved_at
    FROM applications a1
    INNER JOIN (
      SELECT establishing_school_id, MAX(id) AS max_id
      FROM applications
      WHERE application_category_id = 4 AND is_approved = 2
      GROUP BY establishing_school_id
    ) latest ON latest.max_id = a1.id
  `;

  // Latest registration row per school (with a registration_number).
  const latestSchoolRegistrationSql = `
    SELECT sr1.*
    FROM school_registrations sr1
    INNER JOIN (
      SELECT establishing_school_id, MAX(id) AS max_id
      FROM school_registrations
      WHERE registration_number IS NOT NULL
      GROUP BY establishing_school_id
    ) latest_sr ON latest_sr.max_id = sr1.id
  `;

	  const locationsJoinSql = `
	    JOIN (
	      SELECT
	        r.RegionCode AS region_code,
	        d.LgaCode AS district_code,
	        w.WardCode AS ward_code,
	        s.StreetCode AS street_code,
	        r.zone_id AS zone_id,
	        r.RegionName AS region,
	        d.LgaName AS district,
	        d.district_box AS ded_box,
	        d.ngazi AS ngazi_ya_wilaya,
	        w.WardName AS ward,
	        s.StreetName AS street,
	        z.zone_name AS zone_name,
	        z.box AS zone_box,
	        r.box AS region_box,
	        r.sqa_zone AS has_zone_office,
	        d.district_box AS district_box,
	        d.sqa_box AS district_sqa_box
	      FROM regions r
	        JOIN districts d ON d.RegionCode = r.RegionCode
	        JOIN wards w ON w.LgaCode = d.LgaCode
	        JOIN streets s ON s.WardCode = w.WardCode
	        LEFT JOIN zones z ON z.id = r.zone_id
	    ) aav ON aav.street_code = e.village_id
	  `;

  const fromRows = `
    FROM establishing_schools e
    JOIN (${latestSchoolRegistrationSql}) sr ON sr.establishing_school_id = e.id
    JOIN (${latestRegistrationApplicationSql}) a ON a.establishing_school_id = e.id
    ${locationsJoinSql}
    LEFT JOIN school_categories sc ON sc.id = e.school_category_id
    LEFT JOIN registration_structures rs ON rs.id = e.registration_structure_id
    LEFT JOIN school_sub_categories ssc ON ssc.id = e.school_sub_category_id
    LEFT JOIN languages l ON l.id = e.language_id
    LEFT JOIN school_gender_types sgt ON sgt.id = e.school_gender_type_id
    LEFT JOIN registry_types rt ON rt.id = e.registry_type_id
    LEFT JOIN school_verifications sv ON sv.tracking_number = a.tracking_number
    LEFT JOIN certificate_types ct ON ct.id = e.certificate_type_id
    LEFT JOIN school_specializations sp ON sp.id = e.school_specialization_id
    WHERE 1=1
  `;

  const fromCount = `
    FROM establishing_schools e
    JOIN (${latestSchoolRegistrationSql}) sr ON sr.establishing_school_id = e.id
    JOIN (${latestRegistrationApplicationSql}) a ON a.establishing_school_id = e.id
    ${locationsJoinSql}
    LEFT JOIN school_categories sc ON sc.id = e.school_category_id
    LEFT JOIN registration_structures rs ON rs.id = e.registration_structure_id
    LEFT JOIN registry_types rt ON rt.id = e.registry_type_id
    LEFT JOIN certificate_types ct ON ct.id = e.certificate_type_id
    LEFT JOIN languages l ON l.id = e.language_id
    LEFT JOIN school_specializations sp ON sp.id = e.school_specialization_id
    WHERE 1=1
  `;

  // Registered schools only: app cat = 4 and approved = 2 already enforced by latestRegistrationApplicationSql.
  // Ensure registration is active/valid.
  where.push(`AND sr.reg_status = 1`);

  // Office-based restrictions.
  if (sehemu == "k1" && zone_id) {
    where.push(`AND aav.zone_id = ?`);
    params.push(toStr(zone_id));
  }
  if (sehemu == "w1" && district_code) {
    where.push(`AND aav.district_code = ?`);
    params.push(toStr(district_code));
  }

  if (tracking_number) {
    where.push(`AND (a.tracking_number LIKE ? OR e.school_name LIKE ? OR sr.registration_number LIKE ?)`);
    const q = `%${toStr(tracking_number)}%`;
    params.push(q, q, q);
  }

  if (start_date && end_date) {
    where.push(`AND a.approved_at >= ? AND a.approved_at < DATE_ADD(?, INTERVAL 1 DAY)`);
    params.push(`${start_date} 00:00:00`, `${end_date} 00:00:00`);
  }

  if (verified) {
    where.push(`AND sr.is_verified = ?`);
    params.push(Number(verified) === 1 ? 1 : 0);
  }

  if (category) {
    where.push(`AND e.school_category_id = ?`);
    params.push(Number(category));
  }
  if (structure) {
    where.push(`AND e.registration_structure_id = ?`);
    params.push(Number(structure));
  }
  if (certificate) {
    where.push(`AND e.certificate_type_id = ?`);
    params.push(Number(certificate));
  }
  if (language) {
    where.push(`AND e.language_id = ?`);
    params.push(Number(language));
  }
  if (specialization) {
    where.push(`AND e.school_specialization_id = ?`);
    params.push(Number(specialization));
  }
  if (typeof stream !== "undefined" && stream !== null && String(stream).trim() !== "") {
    where.push(`AND e.stream = ?`);
    params.push(Number(stream));
  }
  if (ownership) {
    where.push(`AND e.registry_type_id = ?`);
    params.push(Number(ownership));
  }

  if (region) {
    where.push(`AND aav.region_code = ?`);
    params.push(toStr(region));
  }
  if (district) {
    where.push(`AND aav.district_code = ?`);
    params.push(toStr(district));
  }
  if (ward) {
    where.push(`AND aav.ward_code = ?`);
    params.push(toStr(ward));
  }
  if (street) {
    where.push(`AND aav.street_code = ?`);
    params.push(toStr(street));
  }

  return { fromRows, fromCount, where, params };
};
// List of
ripotiUsajiliRequestRouter.get("/ripoti-usajili-shule", isAuth, (req, res) => {
  const user = req.user;
  const input = { ...(req.body || {}), ...(req.query || {}) };
  const toInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const toBool = (value) => String(value || "").toLowerCase() === "true" || String(value || "") === "1";

  const isExport = toBool(input.export);
  const isFast = toBool(input.fast);
  const page = Math.max(1, toInt(input.page, 1));
  const per_page = Math.max(1, toInt(input.per_page, 10));
  const offset = (page - 1) * per_page; //(0 , 10, 20,30)

  const runReport = (categories = [], ownerships = [], structures = [], certificates = [], regions = []) => {
    const { fromRows, fromCount, where, params } = buildUsajiliBaseQuery({ user, input });

    const rowsLimit = isFast ? per_page + 1 : per_page;
    const sqlRows = `
      SELECT
        a.tracking_number AS tracking_number,
        e.school_name AS school_name,
        sr.registration_number AS registration_number,
        sr.registration_date AS registration_date,
        sr.is_seminary AS is_seminary,
        sr.reg_status AS reg_status,
        e.school_specialization_id AS school_specialization_id,
        sp.specialization AS specialization,
        LOWER(ssc.subcategory) AS subcategory,
        sc.category AS category,
        l.language AS language,
        LOWER(sgt.gender_type) AS gender_type,
        e.stream AS stream,
        rs.structure AS structure,
        rt.registry AS registry,
        aav.region AS region,
        aav.district AS district,
        aav.ward AS ward,
        aav.street AS street,
        aav.region_code AS region_code,
        aav.district_code AS district_code,
        aav.ward_code AS ward_code,
        aav.street_code AS street_code,
        aav.zone_id AS zone_id,
        aav.zone_name AS zone_name,
        a.is_approved AS status,
        CASE
          WHEN a.is_approved = 2 THEN 'Ndio'
          WHEN a.is_approved = 3 THEN 'Hapana'
          ELSE ''
        END AS approved,
        a.approved_at AS approved_at,
        sr.is_verified AS is_verified,
        sr.id AS registration_id,
        sv.description AS description,
        sv.corrected AS corrected
      ${fromRows}
      ${where.join("\n")}
      ORDER BY a.approved_at DESC, e.school_name DESC
      LIMIT ?, ?
    `;

    const sqlCount = isExport || isFast
      ? null
      : `
        SELECT COUNT(*) AS num_rows
        ${fromCount}
        ${where.join("\n")}
      `;

    sharedModel.paginate(
      sqlRows,
      sqlCount,
      (error, data, numRows, timings) => {
        const rows = Array.isArray(data) ? data : [];
        const has_next = isFast ? rows.length > per_page : false;
        const slicedRows = has_next ? rows.slice(0, per_page) : rows;
        const has_prev = isFast ? page > 1 : false;

        return res.send({
          error: error ? true : false,
          statusCode: error ? 306 : 300,
          data: error ? error : slicedRows,
          categories,
          ownerships,
          certificates,
          structures,
          regions,
          numRows: isFast ? null : numRows,
          has_next,
          has_prev,
          timings: timings || null,
          message: error
            ? "Something went wrong."
            : "Ripoti ya usajili shule.",
        });
      },
      { rows: [...params, offset, rowsLimit], count: [...params] }
    );
  };

  if (isExport) {
    runReport();
    return;
  }

  sharedModel.getSchoolCategories((categories) => {
    sharedModel.getSchoolOwnerships((ownerships) => {
      sharedModel.getRegistrationStructures((structures) => {
        sharedModel.getCertificates((certificates) => {
          sharedModel.getRegions(user, (regions) => {
            runReport(categories, ownerships, structures, certificates, regions);
          });
        });
      });
    });
  });
});

// Analytics / Pivot endpoint (no full dataset; returns grouped counts)
ripotiUsajiliRequestRouter.get("/ripoti-usajili-shule/analytics", isAuth, (req, res) => {
  const user = req.user;
  const input = { ...(req.body || {}), ...(req.query || {}) };
  const row_dim = String(input.row_dim || "region").trim();
  const col_dim = String(input.col_dim || "status").trim();
  const limit = Math.min(1000, Math.max(50, Number.parseInt(input.limit || "250", 10) || 250));

  const cacheKey = [
    "usajili",
    user?.id || "0",
    user?.sehemu || "null",
    user?.zone_id || "null",
    user?.district_code || "null",
    JSON.stringify({ ...input, row_dim, col_dim, limit }),
  ].join(":");

  const cached = getCache(cacheKey);
  if (cached) {
    return res.send({ ...cached, cached: true });
  }

  const { fromCount, where, params } = buildUsajiliBaseQuery({ user, input });

  const dims = {
    status: {
      key: "a.is_approved",
      label: `CASE WHEN a.is_approved=2 THEN 'Approved' WHEN a.is_approved=3 THEN 'Rejected' ELSE 'Other' END`,
    },
    verified: {
      key: "sr.is_verified",
      label: `CASE WHEN sr.is_verified=1 THEN 'Verified' ELSE 'Not Verified' END`,
    },
    category: {
      key: "e.school_category_id",
      label: "COALESCE(NULLIF(TRIM(sc.category), ''), CONCAT('Aina ', e.school_category_id))",
    },
    ownership: {
      key: "e.registry_type_id",
      label: "COALESCE(NULLIF(TRIM(rt.registry), ''), CONCAT('Umiliki ', e.registry_type_id))",
    },
    structure: {
      key: "e.registration_structure_id",
      label: "COALESCE(NULLIF(TRIM(rs.structure), ''), CONCAT('Muundo ', e.registration_structure_id))",
    },
    certificate: {
      key: "e.certificate_type_id",
      label: "COALESCE(NULLIF(TRIM(ct.certificate), ''), CONCAT('Ngazi ', e.certificate_type_id))",
    },
    stream: {
      key: "e.stream",
      label: "COALESCE(NULLIF(TRIM(CONCAT('Mkondo ', e.stream)), ''), 'Mkondo')",
    },
    specialization: {
      key: "e.school_specialization_id",
      label: "COALESCE(NULLIF(TRIM(sp.specialization), ''), CONCAT('Tahasusi ', e.school_specialization_id))",
    },
    language: {
      key: "e.language_id",
      label: "COALESCE(NULLIF(TRIM(l.language), ''), CONCAT('Lugha ', e.language_id))",
    },
    region: { key: "aav.region_code", label: "aav.region" },
    district: { key: "aav.district_code", label: "aav.district" },
    ward: { key: "aav.ward_code", label: "aav.ward" },
    street: { key: "aav.street_code", label: "aav.street" },
    zone: { key: "aav.zone_id", label: "aav.zone_name" },
  };

  const row = dims[row_dim] || dims.region;
  const col = dims[col_dim] || dims.status;

  const sql = `
    SELECT
      ${row.key} AS row_key,
      ${row.label} AS row_label,
      ${col.key} AS col_key,
      ${col.label} AS col_label,
      COUNT(*) AS total
    ${fromCount}
    ${where.join("\n")}
    GROUP BY row_key, row_label, col_key, col_label
    ORDER BY total DESC
    LIMIT ?
  `;

  sharedModel.paginate(
    sql,
    null,
    (error, data, numRows, timings) => {
      const payload = {
        error: error ? true : false,
        statusCode: error ? 306 : 300,
        row_dim: row_dim,
        col_dim: col_dim,
        data: error ? [] : (Array.isArray(data) ? data : []),
        timings: timings || null,
        message: error ? "Something went wrong." : "Analytics.",
      };
      setCache(cacheKey, payload);
      return res.send(payload);
    },
    [...params, limit]
  );
});

// Lookups for report filters (fast; avoids heavy report query)
ripotiUsajiliRequestRouter.get("/ripoti-usajili-shule/lookups", isAuth, (req, res) => {
  const user = req.user;
  sharedModel.getSchoolCategories((categories) => {
    sharedModel.getSchoolOwnerships((ownerships) => {
      sharedModel.getRegistrationStructures((structures) => {
        sharedModel.getCertificates((certificates) => {
          sharedModel.getLanguages((languages) => {
            sharedModel.getSchoolSpecialization((specializations) => {
              sharedModel.getRegions(user, (regions) => {
                return res.send({
                  error: false,
                  statusCode: 300,
                  categories,
                  ownerships,
                  structures,
                  certificates,
                  languages,
                  specializations,
                  regions,
                  message: "Lookups.",
                });
              });
            });
          });
        });
      });
    });
  });
});
ripotiUsajiliRequestRouter.post("/rekebisha-usajili-shule/:tracking_number",
  isAuth ,   
  auditMiddleware('school_verifications' , 'create' , 'Kurekebisha Taarifa'), 
  (req, res) => {
  const {description} = req.body
  const {id} = req.user
  const tracking_number = req.params.tracking_number
  const data = [];
        data.push(
          tracking_number,
          description,
          id,
          0,
          formatDate(new Date()),
          formatDate(new Date()),
        );
  schoolModel.ombiRekebishaShule(tracking_number, data, (success) => {
    res.send({
      statusCode: success ? 300 : 306,
      message: success
        ? "Ombi lako limewasilishwa"
        : "Imeshindikana kuwasilisha, Kuna tatizo!",
    });
   });
  });

ripotiUsajiliRequestRouter.post(
  "/thibitisha-usajili-shule/:tracking_number",
  isAuth,
  auditMiddleware('school_verifications' , 'update' , 'Kuthibitisha Taarifa'),
  (req, res) => {
    const tracking_number = req.params.tracking_number;
    schoolModel.verifySchool(tracking_number, (success) => {
      res.send({
        statusCode: success ? 300 : 306,
        message: success
          ? "Umefanikiwa kuthinitisha taarifa hizi."
          : "Imeshindikana kuthibitisha, Kuna tatizo!",
      });
    });
  }
);
module.exports = ripotiUsajiliRequestRouter;
