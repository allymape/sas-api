const db = require("../config/database");
const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildTrackOfficeFilter = (user = {}) => {
  const office = toNumber(user?.office, 0);
  const section = String(user?.sehemu || "").trim().toLowerCase();
  const zoneId = toNumber(user?.zone_id, 0);
  const districtCode = String(user?.district_code || "").trim();

  if (office === 1 || section === "hq") {
    return { sql: "", params: [] };
  }

  if (office === 2 || section === "k1") {
    return zoneId > 0
      ? { sql: " AND r.zone_id = ?", params: [zoneId] }
      : { sql: " AND 1 = 0", params: [] };
  }

  if (office === 3 || section === "w1") {
    return districtCode
      ? { sql: " AND d.LgaCode = ?", params: [districtCode] }
      : { sql: " AND 1 = 0", params: [] };
  }

  return { sql: "", params: [] };
};

const currentHolderSql = `
  CASE
    WHEN UPPER(COALESCE(assigned_role.name, '')) <> '' AND workflow_role.rank_level = 1
      THEN CONCAT(UPPER(assigned_role.name), ' - HQ')
    WHEN UPPER(COALESCE(assigned_role.name, '')) <> '' AND workflow_role.rank_level = 2
      THEN CONCAT(UPPER(assigned_role.name), ' - ', COALESCE(z.zone_name, '-'))
    WHEN UPPER(COALESCE(assigned_role.name, '')) <> '' AND workflow_role.rank_level = 3
      THEN CONCAT(UPPER(assigned_role.name), ' - ', COALESCE(d.LgaName, '-'))
    WHEN UPPER(COALESCE(assigned_role.name, '')) <> ''
      THEN UPPER(assigned_role.name)
    WHEN UPPER(COALESCE(workflow_role.rank_name, '')) <> '' AND workflow_role.rank_level = 1
      THEN CONCAT(UPPER(workflow_role.rank_name), ' - HQ')
    WHEN UPPER(COALESCE(workflow_role.rank_name, '')) <> '' AND workflow_role.rank_level = 2
      THEN CONCAT(UPPER(workflow_role.rank_name), ' - ', COALESCE(z.zone_name, '-'))
    WHEN UPPER(COALESCE(workflow_role.rank_name, '')) <> '' AND workflow_role.rank_level = 3
      THEN CONCAT(UPPER(workflow_role.rank_name), ' - ', COALESCE(d.LgaName, '-'))
    WHEN UPPER(COALESCE(workflow_role.rank_name, '')) <> ''
      THEN UPPER(workflow_role.rank_name)
    ELSE '-'
  END
`;

module.exports = {
  getAllApplications: (offset, perPage, searchValue, schoolId, filter, user, callback) => {
    const safeOffset = Math.max(0, toNumber(offset, 0));
    const safePerPage = Math.max(0, toNumber(perPage, 10));
    const queryParams = [];
    let searchQuery = "";

    if (searchValue) {
      searchQuery += ` AND (
        app.tracking_number LIKE ?
        OR e.school_name LIKE ?
        OR ac.app_name LIKE ?
        OR sc.category LIKE ?
        OR r.RegionName LIKE ?
        OR d.LgaName LIKE ?
        OR w.WardName LIKE ?
        OR st.StreetName LIKE ?
        OR u.name LIKE ?
        OR assigned_role.name LIKE ?
      )`;
      const likeValue = `%${searchValue}%`;
      queryParams.push(
        likeValue,
        likeValue,
        likeValue,
        likeValue,
        likeValue,
        likeValue,
        likeValue,
        likeValue,
        likeValue,
        likeValue,
      );
    }

    if (schoolId) {
      searchQuery += " AND app.establishing_school_id = ?";
      queryParams.push(toNumber(schoolId));
    }

    const normalizedFilter = String(filter || "").trim().toLowerCase();
    if (normalizedFilter === "overdue") {
      searchQuery += `
        AND COALESCE(workflow_role.overdue, 0) > 0
        AND DATEDIFF(CURDATE(), DATE(COALESCE(ap.started_at, app.created_at))) > COALESCE(workflow_role.overdue, 0)
      `;
    } else if (normalizedFilter === "submitted") {
      searchQuery += " AND app.is_approved = 0";
    } else if (normalizedFilter === "in_progress") {
      searchQuery += " AND app.is_approved = 1";
    }

    const officeFilter = buildTrackOfficeFilter(user);
    queryParams.push(...officeFilter.params);

    const latestProcessSql = `
      SELECT ap1.*
      FROM application_processes ap1
      INNER JOIN (
        SELECT tracking_number, MAX(id) AS latest_process_id
        FROM application_processes
        WHERE LOWER(TRIM(COALESCE(status, ''))) IN ('pending', 'in-progress')
        GROUP BY tracking_number
      ) latest ON latest.latest_process_id = ap1.id
    `;

    const baseSql = `
      FROM applications app
      LEFT JOIN application_categories ac ON ac.id = app.application_category_id
      LEFT JOIN users u ON u.id = app.user_id
      LEFT JOIN payment_statuses p ON p.id = app.payment_status_id
      LEFT JOIN registry_types rt ON rt.id = app.registry_type_id
      LEFT JOIN (${latestProcessSql}) ap ON ap.tracking_number = app.tracking_number
      LEFT JOIN workflows wf ON wf.id = ap.workflow_id
      LEFT JOIN vyeo workflow_role ON workflow_role.id = wf.unit_id
      LEFT JOIN staffs assigned_staff ON assigned_staff.id = ap.assigned_to
      LEFT JOIN roles assigned_role ON assigned_role.id = assigned_staff.user_level
      LEFT JOIN establishing_schools e
        ON e.id = app.establishing_school_id
        OR e.tracking_number = app.tracking_number
      LEFT JOIN school_categories sc ON sc.id = e.school_category_id
      LEFT JOIN streets st ON st.StreetCode = e.village_id
      LEFT JOIN wards w ON w.WardCode = COALESCE(e.ward_id, st.WardCode)
      LEFT JOIN districts d ON d.LgaCode = w.LgaCode
      LEFT JOIN regions r ON r.RegionCode = d.RegionCode
      LEFT JOIN zones z ON z.id = r.zone_id
      WHERE app.is_approved IN (0, 1)
      ${officeFilter.sql}
      ${searchQuery}
    `;

    const selectSql = `
      SELECT
        app.id,
        app.tracking_number,
        ac.app_name AS application_category,
        UPPER(COALESCE(u.name, '')) AS applicant_name,
        app.created_at AS application_created_at,
        COALESCE(ap.started_at, app.created_at) AS processing_started_at,
        UPPER(COALESCE(e.school_name, '')) AS school_name,
        COALESCE(sc.category, '-') AS category,
        COALESCE(rt.registry, '-') AS registry,
        COALESCE(r.RegionName, '-') AS region_name,
        COALESCE(d.LgaName, '-') AS district_name,
        COALESCE(w.WardName, '-') AS ward_name,
        COALESCE(st.StreetName, '-') AS street_name,
        UPPER(COALESCE(z.zone_name, '-')) AS zone_name,
        app.is_approved AS status,
        COALESCE(p.status, '-') AS payment_status,
        app.payment_status_id,
        ${currentHolderSql} AS current_holder,
        COALESCE(ap.status, IF(app.is_approved = 1, 'In-progress', 'Pending')) AS process_status,
        COALESCE(workflow_role.overdue, 0) AS overdue_days,
        UPPER(COALESCE(assigned_role.name, workflow_role.rank_name, '')) AS title,
        COALESCE(workflow_role.rank_level, 3) AS ngazi
      ${baseSql}
      ORDER BY COALESCE(ap.started_at, app.created_at) DESC, app.id DESC
      ${safePerPage > 0 ? "LIMIT ?, ?" : ""}
    `;

    const selectParams = safePerPage > 0 ? queryParams.concat([safeOffset, safePerPage]) : queryParams;

    db.query(selectSql, selectParams, (error, applications) => {
      if (error) {
        console.log(error);
        return callback(error, [], 0, null);
      }

      db.query(
        `
          SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN app.is_approved = 0 THEN 1 ELSE 0 END) AS submitted_total,
            SUM(CASE WHEN app.is_approved = 1 THEN 1 ELSE 0 END) AS in_progress_total,
            SUM(
              CASE
                WHEN COALESCE(workflow_role.overdue, 0) > 0
                  AND DATEDIFF(CURDATE(), DATE(COALESCE(ap.started_at, app.created_at))) > COALESCE(workflow_role.overdue, 0)
                THEN 1
                ELSE 0
              END
            ) AS overdue_total
          ${baseSql}
        `,
        queryParams,
        (summaryError, summaryRows) => {
          if (summaryError) {
            console.log(summaryError);
            return callback(summaryError, [], 0, null);
          }

          const summary = {
            total: toNumber(summaryRows?.[0]?.total, 0),
            submitted_total: toNumber(summaryRows?.[0]?.submitted_total, 0),
            in_progress_total: toNumber(summaryRows?.[0]?.in_progress_total, 0),
            overdue_total: toNumber(summaryRows?.[0]?.overdue_total, 0),
          };

          return callback(null, applications, summary.total, summary);
        },
      );
    });
  },

  getMaoni: (trackingNumber, callback) => {
    db.query(
      `
        SELECT *
        FROM maoni
        WHERE tacking_number = ?
      `,
      [trackingNumber],
      (error, comments) => {
        if (error) console.log(error);
        callback(!error, comments);
      },
    );
  },
};
