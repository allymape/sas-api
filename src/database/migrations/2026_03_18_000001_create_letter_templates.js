module.exports = {
  up: async (connection) => {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS letter_templates (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        template_key VARCHAR(80) NOT NULL,
        name VARCHAR(150) NOT NULL,
        application_category_id INT NULL,
        letter_type VARCHAR(20) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_by INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_letter_templates_template_key (template_key),
        KEY idx_letter_templates_category (application_category_id),
        KEY idx_letter_templates_type (letter_type),
        KEY idx_letter_templates_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS letter_template_versions (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        letter_template_id INT UNSIGNED NOT NULL,
        version INT UNSIGNED NOT NULL,
        title_template TEXT NOT NULL,
        body_template LONGTEXT NOT NULL,
        created_by INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_letter_template_versions (letter_template_id, version),
        KEY idx_letter_template_versions_template (letter_template_id),
        CONSTRAINT fk_letter_template_versions_template
          FOREIGN KEY (letter_template_id) REFERENCES letter_templates (id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },
};

