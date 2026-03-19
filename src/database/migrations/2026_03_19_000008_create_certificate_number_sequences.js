module.exports = {
  up: async (connection) => {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS school_registration_certificate_number_sequences (
        year INT UNSIGNED NOT NULL,
        last_seq INT UNSIGNED NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },
};

