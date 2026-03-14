module.exports = {
  async up(connection) {
    await connection.query(`
      INSERT INTO action_types (
        code,
        name,
        description,
        created_by,
        updated_by,
        created_at,
        updated_at,
        deleted_at
      )
      VALUES
        ('REVIEW', 'Review', 'Submit recommendation for current workflow step.', NULL, NULL, NOW(), NOW(), NULL),
        ('ASSIGN', 'Assign', 'Assign request to a staff member in the current unit.', NULL, NULL, NOW(), NOW(), NULL),
        ('FORWARD', 'Forward', 'Forward request to the next workflow step.', NULL, NULL, NOW(), NOW(), NULL),
        ('APPROVE', 'Approve', 'Approve the request in workflow.', NULL, NULL, NOW(), NOW(), NULL),
        ('REJECT', 'Reject', 'Reject the request in workflow.', NULL, NULL, NOW(), NOW(), NULL),
        ('RETURN', 'Return', 'Send request back to a previous Unit.', NULL, NULL, NOW(), NOW(), NULL),
        ('RETURN_BACK', 'Return Back', 'Return request back to applicant.', NULL, NULL, NOW(), NOW(), NULL)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        deleted_at = NULL,
        updated_at = NOW();
    `);
  },
};
