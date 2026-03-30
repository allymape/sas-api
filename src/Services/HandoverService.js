const db = require("../../config/database");

const STATUS = Object.freeze({
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  ACTIVE: "active",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  RECLAIMED: "reclaimed",
  EXPIRED: "expired",
});

const SCOPE = Object.freeze({
  TASKS_ONLY: "tasks_only",
  FULL_ROLE: "full_role",
});

const OWNER_LOCK_MESSAGE =
  "You currently have an active handover and cannot perform workflow actions until the handover ends or is reclaimed.";

const TERMINAL_STATUSES = new Set([
  STATUS.REJECTED,
  STATUS.CANCELLED,
  STATUS.RECLAIMED,
  STATUS.EXPIRED,
]);

const ACTIONS = Object.freeze({
  CREATED: "created",
  SUBMITTED: "submitted",
  UPDATED: "updated",
  APPROVED: "approved",
  ACTIVATED: "activated",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  RECLAIMED: "reclaimed",
  EXPIRED: "expired",
  TASK_ACTION: "task_action_performed_under_handover",
});

const WORKFLOW_ACTION_REGEXES = [
  /\/tuma-/i,
  /\/workflow/i,
  /\/applications\/[^/]+\/(advance|start|comment)$/i,
  /\/approve/i,
  /\/reject/i,
  /\/assign/i,
  /\/forward/i,
  /\/process/i,
];

const HANDOVER_MANAGEMENT_REGEXES = [
  /\/handover/i,
  /\/handovers/i,
  /\/my-active-handover/i,
  /\/stop-handover/i,
];

const toInt = (value, fallback = null) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeScope = (scopeType) => {
  const scope = String(scopeType || "").trim().toLowerCase();
  if (scope === SCOPE.FULL_ROLE) return SCOPE.FULL_ROLE;
  return SCOPE.TASKS_ONLY;
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const uniqueStrings = (items = []) => {
  const normalized = [];
  const seen = new Set();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const value = String(item || "").trim();
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push(value);
  });

  return normalized;
};

const uniqueInts = (items = []) => {
  const out = [];
  const seen = new Set();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const value = toInt(item, null);
    if (!value || value <= 0 || seen.has(value)) return;
    seen.add(value);
    out.push(value);
  });
  return out;
};

class HandoverService {
  static get STATUS() {
    return STATUS;
  }

  static get SCOPE() {
    return SCOPE;
  }

  static get OWNER_LOCK_MESSAGE() {
    return OWNER_LOCK_MESSAGE;
  }

  static isHighAuthorityUser(user = {}) {
    const role = String(user?.jukumu || user?.roleName || "").trim().toLowerCase();
    const title = String(user?.cheo || "").trim().toLowerCase();
    const combined = `${role} ${title}`;

    return [
      "admin",
      "super admin",
      "super-admin",
      "director",
      "head",
      "hod",
      "chief",
      "commissioner",
      "minister",
      "secretary",
    ].some((keyword) => combined.includes(keyword));
  }

  static shouldRequireApprovalForRequest(payload = {}) {
    const scopeType = normalizeScope(payload.scopeType);
    if (scopeType === SCOPE.FULL_ROLE) return true;

    if (this.isHighAuthorityUser(payload.user || {})) return true;

    const autoApproveTasksOnlyEnabled = Boolean(payload.autoApproveTasksOnlyEnabled);
    if (scopeType === SCOPE.TASKS_ONLY && autoApproveTasksOnlyEnabled) return false;

    return true;
  }

  static validateDateWindow(startAt, endAt) {
    const parsedStartAt = toDate(startAt);
    const parsedEndAt = toDate(endAt);

    if (!parsedStartAt || !parsedEndAt) {
      return {
        valid: false,
        message: "Invalid handover start/end date.",
      };
    }

    if (parsedStartAt >= parsedEndAt) {
      return {
        valid: false,
        message: "Handover start_at must be earlier than end_at.",
      };
    }

    return {
      valid: true,
      startAt: parsedStartAt,
      endAt: parsedEndAt,
    };
  }

  static isWorkflowActionRequest(req = {}) {
    const method = String(req?.method || "GET").toUpperCase();
    if (["GET", "HEAD", "OPTIONS"].includes(method)) return false;

    const path = String(req?.originalUrl || req?.url || "").split("?")[0];

    if (HANDOVER_MANAGEMENT_REGEXES.some((regex) => regex.test(path))) {
      return false;
    }

    return WORKFLOW_ACTION_REGEXES.some((regex) => regex.test(path));
  }

  static shouldBlockOwnerWorkflowAction(req = {}, user = {}, requiredPermission = "") {
    if (!user?.has_active_outgoing_handover) return false;

    const permission = String(requiredPermission || "").trim().toLowerCase();
    if (permission && !permission.startsWith("view-") && /(assign|approve|reject|forward|process|workflow)/i.test(permission)) {
      return true;
    }

    return this.isWorkflowActionRequest(req);
  }

  static ensureActorCanProcessWorkflow(req = {}, user = {}) {
    if (this.shouldBlockOwnerWorkflowAction(req, user)) {
      const error = new Error(this.OWNER_LOCK_MESSAGE);
      error.statusCode = 423;
      throw error;
    }
  }

  static parseLegacyDateRangeInput(rawDates = "") {
    const text = String(rawDates || "").trim();
    if (!text) return { startAt: null, endAt: null };

    const parts = text.split(/\s+to\s+/i).map((item) => item.trim()).filter(Boolean);
    if (!parts.length) return { startAt: null, endAt: null };

    const startAt = toDate(parts[0]);
    const endBase = toDate(parts[1] || parts[0]);
    if (!startAt || !endBase) return { startAt: null, endAt: null };

    const endAt = new Date(endBase);
    if (!parts[1]) {
      endAt.setHours(23, 59, 59, 999);
    } else if (endAt.getHours() === 0 && endAt.getMinutes() === 0 && endAt.getSeconds() === 0) {
      endAt.setHours(23, 59, 59, 999);
    }

    return { startAt, endAt };
  }

  static async createAudit(conn, payload = {}) {
    const {
      handoverId,
      userId = null,
      action,
      description = null,
      metadata = null,
      createdAt = new Date(),
      updatedAt = new Date(),
    } = payload;

    if (!handoverId || !action) return;

    await conn.query(
      `INSERT INTO handover_audits (
        handover_id,
        user_id,
        action,
        description,
        metadata,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(handoverId),
        userId ? Number(userId) : null,
        String(action),
        description ? String(description) : null,
        metadata ? JSON.stringify(metadata) : null,
        createdAt,
        updatedAt,
      ],
    );
  }

  static async getHandoverById(conn, handoverId, lock = false) {
    const sql = `SELECT * FROM handovers WHERE id = ? LIMIT 1 ${lock ? "FOR UPDATE" : ""}`;
    const [rows] = await conn.query(sql, [Number(handoverId)]);
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }

  static async assertNoOverlap(conn, payload = {}) {
    const {
      fromUserId,
      startAt,
      endAt,
      excludeHandoverId = null,
      statuses = [STATUS.PENDING_APPROVAL, STATUS.APPROVED, STATUS.ACTIVE],
    } = payload;

    if (!fromUserId || !startAt || !endAt) return;

    const statusPlaceholders = statuses.map(() => "?").join(", ");
    const params = [
      Number(fromUserId),
      ...statuses,
      endAt,
      startAt,
    ];

    let sql = `SELECT id
               FROM handovers
               WHERE from_user_id = ?
                 AND status IN (${statusPlaceholders})
                 AND start_at < ?
                 AND end_at > ?`;

    if (excludeHandoverId) {
      sql += " AND id <> ?";
      params.push(Number(excludeHandoverId));
    }

    sql += " LIMIT 1 FOR UPDATE";

    const [rows] = await conn.query(sql, params);
    if (Array.isArray(rows) && rows.length > 0) {
      const error = new Error("Overlapping handover exists for this owner.");
      error.statusCode = 422;
      throw error;
    }
  }

  static async getStaffRoleId(conn, staffId) {
    const [rows] = await conn.query(
      "SELECT new_role_id FROM staffs WHERE id = ? LIMIT 1",
      [Number(staffId)],
    );

    return toInt(rows?.[0]?.new_role_id, null);
  }

  static async activateRoleAssignments(conn, handover = {}, actorId = null) {
    if (String(handover?.scope_type || "") !== SCOPE.FULL_ROLE) return;

    const roleId = await this.getStaffRoleId(conn, handover.from_user_id);
    if (!roleId) return;

    const now = new Date();

    await conn.query(
      `UPDATE handover_role_assignments
       SET is_active = 0,
           updated_at = ?
       WHERE handover_id = ?`,
      [now, Number(handover.id)],
    );

    await conn.query(
      `INSERT INTO handover_role_assignments (
        handover_id,
        role_id,
        assigned_to_user_id,
        assigned_from_user_id,
        is_active,
        start_at,
        end_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(handover.id),
        Number(roleId),
        Number(handover.to_user_id),
        Number(handover.from_user_id),
        1,
        handover.start_at,
        handover.end_at,
        now,
        now,
      ],
    );

    await this.createAudit(conn, {
      handoverId: handover.id,
      userId: actorId,
      action: ACTIONS.ACTIVATED,
      description: "Full role assignment activated for delegate.",
      metadata: {
        role_id: roleId,
        assigned_to_user_id: Number(handover.to_user_id),
        assigned_from_user_id: Number(handover.from_user_id),
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  static async deactivateRoleAssignments(conn, handoverId) {
    const now = new Date();
    await conn.query(
      `UPDATE handover_role_assignments
       SET is_active = 0,
           updated_at = ?
       WHERE handover_id = ?
         AND is_active = 1`,
      [now, Number(handoverId)],
    );
  }

  static async activateHandoverWithinTransaction(conn, payload = {}) {
    const {
      handoverId,
      actorId = null,
      now = new Date(),
      actionDescription = "Handover activated.",
    } = payload;

    const handover = await this.getHandoverById(conn, handoverId, true);
    if (!handover) {
      const error = new Error("Handover not found.");
      error.statusCode = 404;
      throw error;
    }

    if (String(handover.status) === STATUS.ACTIVE) {
      return handover;
    }

    if (String(handover.status) !== STATUS.APPROVED) {
      const error = new Error("Only approved handovers can be activated.");
      error.statusCode = 422;
      throw error;
    }

    const startAt = toDate(handover.start_at);
    const endAt = toDate(handover.end_at);

    if (!startAt || !endAt || now < startAt || now >= endAt) {
      const error = new Error("Handover is outside activation window.");
      error.statusCode = 422;
      throw error;
    }

    await this.assertNoOverlap(conn, {
      fromUserId: handover.from_user_id,
      startAt,
      endAt,
      excludeHandoverId: handover.id,
      statuses: [STATUS.ACTIVE],
    });

    await conn.query(
      `UPDATE handovers
       SET status = ?,
           updated_by = ?,
           updated_at = ?
       WHERE id = ?
         AND status = ?`,
      [STATUS.ACTIVE, actorId ? Number(actorId) : null, now, Number(handover.id), STATUS.APPROVED],
    );

    const activated = await this.getHandoverById(conn, handover.id, true);
    await this.activateRoleAssignments(conn, activated, actorId);

    await this.createAudit(conn, {
      handoverId: handover.id,
      userId: actorId,
      action: ACTIONS.ACTIVATED,
      description: actionDescription,
      metadata: {
        scope_type: activated?.scope_type,
        from_user_id: Number(activated?.from_user_id || handover.from_user_id),
        to_user_id: Number(activated?.to_user_id || handover.to_user_id),
      },
      createdAt: now,
      updatedAt: now,
    });

    return activated;
  }

  static async createHandover(payload = {}) {
    const conn = db.promise();
    const now = new Date();

    const fromUserId = toInt(payload.fromUserId, null);
    const toUserId = toInt(payload.toUserId, null);
    const reason = String(payload.reason || "").trim();
    const notes = payload.notes === undefined || payload.notes === null
      ? null
      : String(payload.notes).trim() || null;
    const scopeType = normalizeScope(payload.scopeType);
    const createdBy = toInt(payload.createdBy, fromUserId);
    const initialStatus = String(payload.initialStatus || STATUS.PENDING_APPROVAL).trim().toLowerCase();
    const normalizedInitialStatus = [STATUS.DRAFT, STATUS.PENDING_APPROVAL].includes(initialStatus)
      ? initialStatus
      : STATUS.PENDING_APPROVAL;

    if (!fromUserId || !toUserId) {
      const error = new Error("Both from_user_id and to_user_id are required.");
      error.statusCode = 422;
      throw error;
    }

    if (fromUserId === toUserId) {
      const error = new Error("from_user_id and to_user_id cannot be the same.");
      error.statusCode = 422;
      throw error;
    }

    if (!reason) {
      const error = new Error("Handover reason is required.");
      error.statusCode = 422;
      throw error;
    }

    const window = this.validateDateWindow(payload.startAt, payload.endAt);
    if (!window.valid) {
      const error = new Error(window.message);
      error.statusCode = 422;
      throw error;
    }

    await conn.beginTransaction();

    try {
      await conn.query("SELECT id FROM staffs WHERE id = ? FOR UPDATE", [fromUserId]);
      await conn.query("SELECT id FROM staffs WHERE id = ? FOR UPDATE", [toUserId]);

      if (normalizedInitialStatus !== STATUS.DRAFT) {
        await this.assertNoOverlap(conn, {
          fromUserId,
          startAt: window.startAt,
          endAt: window.endAt,
        });
      }

      const [insertResult] = await conn.query(
        `INSERT INTO handovers (
          from_user_id,
          to_user_id,
          reason,
          notes,
          scope_type,
          status,
          start_at,
          end_at,
          created_by,
          updated_by,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fromUserId,
          toUserId,
          reason,
          notes,
          scopeType,
          normalizedInitialStatus,
          window.startAt,
          window.endAt,
          createdBy,
          createdBy,
          now,
          now,
        ],
      );

      const handoverId = Number(insertResult?.insertId || 0);
      await this.createAudit(conn, {
        handoverId,
        userId: createdBy,
        action: ACTIONS.CREATED,
        description:
          normalizedInitialStatus === STATUS.DRAFT
            ? "Handover draft created."
            : "Handover request created.",
        metadata: {
          from_user_id: fromUserId,
          to_user_id: toUserId,
          scope_type: scopeType,
          status: normalizedInitialStatus,
          start_at: window.startAt,
          end_at: window.endAt,
        },
        createdAt: now,
        updatedAt: now,
      });

      if (normalizedInitialStatus === STATUS.PENDING_APPROVAL) {
        await this.createAudit(conn, {
          handoverId,
          userId: createdBy,
          action: ACTIONS.SUBMITTED,
          description: "Handover submitted for approval.",
          metadata: {
            status: STATUS.PENDING_APPROVAL,
          },
          createdAt: now,
          updatedAt: now,
        });
      }

      await conn.commit();

      const [rows] = await conn.query("SELECT * FROM handovers WHERE id = ? LIMIT 1", [handoverId]);
      return rows?.[0] || null;
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  }

  static async approveHandover(payload = {}) {
    const conn = db.promise();
    const now = new Date();
    const handoverId = toInt(payload.handoverId, null);
    const approverId = toInt(payload.approverId, null);

    if (!handoverId || !approverId) {
      const error = new Error("handoverId and approverId are required.");
      error.statusCode = 422;
      throw error;
    }

    await conn.beginTransaction();

    try {
      const handover = await this.getHandoverById(conn, handoverId, true);
      if (!handover) {
        const error = new Error("Handover not found.");
        error.statusCode = 404;
        throw error;
      }

      if (String(handover.status) !== STATUS.PENDING_APPROVAL) {
        const error = new Error("Only pending handovers can be approved.");
        error.statusCode = 422;
        throw error;
      }

      await this.assertNoOverlap(conn, {
        fromUserId: handover.from_user_id,
        startAt: toDate(handover.start_at),
        endAt: toDate(handover.end_at),
        excludeHandoverId: handover.id,
      });

      await conn.query(
        `UPDATE handovers
         SET status = ?,
             approved_by = ?,
             approved_at = ?,
             updated_by = ?,
             updated_at = ?
         WHERE id = ?
           AND status = ?`,
        [
          STATUS.APPROVED,
          approverId,
          now,
          approverId,
          now,
          handoverId,
          STATUS.PENDING_APPROVAL,
        ],
      );

      await this.createAudit(conn, {
        handoverId,
        userId: approverId,
        action: ACTIONS.APPROVED,
        description: "Handover request approved.",
        metadata: {
          approved_by: approverId,
          approved_at: now,
        },
        createdAt: now,
        updatedAt: now,
      });

      const shouldActivateNow = now >= toDate(handover.start_at) && now < toDate(handover.end_at);
      if (shouldActivateNow) {
        await this.activateHandoverWithinTransaction(conn, {
          handoverId,
          actorId: approverId,
          now,
          actionDescription: "Handover approved and activated immediately.",
        });
      }

      if (now >= toDate(handover.end_at)) {
        await conn.query(
          `UPDATE handovers
           SET status = ?,
               updated_by = ?,
               updated_at = ?
           WHERE id = ?
             AND status = ?`,
          [STATUS.EXPIRED, approverId, now, handoverId, STATUS.APPROVED],
        );

        await this.createAudit(conn, {
          handoverId,
          userId: approverId,
          action: ACTIONS.EXPIRED,
          description: "Approved handover expired before activation.",
          metadata: {
            expired_at: now,
          },
          createdAt: now,
          updatedAt: now,
        });
      }

      await conn.commit();

      const [rows] = await conn.query("SELECT * FROM handovers WHERE id = ? LIMIT 1", [handoverId]);
      return rows?.[0] || null;
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  }

  static async rejectHandover(payload = {}) {
    const conn = db.promise();
    const now = new Date();
    const handoverId = toInt(payload.handoverId, null);
    const rejectedBy = toInt(payload.rejectedBy, null);
    const reason = String(payload.reason || "").trim() || null;

    if (!handoverId || !rejectedBy) {
      const error = new Error("handoverId and rejectedBy are required.");
      error.statusCode = 422;
      throw error;
    }

    await conn.beginTransaction();

    try {
      const handover = await this.getHandoverById(conn, handoverId, true);
      if (!handover) {
        const error = new Error("Handover not found.");
        error.statusCode = 404;
        throw error;
      }

      if (String(handover.status) !== STATUS.PENDING_APPROVAL) {
        const error = new Error("Only pending handovers can be rejected.");
        error.statusCode = 422;
        throw error;
      }

      await conn.query(
        `UPDATE handovers
         SET status = ?,
             updated_by = ?,
             updated_at = ?
         WHERE id = ?
           AND status = ?`,
        [STATUS.REJECTED, rejectedBy, now, handoverId, STATUS.PENDING_APPROVAL],
      );

      await this.createAudit(conn, {
        handoverId,
        userId: rejectedBy,
        action: ACTIONS.REJECTED,
        description: reason || "Handover request rejected.",
        metadata: {
          rejected_by: rejectedBy,
        },
        createdAt: now,
        updatedAt: now,
      });

      await conn.commit();

      const [rows] = await conn.query("SELECT * FROM handovers WHERE id = ? LIMIT 1", [handoverId]);
      return rows?.[0] || null;
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  }

  static async cancelHandover(payload = {}) {
    const conn = db.promise();
    const now = new Date();
    const handoverId = toInt(payload.handoverId, null);
    const cancelledBy = toInt(payload.cancelledBy, null);

    if (!handoverId || !cancelledBy) {
      const error = new Error("handoverId and cancelledBy are required.");
      error.statusCode = 422;
      throw error;
    }

    await conn.beginTransaction();

    try {
      const handover = await this.getHandoverById(conn, handoverId, true);
      if (!handover) {
        const error = new Error("Handover not found.");
        error.statusCode = 404;
        throw error;
      }

      const currentStatus = String(handover.status || "").toLowerCase();
      if (TERMINAL_STATUSES.has(currentStatus)) {
        const error = new Error("Handover is already closed.");
        error.statusCode = 422;
        throw error;
      }

      if (![STATUS.DRAFT, STATUS.PENDING_APPROVAL, STATUS.APPROVED, STATUS.ACTIVE].includes(currentStatus)) {
        const error = new Error("Handover cannot be cancelled from current status.");
        error.statusCode = 422;
        throw error;
      }

      if (currentStatus === STATUS.ACTIVE) {
        await this.deactivateRoleAssignments(conn, handoverId);
      }

      await conn.query(
        `UPDATE handovers
         SET status = ?,
             cancelled_by = ?,
             cancelled_at = ?,
             updated_by = ?,
             updated_at = ?
         WHERE id = ?
           AND status IN (?, ?, ?, ?)`,
        [
          STATUS.CANCELLED,
          cancelledBy,
          now,
          cancelledBy,
          now,
          handoverId,
          STATUS.DRAFT,
          STATUS.PENDING_APPROVAL,
          STATUS.APPROVED,
          STATUS.ACTIVE,
        ],
      );

      await this.createAudit(conn, {
        handoverId,
        userId: cancelledBy,
        action: ACTIONS.CANCELLED,
        description: "Handover cancelled.",
        metadata: {
          previous_status: currentStatus,
          cancelled_by: cancelledBy,
        },
        createdAt: now,
        updatedAt: now,
      });

      await conn.commit();

      const [rows] = await conn.query("SELECT * FROM handovers WHERE id = ? LIMIT 1", [handoverId]);
      return rows?.[0] || null;
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  }

  static async reclaimHandover(payload = {}) {
    const conn = db.promise();
    const now = new Date();
    const handoverId = toInt(payload.handoverId, null);
    const reclaimedBy = toInt(payload.reclaimedBy, null);
    const allowAnyActor = Boolean(payload.allowAnyActor);

    if (!handoverId || !reclaimedBy) {
      const error = new Error("handoverId and reclaimedBy are required.");
      error.statusCode = 422;
      throw error;
    }

    await conn.beginTransaction();

    try {
      const handover = await this.getHandoverById(conn, handoverId, true);
      if (!handover) {
        const error = new Error("Handover not found.");
        error.statusCode = 404;
        throw error;
      }

      if (String(handover.status) !== STATUS.ACTIVE) {
        const error = new Error("Only active handovers can be reclaimed.");
        error.statusCode = 422;
        throw error;
      }

      if (!allowAnyActor && Number(handover.from_user_id) !== Number(reclaimedBy)) {
        const error = new Error("Only the original owner can reclaim this handover.");
        error.statusCode = 403;
        throw error;
      }

      await this.deactivateRoleAssignments(conn, handoverId);

      await conn.query(
        `UPDATE handovers
         SET status = ?,
             reclaimed_by = ?,
             reclaimed_at = ?,
             updated_by = ?,
             updated_at = ?
         WHERE id = ?
           AND status = ?`,
        [
          STATUS.RECLAIMED,
          reclaimedBy,
          now,
          reclaimedBy,
          now,
          handoverId,
          STATUS.ACTIVE,
        ],
      );

      await this.createAudit(conn, {
        handoverId,
        userId: reclaimedBy,
        action: ACTIONS.RECLAIMED,
        description: "Handover reclaimed by owner.",
        metadata: {
          reclaimed_by: reclaimedBy,
        },
        createdAt: now,
        updatedAt: now,
      });

      await conn.commit();

      const [rows] = await conn.query("SELECT * FROM handovers WHERE id = ? LIMIT 1", [handoverId]);
      return rows?.[0] || null;
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  }

  static async expireHandoverWithinTransaction(conn, payload = {}) {
    const now = payload.now || new Date();
    const handoverId = Number(payload.handoverId);

    const handover = await this.getHandoverById(conn, handoverId, true);
    if (!handover) return null;

    const status = String(handover.status || "").toLowerCase();
    if (![STATUS.ACTIVE, STATUS.APPROVED].includes(status)) return null;

    const endAt = toDate(handover.end_at);
    if (!endAt || now < endAt) return null;

    await this.deactivateRoleAssignments(conn, handoverId);

    await conn.query(
      `UPDATE handovers
       SET status = ?,
           updated_at = ?
       WHERE id = ?
         AND status IN (?, ?)`,
      [STATUS.EXPIRED, now, handoverId, STATUS.ACTIVE, STATUS.APPROVED],
    );

    await this.createAudit(conn, {
      handoverId,
      userId: null,
      action: ACTIONS.EXPIRED,
      description: "Handover expired automatically.",
      metadata: {
        expired_at: now,
      },
      createdAt: now,
      updatedAt: now,
    });

    return this.getHandoverById(conn, handoverId, false);
  }

  static async activateDueHandovers(limit = 200) {
    const conn = db.promise();
    const now = new Date();

    const [rows] = await conn.query(
      `SELECT id
       FROM handovers
       WHERE status = ?
         AND start_at <= ?
         AND end_at > ?
       ORDER BY start_at ASC, id ASC
       LIMIT ?`,
      [STATUS.APPROVED, now, now, Number(limit)],
    );

    const ids = uniqueInts((rows || []).map((row) => row.id));
    let activatedCount = 0;

    for (const handoverId of ids) {
      const tx = db.promise();
      try {
        await tx.beginTransaction();
        await this.activateHandoverWithinTransaction(tx, {
          handoverId,
          actorId: null,
          now,
          actionDescription: "Handover activated by scheduler.",
        });
        await tx.commit();
        activatedCount += 1;
      } catch (error) {
        try {
          await tx.rollback();
        } catch (rollbackError) {
          // ignore rollback failures
        }
      }
    }

    return activatedCount;
  }

  static async expireDueHandovers(limit = 200) {
    const conn = db.promise();
    const now = new Date();

    const [rows] = await conn.query(
      `SELECT id
       FROM handovers
       WHERE status IN (?, ?)
         AND end_at <= ?
       ORDER BY end_at ASC, id ASC
       LIMIT ?`,
      [STATUS.ACTIVE, STATUS.APPROVED, now, Number(limit)],
    );

    const ids = uniqueInts((rows || []).map((row) => row.id));
    let expiredCount = 0;

    for (const handoverId of ids) {
      const tx = db.promise();
      try {
        await tx.beginTransaction();
        const expired = await this.expireHandoverWithinTransaction(tx, {
          handoverId,
          now,
        });
        await tx.commit();
        if (expired) expiredCount += 1;
      } catch (error) {
        try {
          await tx.rollback();
        } catch (rollbackError) {
          // ignore rollback failures
        }
      }
    }

    return expiredCount;
  }

  static async runMaintenance() {
    const activated = await this.activateDueHandovers();
    const expired = await this.expireDueHandovers();

    return {
      activated,
      expired,
      total: Number(activated || 0) + Number(expired || 0),
    };
  }

  static async runMaintenanceForUser(userId) {
    const numericUserId = toInt(userId, null);
    if (!numericUserId) return { activated: 0, expired: 0, total: 0 };

    const conn = db.promise();
    const now = new Date();

    const [toActivateRows] = await conn.query(
      `SELECT id
       FROM handovers
       WHERE status = ?
         AND start_at <= ?
         AND end_at > ?
         AND (from_user_id = ? OR to_user_id = ?)
       ORDER BY start_at ASC, id ASC
       LIMIT 50`,
      [STATUS.APPROVED, now, now, numericUserId, numericUserId],
    );

    const [toExpireRows] = await conn.query(
      `SELECT id
       FROM handovers
       WHERE status IN (?, ?)
         AND end_at <= ?
         AND (from_user_id = ? OR to_user_id = ?)
       ORDER BY end_at ASC, id ASC
       LIMIT 50`,
      [STATUS.ACTIVE, STATUS.APPROVED, now, numericUserId, numericUserId],
    );

    let activated = 0;
    for (const handoverId of uniqueInts((toActivateRows || []).map((row) => row.id))) {
      const tx = db.promise();
      try {
        await tx.beginTransaction();
        await this.activateHandoverWithinTransaction(tx, {
          handoverId,
          actorId: null,
          now,
          actionDescription: "Handover activated by user-context maintenance.",
        });
        await tx.commit();
        activated += 1;
      } catch (error) {
        try {
          await tx.rollback();
        } catch (rollbackError) {
          // ignore rollback failures
        }
      }
    }

    let expired = 0;
    for (const handoverId of uniqueInts((toExpireRows || []).map((row) => row.id))) {
      const tx = db.promise();
      try {
        await tx.beginTransaction();
        const result = await this.expireHandoverWithinTransaction(tx, { handoverId, now });
        await tx.commit();
        if (result) expired += 1;
      } catch (error) {
        try {
          await tx.rollback();
        } catch (rollbackError) {
          // ignore rollback failures
        }
      }
    }

    return { activated, expired, total: activated + expired };
  }

  static async resolveDelegationContextForUser(userId, options = {}) {
    const numericUserId = toInt(userId, null);

    if (!numericUserId) {
      return {
        activeIncomingHandovers: [],
        activeOutgoingHandovers: [],
        delegatedPermissions: [],
        delegatedFromUserIds: [],
        activeHandoverIds: [],
        primaryDelegation: null,
        hasIncomingActiveHandover: false,
        hasOutgoingActiveHandover: false,
      };
    }

    if (options?.autoTransition !== false) {
      await this.runMaintenanceForUser(numericUserId);
    }

    const conn = db.promise();
    const now = new Date();

    const [incoming] = await conn.query(
      `SELECT h.*,
              s.name AS from_user_name,
              LOWER(r.name) AS from_user_rank_name
       FROM handovers h
       JOIN staffs s ON s.id = h.from_user_id
       JOIN roles r ON r.id = s.user_level
       WHERE h.to_user_id = ?
         AND h.status = ?
         AND h.start_at <= ?
         AND h.end_at > ?
       ORDER BY h.start_at DESC, h.id DESC`,
      [numericUserId, STATUS.ACTIVE, now, now],
    );

    const [outgoing] = await conn.query(
      `SELECT h.*
       FROM handovers h
       WHERE h.from_user_id = ?
         AND h.status = ?
         AND h.start_at <= ?
         AND h.end_at > ?
       ORDER BY h.start_at DESC, h.id DESC`,
      [numericUserId, STATUS.ACTIVE, now, now],
    );

    const [delegatedPermissionRows] = await conn.query(
      `SELECT DISTINCT p.permission_name
       FROM handovers h
       JOIN staffs owner_staff ON owner_staff.id = h.from_user_id
       JOIN permission_role pr ON pr.role_id = owner_staff.new_role_id
       JOIN permissions p ON p.id = pr.permission_id
       WHERE h.to_user_id = ?
         AND h.scope_type = ?
         AND h.status = ?
         AND h.start_at <= ?
         AND h.end_at > ?`,
      [numericUserId, SCOPE.FULL_ROLE, STATUS.ACTIVE, now, now],
    );

    const activeIncoming = Array.isArray(incoming) ? incoming : [];
    const activeOutgoing = Array.isArray(outgoing) ? outgoing : [];
    const delegatedPermissions = uniqueStrings(
      (delegatedPermissionRows || []).map((row) => row.permission_name),
    );

    const delegatedFromUserIds = uniqueInts(activeIncoming.map((row) => row.from_user_id));
    const activeHandoverIds = uniqueInts(activeIncoming.map((row) => row.id));

    return {
      activeIncomingHandovers: activeIncoming,
      activeOutgoingHandovers: activeOutgoing,
      delegatedPermissions,
      delegatedFromUserIds,
      activeHandoverIds,
      primaryDelegation: activeIncoming[0] || null,
      hasIncomingActiveHandover: activeIncoming.length > 0,
      hasOutgoingActiveHandover: activeOutgoing.length > 0,
    };
  }

  static async enrichTokenUser(baseUser = {}, options = {}) {
    const user =
      baseUser && typeof baseUser === "object" && !Array.isArray(baseUser)
        ? { ...baseUser }
        : {};

    const userId = toInt(user.id || user.user_id || user.staff_id, null);

    const basePermissions = uniqueStrings(Array.isArray(user.userPermissions) ? user.userPermissions : []);

    const context = await this.resolveDelegationContextForUser(userId, options);

    const effectivePermissions = uniqueStrings(basePermissions.concat(context.delegatedPermissions));

    const primary = context.primaryDelegation;
    const delegatedCheo = primary?.from_user_rank_name
      ? `k${String(primary.from_user_rank_name).toLowerCase()}`
      : null;

    return {
      ...user,
      userPermissions: effectivePermissions,
      base_permissions: basePermissions,
      delegatedPermissions: context.delegatedPermissions,
      effectivePermissions,
      handover_by: primary ? Number(primary.from_user_id) : null,
      primary_handover_id: primary ? Number(primary.id) : null,
      delegated_from_user_ids: context.delegatedFromUserIds,
      active_handover_ids: context.activeHandoverIds,
      has_active_incoming_handover: context.hasIncomingActiveHandover,
      has_active_outgoing_handover: context.hasOutgoingActiveHandover,
      delegated_from_user_name: primary?.from_user_name || null,
      delegated_until_at: primary?.end_at || null,
      cheo: delegatedCheo || user.cheo || null,
      delegation_scope_type: primary?.scope_type || null,
      delegation_status: primary?.status || null,
    };
  }

  static normalizeListFilters(payload = {}) {
    const page = Math.max(1, toInt(payload.page, 1));
    const perPage = Math.max(1, Math.min(100, toInt(payload.perPage, 10)));
    const offset = (page - 1) * perPage;
    const status = String(payload.status || "").trim().toLowerCase();
    const scopeType = String(payload.scopeType || payload.scope_type || "").trim().toLowerCase();
    const fromDate = toDate(payload.fromDate || payload.from_date);
    const toDateFilter = toDate(payload.toDate || payload.to_date);

    return {
      page,
      perPage,
      offset,
      status: status || null,
      scopeType: scopeType || null,
      fromDate,
      toDate: toDateFilter,
    };
  }

  static buildStandardHandoverSelect() {
    return `SELECT h.id,
                   h.from_user_id,
                   from_staff.name AS from_user_name,
                   h.to_user_id,
                   to_staff.name AS to_user_name,
                   h.reason,
                   h.notes,
                   h.scope_type,
                   h.status,
                   h.start_at,
                   h.end_at,
                   h.approved_by,
                   approver_staff.name AS approved_by_name,
                   h.approved_at,
                   h.reclaimed_by,
                   reclaimed_staff.name AS reclaimed_by_name,
                   h.reclaimed_at,
                   h.cancelled_by,
                   cancelled_staff.name AS cancelled_by_name,
                   h.cancelled_at,
                   h.created_by,
                   creator_staff.name AS created_by_name,
                   h.updated_by,
                   updater_staff.name AS updated_by_name,
                   h.created_at,
                   h.updated_at,
                   CASE
                     WHEN h.status = '${STATUS.ACTIVE}' AND NOW() BETWEEN h.start_at AND h.end_at THEN 1
                     ELSE 0
                   END AS is_active_now
            FROM handovers h
            JOIN staffs from_staff ON from_staff.id = h.from_user_id
            JOIN staffs to_staff ON to_staff.id = h.to_user_id
            LEFT JOIN staffs approver_staff ON approver_staff.id = h.approved_by
            LEFT JOIN staffs reclaimed_staff ON reclaimed_staff.id = h.reclaimed_by
            LEFT JOIN staffs cancelled_staff ON cancelled_staff.id = h.cancelled_by
            LEFT JOIN staffs creator_staff ON creator_staff.id = h.created_by
            LEFT JOIN staffs updater_staff ON updater_staff.id = h.updated_by`;
  }

  static buildListWhereClause(payload = {}, options = {}) {
    const where = [];
    const params = [];
    const alias = String(options.alias || "h");

    if (options.ownerId) {
      where.push(`${alias}.from_user_id = ?`);
      params.push(Number(options.ownerId));
    }

    if (options.delegateId) {
      where.push(`${alias}.to_user_id = ?`);
      params.push(Number(options.delegateId));
    }

    if (payload.status) {
      where.push(`LOWER(${alias}.status) = ?`);
      params.push(String(payload.status).toLowerCase());
    }

    if (payload.scopeType) {
      where.push(`LOWER(${alias}.scope_type) = ?`);
      params.push(String(payload.scopeType).toLowerCase());
    }

    if (payload.fromDate) {
      where.push(`${alias}.start_at >= ?`);
      params.push(payload.fromDate);
    }

    if (payload.toDate) {
      where.push(`${alias}.end_at <= ?`);
      params.push(payload.toDate);
    }

    return {
      sql: where.length ? `WHERE ${where.join(" AND ")}` : "",
      params,
    };
  }

  static async listHandoversByOwner(payload = {}) {
    const ownerId = toInt(payload.ownerId, null);
    const filters = this.normalizeListFilters(payload);

    if (!ownerId) {
      return { rows: [], total: 0 };
    }

    const conn = db.promise();
    const where = this.buildListWhereClause(filters, { ownerId, alias: "h" });
    const selectSql = this.buildStandardHandoverSelect();

    const [rows] = await conn.query(
      `${selectSql}
       ${where.sql}
       ORDER BY h.created_at DESC, h.id DESC
       LIMIT ?, ?`,
      [...where.params, filters.offset, filters.perPage],
    );

    const [countRows] = await conn.query(
      `SELECT COUNT(*) AS total
       FROM handovers h
       ${where.sql}`,
      [...where.params],
    );

    return {
      rows: Array.isArray(rows) ? rows : [],
      total: Number(countRows?.[0]?.total || 0),
    };
  }

  static async listHandoversAssignedToUser(payload = {}) {
    const delegateId = toInt(payload.delegateId, null);
    const filters = this.normalizeListFilters(payload);
    if (!delegateId) return { rows: [], total: 0 };

    const conn = db.promise();
    const where = this.buildListWhereClause(filters, { delegateId, alias: "h" });
    const selectSql = this.buildStandardHandoverSelect();

    const [rows] = await conn.query(
      `${selectSql}
       ${where.sql}
       ORDER BY h.created_at DESC, h.id DESC
       LIMIT ?, ?`,
      [...where.params, filters.offset, filters.perPage],
    );

    const [countRows] = await conn.query(
      `SELECT COUNT(*) AS total
       FROM handovers h
       ${where.sql}`,
      [...where.params],
    );

    return {
      rows: Array.isArray(rows) ? rows : [],
      total: Number(countRows?.[0]?.total || 0),
    };
  }

  static async listAllHandovers(payload = {}) {
    const filters = this.normalizeListFilters(payload);
    const conn = db.promise();
    const where = this.buildListWhereClause(filters, { alias: "h" });
    const selectSql = this.buildStandardHandoverSelect();

    const [rows] = await conn.query(
      `${selectSql}
       ${where.sql}
       ORDER BY h.created_at DESC, h.id DESC
       LIMIT ?, ?`,
      [...where.params, filters.offset, filters.perPage],
    );

    const [countRows] = await conn.query(
      `SELECT COUNT(*) AS total
       FROM handovers h
       ${where.sql}`,
      [...where.params],
    );

    return {
      rows: Array.isArray(rows) ? rows : [],
      total: Number(countRows?.[0]?.total || 0),
    };
  }

  static async listPendingApprovals(payload = {}) {
    const page = Math.max(1, toInt(payload.page, 1));
    const perPage = Math.max(1, Math.min(100, toInt(payload.perPage, 10)));
    const offset = (page - 1) * perPage;

    const conn = db.promise();
    const [rows] = await conn.query(
      `SELECT h.id,
              h.from_user_id,
              from_staff.name AS from_user_name,
              h.to_user_id,
              to_staff.name AS to_user_name,
              h.reason,
              h.notes,
              h.scope_type,
              h.status,
              h.start_at,
              h.end_at,
              h.created_at
       FROM handovers h
       JOIN staffs from_staff ON from_staff.id = h.from_user_id
       JOIN staffs to_staff ON to_staff.id = h.to_user_id
       WHERE h.status = ?
       ORDER BY h.created_at ASC
       LIMIT ?, ?`,
      [STATUS.PENDING_APPROVAL, offset, perPage],
    );

    const [countRows] = await conn.query(
      `SELECT COUNT(*) AS total
       FROM handovers
       WHERE status = ?`,
      [STATUS.PENDING_APPROVAL],
    );

    return {
      rows: Array.isArray(rows) ? rows : [],
      total: Number(countRows?.[0]?.total || 0),
    };
  }

  static async getHandoverDetailsById(handoverId) {
    const numericHandoverId = toInt(handoverId, null);
    if (!numericHandoverId) return null;

    const conn = db.promise();
    const [rows] = await conn.query(
      `${this.buildStandardHandoverSelect()}
       WHERE h.id = ?
       LIMIT 1`,
      [numericHandoverId],
    );

    return rows?.[0] || null;
  }

  static async listHandoverAudits(payload = {}) {
    const handoverId = toInt(payload.handoverId, null);
    const page = Math.max(1, toInt(payload.page, 1));
    const perPage = Math.max(1, Math.min(200, toInt(payload.perPage, 30)));
    const offset = (page - 1) * perPage;

    if (!handoverId) {
      return { rows: [], total: 0 };
    }

    const conn = db.promise();
    const [rows] = await conn.query(
      `SELECT a.id,
              a.handover_id,
              a.user_id,
              s.name AS actor_name,
              a.action,
              a.description,
              a.metadata,
              a.created_at,
              a.updated_at
       FROM handover_audits a
       LEFT JOIN staffs s ON s.id = a.user_id
       WHERE a.handover_id = ?
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ?, ?`,
      [handoverId, offset, perPage],
    );

    const [countRows] = await conn.query(
      `SELECT COUNT(*) AS total
       FROM handover_audits
       WHERE handover_id = ?`,
      [handoverId],
    );

    return {
      rows: Array.isArray(rows) ? rows : [],
      total: Number(countRows?.[0]?.total || 0),
    };
  }

  static async listAllHandoverAudits(payload = {}) {
    const page = Math.max(1, toInt(payload.page, 1));
    const perPage = Math.max(1, Math.min(200, toInt(payload.perPage, 30)));
    const offset = (page - 1) * perPage;
    const status = String(payload.status || "").trim().toLowerCase();

    const filters = [];
    const params = [];

    if (status) {
      filters.push("LOWER(h.status) = ?");
      params.push(status);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const conn = db.promise();
    const [rows] = await conn.query(
      `SELECT a.id,
              a.handover_id,
              h.status AS handover_status,
              h.scope_type,
              h.from_user_id,
              from_staff.name AS from_user_name,
              h.to_user_id,
              to_staff.name AS to_user_name,
              a.user_id,
              actor.name AS actor_name,
              a.action,
              a.description,
              a.metadata,
              a.created_at
       FROM handover_audits a
       JOIN handovers h ON h.id = a.handover_id
       LEFT JOIN staffs from_staff ON from_staff.id = h.from_user_id
       LEFT JOIN staffs to_staff ON to_staff.id = h.to_user_id
       LEFT JOIN staffs actor ON actor.id = a.user_id
       ${whereSql}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ?, ?`,
      [...params, offset, perPage],
    );

    const [countRows] = await conn.query(
      `SELECT COUNT(*) AS total
       FROM handover_audits a
       JOIN handovers h ON h.id = a.handover_id
       ${whereSql}`,
      [...params],
    );

    return {
      rows: Array.isArray(rows) ? rows : [],
      total: Number(countRows?.[0]?.total || 0),
    };
  }

  static async listUserHandoverAudits(payload = {}) {
    const userId = toInt(payload.userId, null);
    if (!userId) return { rows: [], total: 0 };

    const page = Math.max(1, toInt(payload.page, 1));
    const perPage = Math.max(1, Math.min(200, toInt(payload.perPage, 30)));
    const offset = (page - 1) * perPage;
    const status = String(payload.status || "").trim().toLowerCase();

    const filters = ["(h.from_user_id = ? OR h.to_user_id = ? OR h.approved_by = ? OR a.user_id = ?)"];
    const params = [userId, userId, userId, userId];

    if (status) {
      filters.push("LOWER(h.status) = ?");
      params.push(status);
    }

    const whereSql = `WHERE ${filters.join(" AND ")}`;
    const conn = db.promise();

    const [rows] = await conn.query(
      `SELECT a.id,
              a.handover_id,
              h.status AS handover_status,
              h.scope_type,
              h.from_user_id,
              from_staff.name AS from_user_name,
              h.to_user_id,
              to_staff.name AS to_user_name,
              a.user_id,
              actor.name AS actor_name,
              a.action,
              a.description,
              a.metadata,
              a.created_at
       FROM handover_audits a
       JOIN handovers h ON h.id = a.handover_id
       LEFT JOIN staffs from_staff ON from_staff.id = h.from_user_id
       LEFT JOIN staffs to_staff ON to_staff.id = h.to_user_id
       LEFT JOIN staffs actor ON actor.id = a.user_id
       ${whereSql}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ?, ?`,
      [...params, offset, perPage],
    );

    const [countRows] = await conn.query(
      `SELECT COUNT(*) AS total
       FROM handover_audits a
       JOIN handovers h ON h.id = a.handover_id
       ${whereSql}`,
      [...params],
    );

    return {
      rows: Array.isArray(rows) ? rows : [],
      total: Number(countRows?.[0]?.total || 0),
    };
  }

  static async updateHandover(payload = {}) {
    const conn = db.promise();
    const now = new Date();
    const handoverId = toInt(payload.handoverId, null);
    const actorId = toInt(payload.actorId, null);
    const allowAnyActor = Boolean(payload.allowAnyActor);

    if (!handoverId || !actorId) {
      const error = new Error("handoverId and actorId are required.");
      error.statusCode = 422;
      throw error;
    }

    await conn.beginTransaction();

    try {
      const handover = await this.getHandoverById(conn, handoverId, true);
      if (!handover) {
        const error = new Error("Handover not found.");
        error.statusCode = 404;
        throw error;
      }

      const currentStatus = String(handover.status || "").toLowerCase();
      if (![STATUS.DRAFT, STATUS.PENDING_APPROVAL].includes(currentStatus)) {
        const error = new Error("Only draft or pending handovers can be edited.");
        error.statusCode = 422;
        throw error;
      }

      if (!allowAnyActor && Number(handover.from_user_id) !== Number(actorId)) {
        const error = new Error("Only handover owner can edit this handover.");
        error.statusCode = 403;
        throw error;
      }

      const toUserId = toInt(payload.toUserId, handover.to_user_id);
      const reason = payload.reason === undefined ? handover.reason : String(payload.reason || "").trim();
      const notes = payload.notes === undefined
        ? handover.notes
        : (payload.notes === null ? null : String(payload.notes).trim() || null);
      const scopeType = payload.scopeType === undefined
        ? normalizeScope(handover.scope_type)
        : normalizeScope(payload.scopeType);

      const startInput = payload.startAt === undefined ? handover.start_at : payload.startAt;
      const endInput = payload.endAt === undefined ? handover.end_at : payload.endAt;
      const window = this.validateDateWindow(startInput, endInput);
      if (!window.valid) {
        const error = new Error(window.message);
        error.statusCode = 422;
        throw error;
      }

      if (!toUserId || toUserId === Number(handover.from_user_id)) {
        const error = new Error("Invalid delegate user.");
        error.statusCode = 422;
        throw error;
      }

      if (!reason) {
        const error = new Error("Handover reason is required.");
        error.statusCode = 422;
        throw error;
      }

      await conn.query("SELECT id FROM staffs WHERE id = ? FOR UPDATE", [handover.from_user_id]);
      await conn.query("SELECT id FROM staffs WHERE id = ? FOR UPDATE", [toUserId]);

      if (currentStatus !== STATUS.DRAFT) {
        await this.assertNoOverlap(conn, {
          fromUserId: handover.from_user_id,
          startAt: window.startAt,
          endAt: window.endAt,
          excludeHandoverId: handover.id,
        });
      }

      await conn.query(
        `UPDATE handovers
         SET to_user_id = ?,
             reason = ?,
             notes = ?,
             scope_type = ?,
             start_at = ?,
             end_at = ?,
             updated_by = ?,
             updated_at = ?
         WHERE id = ?`,
        [
          toUserId,
          reason,
          notes,
          scopeType,
          window.startAt,
          window.endAt,
          actorId,
          now,
          handover.id,
        ],
      );

      await this.createAudit(conn, {
        handoverId: handover.id,
        userId: actorId,
        action: ACTIONS.UPDATED,
        description: "Handover updated.",
        metadata: {
          to_user_id: toUserId,
          scope_type: scopeType,
          status: currentStatus,
          start_at: window.startAt,
          end_at: window.endAt,
        },
        createdAt: now,
        updatedAt: now,
      });

      await conn.commit();
      return this.getHandoverDetailsById(handover.id);
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  }

  static async submitHandover(payload = {}) {
    const conn = db.promise();
    const now = new Date();
    const handoverId = toInt(payload.handoverId, null);
    const actorId = toInt(payload.actorId, null);

    if (!handoverId || !actorId) {
      const error = new Error("handoverId and actorId are required.");
      error.statusCode = 422;
      throw error;
    }

    await conn.beginTransaction();
    try {
      const handover = await this.getHandoverById(conn, handoverId, true);
      if (!handover) {
        const error = new Error("Handover not found.");
        error.statusCode = 404;
        throw error;
      }

      if (String(handover.status) !== STATUS.DRAFT) {
        const error = new Error("Only draft handovers can be submitted.");
        error.statusCode = 422;
        throw error;
      }

      if (Number(handover.from_user_id) !== Number(actorId)) {
        const error = new Error("Only handover owner can submit this handover.");
        error.statusCode = 403;
        throw error;
      }

      await this.assertNoOverlap(conn, {
        fromUserId: handover.from_user_id,
        startAt: toDate(handover.start_at),
        endAt: toDate(handover.end_at),
        excludeHandoverId: handover.id,
      });

      await conn.query(
        `UPDATE handovers
         SET status = ?,
             updated_by = ?,
             updated_at = ?
         WHERE id = ?
           AND status = ?`,
        [STATUS.PENDING_APPROVAL, actorId, now, handover.id, STATUS.DRAFT],
      );

      await this.createAudit(conn, {
        handoverId: handover.id,
        userId: actorId,
        action: ACTIONS.SUBMITTED,
        description: "Handover submitted for approval.",
        metadata: {
          previous_status: STATUS.DRAFT,
          status: STATUS.PENDING_APPROVAL,
        },
        createdAt: now,
        updatedAt: now,
      });

      await conn.commit();
      return this.getHandoverDetailsById(handover.id);
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  }

  static async findLatestOwnerOpenHandover(ownerId) {
    const conn = db.promise();
    const [rows] = await conn.query(
      `SELECT *
       FROM handovers
       WHERE from_user_id = ?
         AND status IN (?, ?, ?)
       ORDER BY
         CASE
           WHEN status = ? THEN 0
           WHEN status = ? THEN 1
           ELSE 2
         END,
         created_at DESC,
         id DESC
       LIMIT 1`,
      [
        Number(ownerId),
        STATUS.ACTIVE,
        STATUS.APPROVED,
        STATUS.PENDING_APPROVAL,
        STATUS.ACTIVE,
        STATUS.APPROVED,
      ],
    );

    return rows?.[0] || null;
  }

  static async logDelegatedTaskAction(payload = {}) {
    const user = payload?.user || {};
    const actorId = toInt(payload.userId || user.id, null);
    if (!actorId) return;

    const handoverIds = uniqueInts(
      (Array.isArray(payload.handoverIds) && payload.handoverIds.length
        ? payload.handoverIds
        : (Array.isArray(user.active_handover_ids) ? user.active_handover_ids : [])),
    );

    if (!handoverIds.length) return;

    const conn = db.promise();
    const now = new Date();

    for (const handoverId of handoverIds) {
      try {
        await this.createAudit(conn, {
          handoverId,
          userId: actorId,
          action: ACTIONS.TASK_ACTION,
          description: String(payload.description || "Task action performed under delegated handover."),
          metadata: {
            ...(payload.metadata || {}),
            actor_id: actorId,
            original_owner_ids: uniqueInts(user.delegated_from_user_ids || []),
            handover_id: handoverId,
          },
          createdAt: now,
          updatedAt: now,
        });
      } catch (error) {
        // non-blocking audit insert
      }
    }
  }
}

module.exports = HandoverService;
