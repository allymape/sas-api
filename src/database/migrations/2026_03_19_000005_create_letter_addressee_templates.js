module.exports = {
  up: async (connection) => {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS letter_addressee_templates (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        template_key VARCHAR(80) NOT NULL,
        name VARCHAR(150) NOT NULL,
        address_kind VARCHAR(32) NULL,
        addressee_template TEXT NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_by INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_letter_addressee_templates_key (template_key),
        KEY idx_letter_addressee_templates_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Add addressee_template_id to versions table (safe for re-runs).
    const [rows] = await connection.query(
      `
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'letter_template_versions'
          AND COLUMN_NAME = 'addressee_template_id'
        LIMIT 1
      `,
    );
    const exists = Array.isArray(rows) && rows.length > 0;
    if (!exists) {
      await connection.query(`
        ALTER TABLE letter_template_versions
          ADD COLUMN addressee_template_id INT UNSIGNED NULL AFTER addressee_template,
          ADD KEY idx_letter_template_versions_addressee_template_id (addressee_template_id)
      `);
    }
  },
};

