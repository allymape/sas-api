module.exports = {
  up: async (connection) => {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS school_registration_certificates (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        application_id INT UNSIGNED NOT NULL,
        school_id INT UNSIGNED NOT NULL,
        certificate_number VARCHAR(32) NULL,
        verification_code VARCHAR(64) NOT NULL,
        issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        issued_by INT NULL,
        is_revoked TINYINT(1) NOT NULL DEFAULT 0,
        revoked_at TIMESTAMP NULL,
        revoked_by INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_school_registration_certificates_application (application_id),
        UNIQUE KEY uq_school_registration_certificates_number (certificate_number),
        UNIQUE KEY uq_school_registration_certificates_verification (verification_code),
        KEY idx_school_registration_certificates_school (school_id),
        KEY idx_school_registration_certificates_issued_at (issued_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },
};

