module.exports = {
  up: async (connection) => {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'letter_template_versions'
         AND COLUMN_NAME IN ('reference_template','date_template','addressee_template')`
    );
    const existing = new Set((rows || []).map((r) => r.COLUMN_NAME));

    const alters = [];
    if (!existing.has("reference_template")) {
      alters.push("ADD COLUMN reference_template TEXT NULL AFTER version");
    }
    if (!existing.has("date_template")) {
      alters.push("ADD COLUMN date_template TEXT NULL AFTER reference_template");
    }
    if (!existing.has("addressee_template")) {
      alters.push("ADD COLUMN addressee_template LONGTEXT NULL AFTER body_template");
    }

    if (!alters.length) return;

    await connection.query(`ALTER TABLE letter_template_versions ${alters.join(", ")};`);
  },
};
