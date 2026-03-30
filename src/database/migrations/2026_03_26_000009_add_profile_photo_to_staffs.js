module.exports = {
  up: async (connection) => {
    const [columns] = await connection.query(`SHOW COLUMNS FROM staffs LIKE 'profile_photo'`);
    if (Array.isArray(columns) && columns.length > 0) {
      return;
    }

    await connection.query(`
      ALTER TABLE staffs
      ADD COLUMN profile_photo LONGTEXT NULL AFTER signature
    `);
  },
};
