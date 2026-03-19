require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const mysql = require("mysql2/promise");
const db = require("../../config/database");
const { isAuth, permission } = require("../../utils");

const certificateRouter = express.Router();

// Uses the same joins as barua letter data, but relaxes folio constraint and narrows to category 4 only.
// Eligibility (per business rule): applications.application_category_id=4, applications.is_approved=2, establishing_schools.registry_type_id<>3,
// and must have a school_registrations row (latest per establishing_school).
	const CERTIFICATE_DATA_SQL = `
	SELECT
	  a.id AS application_id,
	  a.establishing_school_id,
	  a.application_category_id,
	  a.tracking_number,
	  a.is_approved,
	  COALESCE(a.approved_at, a.updated_at, a.created_at) AS approved_at,
	  u.name AS signatory,
	  u.signature AS base64signature,
	  roles.description AS cheo,
	  e.id AS school_id,
	  e.file_number,
	  e.school_folio,
	  a.folio,
		  e.registry_type_id,
		  e.school_category_id,
		  e.stream,
		  ss.specialization AS school_specialization,
		  e.school_name,
	  sr.registration_number,
	  sr.registration_date,
	  sc.category,
	  d_current.ngazi AS council_ngazi,
	  d_current.LgaName AS council,
	  r_current.RegionName AS region,
	  UCASE(COALESCE(app.title, '')) AS address_title,
	  UCASE(
	    COALESCE(
	      NULLIF(TRIM(app.display_name), ''),
	      NULLIF(TRIM(CONCAT_WS(' ', pi.first_name, pi.middle_name, pi.last_name)), ''),
	      NULLIF(TRIM(ii.name), ''),
	      ''
	    )
		  ) AS address_name,
		  COALESCE(app.box, '') AS address_box,
		  d_addr.LgaName AS address_lga,
		  r_addr.RegionName AS address_region
	FROM applications a
	JOIN establishing_schools e ON e.id = a.establishing_school_id
	INNER JOIN (
	  SELECT sr1.*
	  FROM school_registrations sr1
	  INNER JOIN (
	    SELECT establishing_school_id, MAX(id) AS max_id
	    FROM school_registrations
	    GROUP BY establishing_school_id
	  ) latest_sr ON latest_sr.max_id = sr1.id
	) sr ON sr.establishing_school_id = e.id
	LEFT JOIN school_categories sc ON sc.id = e.school_category_id
	LEFT JOIN school_specializations ss ON ss.id = e.school_specialization_id
	LEFT JOIN wards w_current ON w_current.WardCode = e.ward_id
	LEFT JOIN districts d_current ON d_current.LgaCode = w_current.LgaCode
	LEFT JOIN regions r_current ON r_current.RegionCode = d_current.RegionCode
	INNER JOIN applicants app ON app.id = e.applicant_id
	LEFT JOIN personal_infos pi
	  ON pi.id = app.applicantable_id
	 AND (
	   LOWER(app.applicantable_type) LIKE '%personal_info%'
	   OR LOWER(app.applicantable_type) LIKE '%person_info%'
	 )
	LEFT JOIN institute_infos ii
	  ON ii.id = app.applicantable_id
	 AND LOWER(app.applicantable_type) LIKE '%institute_info%'
		LEFT JOIN districts d_addr ON d_addr.LgaCode = app.lga_box_location
		LEFT JOIN regions r_addr ON r_addr.RegionCode = d_addr.RegionCode
	LEFT JOIN staffs u ON u.id = COALESCE(a.approved_by, a.staff_id)
	LEFT JOIN roles roles ON roles.id = u.user_level
	WHERE a.tracking_number = ?
	  AND a.is_approved = 2
	  AND a.application_category_id = 4
	  AND (e.registry_type_id IS NULL OR e.registry_type_id <> 3)
	LIMIT 1
	`;

const padNumber = (n, width = 5) => String(Number(n) || 0).padStart(width, "0");

const randomCode = (bytes = 16) =>
  crypto
    .randomBytes(bytes)
    .toString("base64")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 24)
    .toUpperCase();

const ensureCertificatesTables = async () => {
  try {
    const [rows] = await db
      .promise()
      .query(
        `
          SELECT 1
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN ('school_registration_certificates','school_registration_certificate_number_sequences')
          LIMIT 1
        `,
      );
    const ok = Array.isArray(rows) && rows.length > 0;
    if (!ok) {
      return { ok: false, message: "DB haijasasishwa kwa vyeti. Tafadhali endesha migrations kisha jaribu tena." };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: "DB haijasasishwa kwa vyeti. Tafadhali endesha migrations kisha jaribu tena." };
  }
};

const toPositiveInt = (value, fallback) => {
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) && num > 0 ? num : fallback;
};

const toNullableInt = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) ? num : null;
};

const yearFromDate = (dateValue) => {
  try {
    const d = dateValue ? new Date(dateValue) : null;
    if (!d || Number.isNaN(d.getTime())) return null;
    return d.getFullYear();
  } catch (e) {
    return null;
  }
};

const resolveCertificateYear = (application) => {
  return (
    yearFromDate(application?.registration_date) ||
    yearFromDate(application?.approved_at) ||
    new Date().getFullYear()
  );
};

const ensureYearSequenceRow = async (connection, year) => {
  await connection.query(
    `INSERT INTO school_registration_certificate_number_sequences (year, last_seq)
     VALUES (?, 0)
     ON DUPLICATE KEY UPDATE year = year`,
    [year],
  );
};

const getNextSequencePreview = async (connection, year) => {
  await ensureYearSequenceRow(connection, year);
  const [rows] = await connection.query(
    `SELECT last_seq FROM school_registration_certificate_number_sequences WHERE year = ? LIMIT 1`,
    [year],
  );
  const lastSeq = Number(rows?.[0]?.last_seq || 0);
  return { year, next_seq: lastSeq + 1 };
};

const allocateSequence = async (connection, year, expectedSeq = null) => {
  await ensureYearSequenceRow(connection, year);
  const [rows] = await connection.query(
    `SELECT last_seq FROM school_registration_certificate_number_sequences WHERE year = ? LIMIT 1 FOR UPDATE`,
    [year],
  );
  const lastSeq = Number(rows?.[0]?.last_seq || 0);
  const nextSeq = lastSeq + 1;

  if (expectedSeq !== null && Number(expectedSeq) !== Number(nextSeq)) {
    return { ok: false, expected_seq: nextSeq, year };
  }

  await connection.query(
    `UPDATE school_registration_certificate_number_sequences SET last_seq = ? WHERE year = ?`,
    [nextSeq, year],
  );

  return { ok: true, year, seq: nextSeq };
};

const certificateNumberFor = (year, seq) => `${year}-${padNumber(seq, 5)}`;

const insertCertificateWithUniqueVerification = async (connection, values, maxAttempts = 5) => {
  let lastError = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const verificationCode = randomCode();
    try {
      const [r] = await connection.query(
        `INSERT INTO school_registration_certificates (application_id, school_id, certificate_number, verification_code, issued_by)
         VALUES (?, ?, ?, ?, ?)`,
        [values.application_id, values.school_id, values.certificate_number, verificationCode, values.issued_by],
      );
      return { ok: true, insertId: r?.insertId, verification_code: verificationCode };
    } catch (error) {
      lastError = error;
      if (error && error.code === "ER_DUP_ENTRY") {
        // Could be verification_code or certificate_number collision. Verification retries; certificate number handled by sequence.
        continue;
      }
      throw error;
    }
  }
  if (lastError) throw lastError;
  throw new Error("Failed to generate unique verification code");
};

const createTxConnection = async () => {
  return mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    timezone: process.env.TIMEZONE || "+03:00",
    multipleStatements: true,
  });
};

const fetchStaffDetails = async (staffIdValue) => {
  const staffId = Number(staffIdValue || 0);
  if (!staffId) return null;
  const [rows] = await db
    .promise()
    .query(
      `SELECT u.name AS signatory, u.signature AS base64signature, roles.description AS cheo
       FROM staffs u
       LEFT JOIN roles roles ON roles.id = u.user_level
       WHERE u.id = ?
       LIMIT 1`,
      [staffId],
    );
  const item = Array.isArray(rows) && rows.length ? rows[0] : null;
  if (!item) return null;
  return {
    signatory: item.signatory || null,
    base64signature: item.base64signature || null,
    cheo: item.cheo || null,
  };
};

const signatoryFromApplication = (application) => {
  const signatory = application?.signatory || null;
  const base64signature = application?.base64signature || null;
  const cheo = application?.cheo || null;
  const hasAny = Boolean(signatory || base64signature || cheo);
  return hasAny ? { signatory, base64signature, cheo } : null;
};

certificateRouter.get(
  "/school-certificates/:tracking_number",
  isAuth,
  permission("view-letters"),
  async (req, res, next) => {
    try {
      const trackingNumber = String(req.params.tracking_number || "").trim();
      if (!trackingNumber) {
        return res.status(400).send({ success: false, message: "tracking_number is required" });
      }

      const table = await ensureCertificatesTables();
      if (!table.ok) {
        return res.status(409).send({ success: false, message: table.message });
      }

      const [rows] = await db.promise().query(CERTIFICATE_DATA_SQL, [trackingNumber]);
      const application = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (!application) {
        return res.status(404).send({ success: false, message: "Certificate application not found (must be approved and category 4)." });
      }

      const applicationId = Number(application.application_id || 0);

      const [existing] = await db
        .promise()
        .query(
          `SELECT id, application_id, school_id, certificate_number, verification_code, issued_at, issued_by, is_revoked, revoked_at, revoked_by
           FROM school_registration_certificates
           WHERE application_id = ?
           LIMIT 1`,
          [applicationId],
        );

      const certificate = Array.isArray(existing) && existing.length ? existing[0] : null;
      if (!certificate) {
        return res.status(404).send({ success: false, message: "Cheti bado hakija-issue kwa ombi hili." });
      }

      const signFromApp = signatoryFromApplication(application);
      const fallbackSign = !signFromApp ? await fetchStaffDetails(certificate.issued_by) : null;
      const certificateWithSign = signFromApp ? { ...certificate, ...signFromApp } : fallbackSign ? { ...certificate, ...fallbackSign } : certificate;

      return res.send({
        success: true,
        data: {
          application,
          certificate: certificateWithSign,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

certificateRouter.get(
  "/school-certificates/:tracking_number/issue-preview",
  isAuth,
  permission("view-letters"),
  async (req, res, next) => {
    try {
      const trackingNumber = String(req.params.tracking_number || "").trim();
      if (!trackingNumber) {
        return res.status(400).send({ success: false, message: "tracking_number is required" });
      }

      const table = await ensureCertificatesTables();
      if (!table.ok) {
        return res.status(409).send({ success: false, message: table.message });
      }

      const [rows] = await db.promise().query(CERTIFICATE_DATA_SQL, [trackingNumber]);
      const application = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (!application) {
        return res.status(404).send({ success: false, message: "Ombi halipatikani (lazima liwe limekubaliwa na ni Usajili)." });
      }
      if (!String(application?.registration_number || "").trim()) {
        return res.status(409).send({ success: false, message: "Huwezi kutoa cheti: Shule haina namba ya usajili (registration_number)." });
      }

      const year = resolveCertificateYear(application);
      const { next_seq } = await getNextSequencePreview(db.promise(), year);

      return res.send({
        success: true,
        data: {
          tracking_number: application.tracking_number,
          school_name: application.school_name,
          registration_number: application.registration_number,
          year,
          next_seq,
          certificate_number: certificateNumberFor(year, next_seq),
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

certificateRouter.post(
  "/school-certificates/:tracking_number/issue",
  isAuth,
  permission("view-letters"),
  async (req, res, next) => {
    try {
      const trackingNumber = String(req.params.tracking_number || "").trim();
      if (!trackingNumber) {
        return res.status(400).send({ success: false, message: "tracking_number is required" });
      }

      const table = await ensureCertificatesTables();
      if (!table.ok) {
        return res.status(409).send({ success: false, message: table.message });
      }

      const [rows] = await db.promise().query(CERTIFICATE_DATA_SQL, [trackingNumber]);
      const application = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (!application) {
        return res.status(404).send({ success: false, message: "Ombi halipatikani (lazima liwe limekubaliwa na ni Usajili)." });
      }
      if (!String(application?.registration_number || "").trim()) {
        return res.status(409).send({ success: false, message: "Huwezi kutoa cheti: Shule haina namba ya usajili (registration_number)." });
      }

      const applicationId = Number(application.application_id || 0);
      const schoolId = Number(application.school_id || 0);
      const year = resolveCertificateYear(application);
      const expectedYear = toNullableInt(req.body?.expected_year);
      const expectedSeq = toNullableInt(req.body?.expected_seq);
      const expectedSeqForYear =
        expectedYear !== null && Number(expectedYear) === Number(year) ? expectedSeq : null;

      const [existing] = await db
        .promise()
        .query(
          `SELECT id, application_id, school_id, certificate_number, verification_code, issued_at, issued_by, is_revoked, revoked_at, revoked_by
           FROM school_registration_certificates
           WHERE application_id = ?
           LIMIT 1`,
          [applicationId],
        );

      let certificate = Array.isArray(existing) && existing.length ? existing[0] : null;
      if (!certificate) {
        const issuedBy = Number(req?.user?.id || 0) || null;
        const connection = await createTxConnection();
        try {
          await connection.beginTransaction();

          const allocation = await allocateSequence(connection, year, expectedSeqForYear);
          if (!allocation.ok) {
            await connection.rollback();
            return res.status(409).send({
              success: false,
              message: "Namba ya cheti imebadilika. Tafadhali jaribu tena.",
              data: {
                year,
                next_seq: allocation.expected_seq,
                certificate_number: certificateNumberFor(year, allocation.expected_seq),
              },
            });
          }

          const certificateNumber = certificateNumberFor(allocation.year, allocation.seq);

          const inserted = await insertCertificateWithUniqueVerification(connection, {
            application_id: applicationId,
            school_id: schoolId,
            certificate_number: certificateNumber,
            issued_by: issuedBy,
          });

          await connection.commit();

          certificate = {
            id: inserted.insertId,
            application_id: applicationId,
            school_id: schoolId,
            certificate_number: certificateNumber,
            verification_code: inserted.verification_code,
            issued_at: new Date(),
            issued_by: issuedBy,
            is_revoked: 0,
            revoked_at: null,
            revoked_by: null,
          };
        } catch (error) {
          try { await connection.rollback(); } catch (e) {}
          throw error;
        } finally {
          try { await connection.end(); } catch (e) {}
        }
      }

      const signFromApp = signatoryFromApplication(application);
      const fallbackSign = !signFromApp ? await fetchStaffDetails(certificate.issued_by) : null;
      const certificateWithSign = signFromApp ? { ...certificate, ...signFromApp } : fallbackSign ? { ...certificate, ...fallbackSign } : certificate;

      return res.send({ success: true, data: { application, certificate: certificateWithSign } });
    } catch (error) {
      return next(error);
    }
  },
);

certificateRouter.get(
  "/school-certificates",
  isAuth,
  permission("view-letters"),
  async (req, res, next) => {
    try {
      const table = await ensureCertificatesTables();
      if (!table.ok) {
        return res.status(409).send({ success: false, message: table.message });
      }

      const issued = String(req.query.issued || "").trim() === "1";
      const page = toPositiveInt(req.query.page, 1);
      const perPage = toPositiveInt(req.query.per_page, 15);
      const search = String(req.query.search || "").trim();
      const offset = (page - 1) * perPage;

	      const whereParts = [
	        "a.is_approved = 2",
	        "a.application_category_id = 4",
	        "(e.registry_type_id IS NULL OR e.registry_type_id <> 3)",
	        issued ? "c.id IS NOT NULL" : "c.id IS NULL",
	      ];

      const params = [];
	      if (search) {
	        whereParts.push(
	          "(a.tracking_number LIKE ? OR e.school_name LIKE ? OR sr.registration_number LIKE ? OR c.certificate_number LIKE ? OR app.display_name LIKE ? OR ii.name LIKE ? OR CONCAT_WS(' ', pi.first_name, pi.middle_name, pi.last_name) LIKE ?)"
	        );
	        const q = `%${search}%`;
	        params.push(q, q, q, q, q, q, q);
	      }

      const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
      const orderSql = issued ? "ORDER BY c.issued_at DESC, c.id DESC" : "ORDER BY a.approved_at DESC, a.id DESC";

		      const countSql = `
		        SELECT COUNT(*) AS total
		        FROM applications a
		        JOIN establishing_schools e ON e.id = a.establishing_school_id
		        INNER JOIN applicants app ON app.id = e.applicant_id
		        LEFT JOIN personal_infos pi
		          ON pi.id = app.applicantable_id
		         AND (
		           LOWER(app.applicantable_type) LIKE '%personal_info%'
		           OR LOWER(app.applicantable_type) LIKE '%person_info%'
		         )
		        LEFT JOIN institute_infos ii
		          ON ii.id = app.applicantable_id
		         AND LOWER(app.applicantable_type) LIKE '%institute_info%'
		        INNER JOIN (
		          SELECT sr1.*
		          FROM school_registrations sr1
	          INNER JOIN (
	            SELECT establishing_school_id, MAX(id) AS max_id
	            FROM school_registrations
	            GROUP BY establishing_school_id
	          ) latest_sr ON latest_sr.max_id = sr1.id
	        ) sr ON sr.establishing_school_id = e.id
	        LEFT JOIN school_registration_certificates c ON c.application_id = a.id
	        ${whereSql}
	      `;

      const [countRows] = await db.promise().query(countSql, params);
      const total = Number(countRows?.[0]?.total || 0);
      const lastPage = Math.max(1, Math.ceil(total / perPage));

		      const listSql = `
		        SELECT
		          a.id AS application_id,
		          a.tracking_number,
		          a.tracking_number AS application_tracking_number,
		          COALESCE(a.approved_at, a.updated_at, a.created_at) AS approved_at,
		          a.folio,
		          e.id AS school_id,
		          e.school_name,
		          e.stream,
		          ss.specialization AS school_specialization,
		          e.file_number,
		          e.school_folio,
		          UCASE(
		            COALESCE(
		              NULLIF(TRIM(app.display_name), ''),
		              NULLIF(TRIM(CONCAT_WS(' ', pi.first_name, pi.middle_name, pi.last_name)), ''),
		              NULLIF(TRIM(ii.name), ''),
		              ''
		            )
		          ) AS owner_name,
		          COALESCE(app.box, '') AS owner_box,
		          d_addr.LgaName AS owner_lga,
		          r_addr.RegionName AS owner_region,
		          d_current.ngazi AS council_ngazi,
		          d_current.LgaName AS council,
		          sr.registration_number,
		          sr.registration_date,
		          c.id AS certificate_id,
	          c.certificate_number,
	          c.issued_at,
	          c.issued_by,
	          issued_staff.name AS issued_by_name,
	          c.is_revoked,
	          c.revoked_at,
	          c.revoked_by,
	          revoked_staff.name AS revoked_by_name
		        FROM applications a
		        JOIN establishing_schools e ON e.id = a.establishing_school_id
		        LEFT JOIN school_specializations ss ON ss.id = e.school_specialization_id
		        INNER JOIN applicants app ON app.id = e.applicant_id
		        LEFT JOIN personal_infos pi
		          ON pi.id = app.applicantable_id
		         AND (
		           LOWER(app.applicantable_type) LIKE '%personal_info%'
		           OR LOWER(app.applicantable_type) LIKE '%person_info%'
		         )
		        LEFT JOIN institute_infos ii
		          ON ii.id = app.applicantable_id
		         AND LOWER(app.applicantable_type) LIKE '%institute_info%'
		        LEFT JOIN districts d_addr ON d_addr.LgaCode = app.lga_box_location
		        LEFT JOIN regions r_addr ON r_addr.RegionCode = d_addr.RegionCode
		        LEFT JOIN wards w_current ON w_current.WardCode = e.ward_id
		        LEFT JOIN districts d_current ON d_current.LgaCode = w_current.LgaCode
		        INNER JOIN (
		          SELECT sr1.*
	          FROM school_registrations sr1
	          INNER JOIN (
	            SELECT establishing_school_id, MAX(id) AS max_id
	            FROM school_registrations
	            GROUP BY establishing_school_id
	          ) latest_sr ON latest_sr.max_id = sr1.id
	        ) sr ON sr.establishing_school_id = e.id
	        LEFT JOIN school_registration_certificates c ON c.application_id = a.id
	        LEFT JOIN staffs issued_staff ON issued_staff.id = c.issued_by
	        LEFT JOIN staffs revoked_staff ON revoked_staff.id = c.revoked_by
	        ${whereSql}
	        ${orderSql}
	        LIMIT ?
	        OFFSET ?
	      `;

      const [rows] = await db.promise().query(listSql, [...params, perPage, offset]);

      return res.send({
        success: true,
        data: {
          data: rows || [],
          pagination: {
            current_page: page,
            per_page: perPage,
            total,
            last_page: lastPage,
          },
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

certificateRouter.get(
  "/school-certificates/verify/:verification_code",
  isAuth,
  permission("view-letters"),
  async (req, res, next) => {
    try {
      const code = String(req.params.verification_code || "").trim().toUpperCase();
      if (!code) return res.status(400).send({ success: false, message: "verification_code is required" });

      const table = await ensureCertificatesTable();
      if (!table.ok) {
        return res.status(409).send({ success: false, message: table.message });
      }

      let rows = [];
      try {
        const [r] = await db
          .promise()
          .query(
            `SELECT c.id, c.certificate_number, c.verification_code, c.issued_at, c.is_revoked, c.revoked_at,
                    a.tracking_number, e.school_name, sr.registration_number
             FROM school_registration_certificates c
             JOIN applications a ON a.id = c.application_id
             JOIN establishing_schools e ON e.id = c.school_id
             LEFT JOIN (
               SELECT sr1.*
               FROM school_registrations sr1
               INNER JOIN (
                 SELECT establishing_school_id, MAX(id) AS max_id
                 FROM school_registrations
                 GROUP BY establishing_school_id
               ) latest_sr ON latest_sr.max_id = sr1.id
             ) sr ON sr.establishing_school_id = e.id
             WHERE c.verification_code = ?
             LIMIT 1`,
            [code],
          );
        rows = r;
      } catch (error) {
        throw error;
      }

      const item = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (!item) return res.status(404).send({ success: false, message: "Certificate not found." });
      return res.send({ success: true, data: item });
    } catch (error) {
      return next(error);
    }
  },
);

module.exports = certificateRouter;
