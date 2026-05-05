const db = require("../config/database");
const { formatDate } = require("../utils");

module.exports = {
  resolveActorId(req = {}) {
    const actor =
      (req.user && (req.user.id || req.user.user_id || req.user.userId || req.user.staff_id || req.user.handover_by)) ||
      0;
    const actorId = Number(actor);
    return Number.isFinite(actorId) && actorId > 0 ? actorId : null;
  },

  normalizeBoolean(value) {
    return value === true || value === 1 || value === "1" || value === "on" ? 1 : 0;
  },

  buildWorkflowPayload(data = {}) {
    const selectedUnitId = Number(data.unit_id || 0);
    const syncedHierarchyId = selectedUnitId > 0 ? selectedUnitId : 0;

    const optionalTypeRaw = String(data.optional_type || "").trim();
    const optionalType = optionalTypeRaw ? optionalTypeRaw.toLowerCase() : null;
    const returnsToStepOrderRaw = Number(data.returns_to_step_order || 0);
    const returnsToStepOrder = Number.isFinite(returnsToStepOrderRaw) && returnsToStepOrderRaw > 0
      ? returnsToStepOrderRaw
      : null;
    const isOptional = this.normalizeBoolean(data.is_optional);
    const hasReturnsToApprover = Object.prototype.hasOwnProperty.call(data || {}, "returns_to_approver");
    const returnsToApprover = hasReturnsToApprover
      ? this.normalizeBoolean(data.returns_to_approver)
      : (isOptional ? 1 : 0);

    return {
      application_category_id: Number(data.application_category_id || data.application_categories || 0),
      _order: Number(data.order || data._order || 0),
      unit_id: syncedHierarchyId > 0 ? syncedHierarchyId : null,
      role_id: data.role_id ? Number(data.role_id) : null,
      is_start: this.normalizeBoolean(data.is_start),
      is_final: this.normalizeBoolean(data.is_final),
      can_assign: this.normalizeBoolean(data.can_assign),
      can_approve: this.normalizeBoolean(data.can_approve),
      can_return: this.normalizeBoolean(data.can_return),
      is_optional: isOptional,
      optional_type: optionalType,
      returns_to_step_order: returnsToStepOrder,
      returns_to_approver: returnsToApprover,
    };
  },

  validateOptionalWorkflowRules(payload, excludeId = null, callback) {
    const isOptional = Number(payload.is_optional || 0) === 1;
    if (!isOptional) {
      payload.optional_type = null;
      payload.returns_to_step_order = null;
      payload.returns_to_approver = 0;
      callback(true, null);
      return;
    }

    if (!String(payload.optional_type || "").trim()) {
      callback(false, "Optional Type ni lazima kwa hatua ya hiari.");
      return;
    }

    const returnOrder = Number(payload.returns_to_step_order || 0);
    if (!Number.isFinite(returnOrder) || returnOrder <= 0) {
      callback(false, "Return to Step ni lazima kwa hatua ya hiari.");
      return;
    }

    if (Number(payload.is_start) === 1) {
      callback(false, "Optional step hairuhusiwi kuwa Start.");
      return;
    }

    if (Number(payload.can_approve) === 1 || Number(payload.is_final) === 1) {
      callback(false, "Optional step hairuhusiwi kuwa Approve/Final.");
      return;
    }

    if (Number(payload.can_return) === 1) {
      callback(false, "Optional step hairuhusiwi kuwa na Return.");
      return;
    }

    const params = [Number(payload.application_category_id || 0), returnOrder];
    let sql = `
      SELECT id, _order, is_optional
      FROM workflows
      WHERE deleted_at IS NULL
        AND application_category_id = ?
        AND _order = ?
    `;
    if (excludeId) {
      sql += " AND id <> ?";
      params.push(Number(excludeId));
    }
    sql += " LIMIT 1";

    db.query(sql, params, (error, rows) => {
      if (error) {
        if (error.code === "ER_BAD_FIELD_ERROR") {
          db.query(
            sql.replace("SELECT id, _order, is_optional", "SELECT id, _order, 0 AS is_optional"),
            params,
            (fallbackError, fallbackRows) => {
              if (fallbackError) {
                console.log(fallbackError);
                callback(false, "Imeshindikana kuhakiki Return to Step.");
                return;
              }

              const target = Array.isArray(fallbackRows) && fallbackRows.length ? fallbackRows[0] : null;
              if (!target) {
                callback(false, "Return to Step haipo kwenye Aina hii ya Ombi.");
                return;
              }
              callback(true, null);
            }
          );
          return;
        }
        console.log(error);
        callback(false, "Imeshindikana kuhakiki Return to Step.");
        return;
      }

      const target = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (!target) {
        callback(false, "Return to Step haipo kwenye Aina hii ya Ombi.");
        return;
      }

      if (Number(target.is_optional || 0) === 1) {
        callback(false, "Return to Step haiwezi kuwa optional step nyingine.");
        return;
      }

      callback(true, null);
    });
  },

  validateOrderSequence(payload, excludeId = null, pendingOrders = [], pendingStartFrom = [], callback) {
    const categoryId = Number(payload.application_category_id || 0);
    const currentOrder = Number(payload._order || 0);
    const currentUnitId = Number(payload.unit_id || 0);

    if (categoryId <= 0) {
      callback(false, "Aina ya Ombi haijachaguliwa.");
      return;
    }

    if (currentOrder <= 0) {
      callback(false, "Step Order lazima iwe zaidi ya 0.");
      return;
    }

    if (currentUnitId <= 0) {
      callback(false, "Unit lazima ichaguliwe.");
      return;
    }

    const params = [categoryId];
    let whereSql = "application_category_id = ? AND deleted_at IS NULL";
    if (excludeId) {
      whereSql += " AND id <> ?";
      params.push(Number(excludeId));
    }

    db.query(
      `SELECT _order, unit_id FROM workflows WHERE ${whereSql}`,
      params,
      (error, rows) => {
        if (error) {
          console.log(error);
          callback(false, "Imeshindikana kuhakiki Step Order. Jaribu tena.");
          return;
        }

        const dbOrders = (rows || []).map((row) => Number(row._order || 0)).filter((n) => n > 0);
        const dbStartFrom = (rows || []).map((row) => Number(row.unit_id || 0)).filter((n) => n > 0);
        const incomingOrders = Array.isArray(pendingOrders)
          ? pendingOrders.map((n) => Number(n || 0)).filter((n) => n > 0)
          : [];
        const incomingStartFrom = Array.isArray(pendingStartFrom)
          ? pendingStartFrom.map((n) => Number(n || 0)).filter((n) => n > 0)
          : [];
        const existingOrders = dbOrders.concat(incomingOrders);
        const existingStartFrom = dbStartFrom.concat(incomingStartFrom);

        if (existingOrders.includes(currentOrder)) {
          callback(false, "Step Order hairuhusiwi kujirudia kwenye Aina hii ya Ombi.");
          return;
        }

        if (existingStartFrom.includes(currentUnitId)) {
          callback(false, "Unit hairuhusiwi kujirudia kwenye Aina hii ya Ombi.");
          return;
        }

        const allOrders = existingOrders.concat(currentOrder).sort((a, b) => a - b);
        const uniqueOrders = [...new Set(allOrders)];

        if (uniqueOrders[0] !== 1) {
          callback(false, "Step Order ya kwanza kwenye Aina hii ya Ombi lazima iwe 1.");
          return;
        }

        for (let i = 1; i < uniqueOrders.length; i += 1) {
          if (uniqueOrders[i] !== uniqueOrders[i - 1] + 1) {
            callback(false, "Step Order hairuhusiwi kuruka namba. Tumia mfuatano 1,2,3,...");
            return;
          }
        }

        callback(true, null);
      }
    );
  },

  validateUniqueWorkflowFlags(payload, excludeId = null, pendingOrders = [], pendingStartFrom = [], callback) {
    if (Number(payload._order) === 1 && Number(payload.is_start) !== 1) {
      callback(false, "Step Order ikiwa 1, is start lazima iwe checked.");
      return;
    }

    const checks = [];
    const params = [payload.application_category_id];
    let whereSql = "application_category_id = ? AND deleted_at IS NULL";

    if (excludeId) {
      whereSql += " AND id <> ?";
      params.push(Number(excludeId));
    }

    if (Number(payload.is_start) === 1) {
      checks.push({
        field: "is_start",
        message: "Aina hii ya ombi tayari ina hatua ya kuanzia (is_start).",
      });
    }

    if (Number(payload.is_final) === 1) {
      checks.push({
        field: "is_final",
        message: "Aina hii ya ombi tayari ina hatua ya mwisho (is_final).",
      });
    }

    const runCheck = (index) => {
      if (index >= checks.length) {
        module.exports.validateOrderSequence(
          payload,
          excludeId,
          pendingOrders,
          pendingStartFrom,
          callback
        );
        return;
      }

      const check = checks[index];
      db.query(
        `SELECT COUNT(*) AS num_rows
         FROM workflows
         WHERE ${whereSql} AND ${check.field} = 1`,
        params,
        (error, results) => {
          if (error) {
            console.log(error);
            callback(false, "Imeshindikana kuhakiki workflow. Jaribu tena.");
            return;
          }

          if (Number(results[0]?.num_rows || 0) > 0) {
            callback(false, check.message);
            return;
          }

          runCheck(index + 1);
        }
      );
    };

    if (checks.length === 0) {
      module.exports.validateOrderSequence(
        payload,
        excludeId,
        pendingOrders,
        pendingStartFrom,
        callback
      );
      return;
    }

    runCheck(0);
  },

  validateNoIncompleteOtherCategory(incomingCategoryIds = [], callback) {
    const normalizedCategoryIds = Array.from(
      new Set(
        (Array.isArray(incomingCategoryIds) ? incomingCategoryIds : [])
          .map((id) => Number(id || 0))
          .filter((id) => id > 0)
      )
    );

    if (!normalizedCategoryIds.length) {
      callback(true, null);
      return;
    }

    db.query(
      `SELECT w.application_category_id, ac.app_name,
              MAX(CASE WHEN w.is_start = 1 THEN 1 ELSE 0 END) AS has_start,
              MAX(CASE WHEN w.is_final = 1 THEN 1 ELSE 0 END) AS has_final
       FROM workflows w
       INNER JOIN application_categories ac ON ac.id = w.application_category_id
       WHERE w.deleted_at IS NULL
       GROUP BY w.application_category_id, ac.app_name`,
      (error, rows) => {
        if (error) {
          console.log(error);
          callback(false, "Imeshindikana kuhakiki ukamilifu wa workflow. Jaribu tena.");
          return;
        }

        const incompleteCategories = (rows || []).filter(
          (row) => Number(row.has_start) !== 1 || Number(row.has_final) !== 1
        );

        if (!incompleteCategories.length) {
          callback(true, null);
          return;
        }

        const incompleteCategoryIds = new Set(
          incompleteCategories.map((row) => Number(row.application_category_id))
        );
        const hasDifferentCategory = normalizedCategoryIds.some(
          (categoryId) => !incompleteCategoryIds.has(Number(categoryId))
        );

        if (!hasDifferentCategory) {
          callback(true, null);
          return;
        }

        const firstIncomplete = incompleteCategories[0];
        callback(
          false,
          `Hauwezi kuanzisha workflow ya aina nyingine kwa sasa. Kamilisha kwanza "${firstIncomplete.app_name}" kwa kuweka Start na Final.`
        );
      }
    );
  },

  //******** GET A LIST OF WORKFLOWS *******************************
  getAllWorkflows: (offset, per_page, is_paginated, application_category_ids, deletedScope = "active", callback) => {
    const normalizedDeletedScope = String(deletedScope || "active").toLowerCase();
    const normalizedCategoryIds = Array.from(
      new Set(
        (
          Array.isArray(application_category_ids)
            ? application_category_ids
            : String(application_category_ids || "")
                .split(",")
                .map((value) => value.trim())
                .filter((value) => value !== "")
        )
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );

    const buildWhereSql = (supportsDeletedAt) => {
      const whereClauses = [];
      if (supportsDeletedAt) {
        if (normalizedDeletedScope === "deleted") {
          whereClauses.push("w.deleted_at IS NOT NULL");
        } else if (normalizedDeletedScope !== "all") {
          whereClauses.push("w.deleted_at IS NULL");
        }
      }

      if (normalizedCategoryIds.length > 1) {
        const ids = normalizedCategoryIds.map((id) => db.escape(id)).join(",");
        whereClauses.push(`w.application_category_id IN (${ids})`);
      } else if (normalizedCategoryIds.length === 1) {
        whereClauses.push(`w.application_category_id = ${db.escape(normalizedCategoryIds[0])}`);
      }

      return whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
    };

    const runModernSchemaQuery = () => {
      const filter = buildWhereSql(true);
      const sqlFrom = `FROM workflows w
            INNER JOIN application_categories ac ON ac.id = w.application_category_id
            INNER JOIN vyeo v ON v.id = w.unit_id
            LEFT JOIN role_management rm ON rm.id = w.role_id
            ${filter}
            ORDER BY w.application_category_id ASC, _order ASC`;

      db.query(
        `SELECT w.id AS id, application_category_id, ac.app_name AS app_name, v.rank_name AS unit_name, _order,
                w.unit_id, v.rank_name AS unit_name, w.role_id, rm.role_name,
                w.is_start, w.is_final, w.can_assign, w.can_approve, w.can_return, w.deleted_at
                ,COALESCE(w.is_optional,0) AS is_optional
                ,w.optional_type
                ,w.returns_to_step_order
                ,COALESCE(w.returns_to_approver,0) AS returns_to_approver
         ${sqlFrom} 
         ${is_paginated ? " LIMIT ?,?" : ""}`,
        is_paginated ? [offset, per_page] : [],
        (error, results) => {
          if (error) {
            if (error.code === "ER_BAD_FIELD_ERROR") {
              runCompatibilitySchemaQuery();
              return;
            }
            console.log(error);
            callback(error, [], 0);
            return;
          }
          db.query(
            `SELECT COUNT(*) AS num_rows ${sqlFrom}`,
            (error2, result) => {
              if (error2) {
                console.log(error2);
                callback(error2, Array.isArray(results) ? results : [], 0);
                return;
              }
              callback(null, Array.isArray(results) ? results : [], Number(result?.[0]?.num_rows || 0));
            }
          );
        }
      );
    };

    const runCompatibilitySchemaQuery = () => {
      const filter = buildWhereSql(true);
      const sqlFrom = `FROM workflows w
            INNER JOIN application_categories ac ON ac.id = w.application_category_id
            INNER JOIN vyeo v ON v.id = w.unit_id
            LEFT JOIN role_management rm ON rm.id = w.role_id
            ${filter}
            ORDER BY w.application_category_id ASC, _order ASC`;

      db.query(
        `SELECT w.id AS id, application_category_id, ac.app_name AS app_name, v.rank_name AS unit_name, _order,
                w.unit_id, v.rank_name AS unit_name, w.role_id, rm.role_name,
                COALESCE(w.is_start,0) AS is_start,
                COALESCE(w.is_final,0) AS is_final,
                COALESCE(w.can_assign,0) AS can_assign,
                COALESCE(w.can_approve,0) AS can_approve,
                COALESCE(w.can_return,0) AS can_return,
                w.deleted_at,
                COALESCE(w.is_optional,0) AS is_optional,
                w.optional_type,
                NULL AS returns_to_step_order,
                COALESCE(w.returns_to_approver,0) AS returns_to_approver
         ${sqlFrom}
         ${is_paginated ? " LIMIT ?,?" : ""}`,
        is_paginated ? [offset, per_page] : [],
        (error, results) => {
          if (error) {
            if (error.code === "ER_BAD_FIELD_ERROR") {
              runLegacySchemaQuery();
              return;
            }
            console.log(error);
            callback(error, [], 0);
            return;
          }
          db.query(
            `SELECT COUNT(*) AS num_rows ${sqlFrom}`,
            (error2, result) => {
              if (error2) {
                console.log(error2);
                callback(error2, Array.isArray(results) ? results : [], 0);
                return;
              }
              callback(null, Array.isArray(results) ? results : [], Number(result?.[0]?.num_rows || 0));
            }
          );
        }
      );
    };

    const runLegacySchemaQuery = () => {
      const filter = buildWhereSql(false);
      const sqlFrom = `FROM workflows w
            INNER JOIN application_categories ac ON ac.id = w.application_category_id
            INNER JOIN vyeo v ON v.id = w.unit_id
            ${filter}
            ORDER BY w.application_category_id ASC, _order ASC`;

      db.query(
        `SELECT w.id AS id, w.application_category_id, ac.app_name AS app_name, v.rank_name AS unit_name, w._order,
                w.unit_id AS unit_id, v.rank_name AS unit_name, NULL AS role_id, NULL AS role_name,
                COALESCE(w.is_start,0) AS is_start,
                COALESCE(w.is_final,0) AS is_final,
                COALESCE(w.can_assign,0) AS can_assign,
                COALESCE(w.can_approve,0) AS can_approve,
                COALESCE(w.can_return,0) AS can_return,
                NULL AS deleted_at
                ,COALESCE(w.is_optional,0) AS is_optional,
                w.optional_type,
                NULL AS returns_to_step_order,
                COALESCE(w.returns_to_approver,0) AS returns_to_approver
         ${sqlFrom}
         ${is_paginated ? " LIMIT ?,?" : ""}`,
        is_paginated ? [offset, per_page] : [],
        (error, results) => {
          if (error) {
            console.log(error);
            callback(error, [], 0);
            return;
          }
          db.query(
            `SELECT COUNT(*) AS num_rows ${sqlFrom}`,
            (error2, result) => {
              if (error2) {
                console.log(error2);
                callback(error2, Array.isArray(results) ? results : [], 0);
                return;
              }
              callback(null, Array.isArray(results) ? results : [], Number(result?.[0]?.num_rows || 0));
            }
          );
        }
      );
    };

    runModernSchemaQuery();
  },
  getWorkflowStepsByCategory: (applicationCategoryId, callback) => {
    const categoryId = Number(applicationCategoryId || 0);
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      callback(new Error("application_category_id is required"), []);
      return;
    }

    const queries = [
      `
      SELECT
        w.id,
        w._order AS step_order,
        w.unit_id,
        v.rank_name AS unit_name
      FROM workflows w
      INNER JOIN vyeo v ON v.id = w.unit_id
      WHERE w.application_category_id = ?
        AND w.deleted_at IS NULL
        AND COALESCE(w.is_optional, 0) = 0
      ORDER BY w._order ASC
      `,
      `
      SELECT
        w.id,
        w.step_order AS step_order,
        w.unit_id,
        v.rank_name AS unit_name
      FROM workflows w
      INNER JOIN vyeo v ON v.id = w.unit_id
      WHERE w.application_category_id = ?
        AND w.deleted_at IS NULL
        AND COALESCE(w.is_optional, 0) = 0
      ORDER BY w.step_order ASC
      `,
      `
      SELECT
        w.id,
        w._order AS step_order,
        w.unit_id,
        v.rank_name AS unit_name
      FROM workflows w
      INNER JOIN vyeo v ON v.id = w.unit_id
      WHERE w.application_category_id = ?
        AND COALESCE(w.is_optional, 0) = 0
      ORDER BY w._order ASC
      `,
      `
      SELECT
        w.id,
        w.step_order AS step_order,
        w.unit_id,
        v.rank_name AS unit_name
      FROM workflows w
      INNER JOIN vyeo v ON v.id = w.unit_id
      WHERE w.application_category_id = ?
        AND COALESCE(w.is_optional, 0) = 0
      ORDER BY w.step_order ASC
      `,
      `
      SELECT
        w.id,
        w._order AS step_order,
        w.unit_id,
        v.rank_name AS unit_name
      FROM workflows w
      INNER JOIN vyeo v ON v.id = w.unit_id
      WHERE w.application_category_id = ?
      ORDER BY w._order ASC
      `,
      `
      SELECT
        w.id,
        w.step_order AS step_order,
        w.unit_id,
        v.rank_name AS unit_name
      FROM workflows w
      INNER JOIN vyeo v ON v.id = w.unit_id
      WHERE w.application_category_id = ?
      ORDER BY w.step_order ASC
      `,
    ];

    const runAt = (idx) => {
      if (idx >= queries.length) {
        callback(new Error("Failed to load workflow steps for this category."), []);
        return;
      }

      db.query(queries[idx], [categoryId], (error, results) => {
        if (error) {
          if (error.code === "ER_BAD_FIELD_ERROR" || error.code === "ER_BAD_TABLE_ERROR") {
            runAt(idx + 1);
            return;
          }
          callback(error, []);
          return;
        }
        callback(null, Array.isArray(results) ? results : []);
      });
    };

    runAt(0);
  },
  getApproverStepByCategory: (applicationCategoryId, callback) => {
    const categoryId = Number(applicationCategoryId || 0);
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      callback(new Error("application_category_id is required"), null, 0);
      return;
    }

    const queries = [
      `
      SELECT w.id, w._order AS step_order, w.unit_id, v.rank_name AS unit_name
      FROM workflows w
      INNER JOIN vyeo v ON v.id = w.unit_id
      WHERE w.application_category_id = ?
        AND w.deleted_at IS NULL
        AND COALESCE(w.is_optional,0) = 0
        AND COALESCE(w.can_approve,0) = 1
      ORDER BY w._order ASC
      `,
      `
      SELECT w.id, w.step_order AS step_order, w.unit_id, v.rank_name AS unit_name
      FROM workflows w
      INNER JOIN vyeo v ON v.id = w.unit_id
      WHERE w.application_category_id = ?
        AND w.deleted_at IS NULL
        AND COALESCE(w.is_optional,0) = 0
        AND COALESCE(w.can_approve,0) = 1
      ORDER BY w.step_order ASC
      `,
      `
      SELECT w.id, w._order AS step_order, w.unit_id, v.rank_name AS unit_name
      FROM workflows w
      INNER JOIN vyeo v ON v.id = w.unit_id
      WHERE w.application_category_id = ?
        AND COALESCE(w.is_optional,0) = 0
        AND COALESCE(w.can_approve,0) = 1
      ORDER BY w._order ASC
      `,
      `
      SELECT w.id, w.step_order AS step_order, w.unit_id, v.rank_name AS unit_name
      FROM workflows w
      INNER JOIN vyeo v ON v.id = w.unit_id
      WHERE w.application_category_id = ?
        AND COALESCE(w.is_optional,0) = 0
        AND COALESCE(w.can_approve,0) = 1
      ORDER BY w.step_order ASC
      `,
    ];

    const runAt = (idx) => {
      if (idx >= queries.length) {
        callback(new Error("Failed to resolve approver step."), null, 0);
        return;
      }

      db.query(queries[idx], [categoryId], (error, rows) => {
        if (error) {
          if (error.code === "ER_BAD_FIELD_ERROR" || error.code === "ER_BAD_TABLE_ERROR") {
            runAt(idx + 1);
            return;
          }
          callback(error, null, 0);
          return;
        }

        const resultRows = Array.isArray(rows) ? rows : [];
        callback(null, resultRows[0] || null, resultRows.length);
      });
    };

    runAt(0);
  },
  //******** STORE WORKFLOW *******************************
  insertOrUpdateWorkflow: (req , data , callback) => {
    const {action} = req.body;
    const actorId = module.exports.resolveActorId(req);
    const rows = Array.isArray(data) ? data : [data];
    const payloads = rows.map((item) => module.exports.buildWorkflowPayload(item));
    const values = payloads.map((payload) => {
      return [
        payload.application_category_id,
        payload._order,
        payload.unit_id,
        payload.role_id,
        payload.is_start,
        payload.is_final,
        payload.can_assign,
        payload.can_approve,
        payload.can_return,
        payload.is_optional,
        payload.optional_type,
        payload.returns_to_step_order,
        payload.returns_to_approver,
        actorId,
        actorId,
        formatDate(new Date()),
        formatDate(new Date()),
      ];
    });

    const pendingOrdersByCategory = {};
    const pendingStartFromByCategory = {};
    let crossCategoryWarningMessage = null;

    const validatePayloadAt = (index) => {
      if (index >= payloads.length) {
        const insertWithOptionalSql = `INSERT INTO workflows(
          application_category_id, _order, unit_id, role_id,
          is_start, is_final, can_assign, can_approve, can_return,
          is_optional, optional_type, returns_to_step_order, returns_to_approver,
          created_by, updated_by, created_at, updated_at
        ) VALUES ?`;
        const insertWithOptionalAndEndToSql = `INSERT INTO workflows(
          application_category_id, _order, unit_id, end_to, role_id,
          is_start, is_final, can_assign, can_approve, can_return,
          is_optional, optional_type, returns_to_step_order, returns_to_approver,
          created_by, updated_by, created_at, updated_at
        ) VALUES ?`;
        const insertLegacySql = `INSERT INTO workflows(
          application_category_id, _order, unit_id, role_id,
          is_start, is_final, can_assign, can_approve, can_return,
          created_by, updated_by, created_at, updated_at
        ) VALUES ?`;
        const insertLegacyWithEndToSql = `INSERT INTO workflows(
          application_category_id, _order, unit_id, end_to, role_id,
          is_start, is_final, can_assign, can_approve, can_return,
          created_by, updated_by, created_at, updated_at
        ) VALUES ?`;
        const legacyValues = payloads.map((payload) => ([
          payload.application_category_id,
          payload._order,
          payload.unit_id,
          payload.role_id,
          payload.is_start,
          payload.is_final,
          payload.can_assign,
          payload.can_approve,
          payload.can_return,
          actorId,
          actorId,
          formatDate(new Date()),
          formatDate(new Date()),
        ]));
        const legacyValuesWithEndTo = payloads.map((payload) => ([
          payload.application_category_id,
          payload._order,
          payload.unit_id,
          payload.unit_id,
          payload.role_id,
          payload.is_start,
          payload.is_final,
          payload.can_assign,
          payload.can_approve,
          payload.can_return,
          actorId,
          actorId,
          formatDate(new Date()),
          formatDate(new Date()),
        ]));
        const valuesWithOptionalAndEndTo = payloads.map((payload) => ([
          payload.application_category_id,
          payload._order,
          payload.unit_id,
          payload.unit_id,
          payload.role_id,
          payload.is_start,
          payload.is_final,
          payload.can_assign,
          payload.can_approve,
          payload.can_return,
          payload.is_optional,
          payload.optional_type,
          payload.returns_to_step_order,
          payload.returns_to_approver,
          actorId,
          actorId,
          formatDate(new Date()),
          formatDate(new Date()),
        ]));

        db.query(insertWithOptionalSql, [values], (error, results) => {
          if (
            error &&
            error.code === "ER_NO_DEFAULT_FOR_FIELD" &&
            String(error.sqlMessage || "").toLowerCase().includes("end_to")
          ) {
            db.query(insertWithOptionalAndEndToSql, [valuesWithOptionalAndEndTo], (withEndToError, withEndToResults) => {
              if (withEndToError && withEndToError.code === "ER_BAD_FIELD_ERROR") {
                db.query(insertLegacyWithEndToSql, [legacyValuesWithEndTo], (endToLegacyError, endToLegacyResults) => {
                  if (endToLegacyError) {
                    console.log(endToLegacyError);
                    callback(false, `Haujafanikiwa ${action} Utendaji Kazi (Workflow) ` + endToLegacyError.code);
                    return;
                  }
                  const baseMessage = `Umefanikiwa ${action} Utendaji Kazi (Workflow)`;
                  callback(
                    endToLegacyResults.affectedRows > 0,
                    crossCategoryWarningMessage
                      ? `${baseMessage}. Tahadhari: ${crossCategoryWarningMessage}`
                      : baseMessage
                  );
                });
                return;
              }
              if (withEndToError) {
                console.log(withEndToError);
                callback(false, `Haujafanikiwa ${action} Utendaji Kazi (Workflow) ` + withEndToError.code);
                return;
              }
              const baseMessage = `Umefanikiwa ${action} Utendaji Kazi (Workflow)`;
              callback(
                withEndToResults.affectedRows > 0,
                crossCategoryWarningMessage
                  ? `${baseMessage}. Tahadhari: ${crossCategoryWarningMessage}`
                  : baseMessage
              );
            });
            return;
          }
          if (error && error.code === "ER_BAD_FIELD_ERROR") {
            db.query(insertLegacySql, [legacyValues], (legacyError, legacyResults) => {
              if (
                legacyError &&
                legacyError.code === "ER_NO_DEFAULT_FOR_FIELD" &&
                String(legacyError.sqlMessage || "").toLowerCase().includes("end_to")
              ) {
                db.query(insertLegacyWithEndToSql, [legacyValuesWithEndTo], (endToError, endToResults) => {
                  if (endToError) {
                    console.log(endToError);
                    callback(false, `Haujafanikiwa ${action} Utendaji Kazi (Workflow) ` + endToError.code);
                    return;
                  }
                  const baseMessage = `Umefanikiwa ${action} Utendaji Kazi (Workflow)`;
                  callback(
                    endToResults.affectedRows > 0,
                    crossCategoryWarningMessage
                      ? `${baseMessage}. Tahadhari: ${crossCategoryWarningMessage}`
                      : baseMessage
                  );
                });
                return;
              }
              if (legacyError) {
                console.log(legacyError);
                callback(false, `Haujafanikiwa ${action} Utendaji Kazi (Workflow) ` + legacyError.code);
                return;
              }
              const baseMessage = `Umefanikiwa ${action} Utendaji Kazi (Workflow)`;
              callback(
                legacyResults.affectedRows > 0,
                crossCategoryWarningMessage
                  ? `${baseMessage}. Tahadhari: ${crossCategoryWarningMessage}`
                  : baseMessage
              );
            });
            return;
          }
          if (
            error &&
            error.code === "ER_NO_DEFAULT_FOR_FIELD" &&
            String(error.sqlMessage || "").toLowerCase().includes("end_to")
          ) {
            db.query(insertLegacyWithEndToSql, [legacyValuesWithEndTo], (endToError, endToResults) => {
              if (endToError) {
                console.log(endToError);
                callback(false, `Haujafanikiwa ${action} Utendaji Kazi (Workflow) ` + endToError.code);
                return;
              }
              const baseMessage = `Umefanikiwa ${action} Utendaji Kazi (Workflow)`;
              callback(
                endToResults.affectedRows > 0,
                crossCategoryWarningMessage
                  ? `${baseMessage}. Tahadhari: ${crossCategoryWarningMessage}`
                  : baseMessage
              );
            });
            return;
          }
          if (error) {
            console.log(error);
            callback(false, `Haujafanikiwa ${action} Utendaji Kazi (Workflow) ` + error.code);
            return;
          }
          const baseMessage = `Umefanikiwa ${action} Utendaji Kazi (Workflow)`;
          callback(
            results.affectedRows > 0,
            crossCategoryWarningMessage
              ? `${baseMessage}. Tahadhari: ${crossCategoryWarningMessage}`
              : baseMessage
          );
        });
        return;
      }

      const payload = payloads[index];
      const categoryKey = String(payload.application_category_id || "");
      const pendingOrders = pendingOrdersByCategory[categoryKey] || [];
      const pendingStartFrom = pendingStartFromByCategory[categoryKey] || [];
      module.exports.validateOptionalWorkflowRules(payload, null, (optionalValid, optionalMessage) => {
        if (!optionalValid) {
          callback(false, optionalMessage);
          return;
        }

      module.exports.validateUniqueWorkflowFlags(payload, null, pendingOrders, pendingStartFrom, (isValid, message) => {
        if (!isValid) {
          callback(false, message);
          return;
        }

        pendingOrdersByCategory[categoryKey] = pendingOrders.concat(Number(payload._order || 0));
        pendingStartFromByCategory[categoryKey] = pendingStartFrom.concat(Number(payload.unit_id || 0));
        validatePayloadAt(index + 1);
      });
      });
    };

    module.exports.validateNoIncompleteOtherCategory(
      payloads.map((payload) => Number(payload.application_category_id || 0)),
      (isAllowed, validationMessage) => {
        if (!isAllowed && validationMessage) {
          crossCategoryWarningMessage = validationMessage;
        }
        validatePayloadAt(0);
      }
    );
  },
  //******** FIND WORKFLOW *******************************
  findWorkflow: (id, callback) => {
    const modernSql = `SELECT id, application_category_id, unit_id, _order,
            unit_id, role_id, is_start, is_final, can_assign, can_approve, can_return,
            COALESCE(is_optional,0) AS is_optional, optional_type, returns_to_step_order,
            COALESCE(returns_to_approver,0) AS returns_to_approver
       FROM workflows WHERE id = ? AND deleted_at IS NULL`;
    const compatibilitySql = `SELECT id, application_category_id, unit_id, _order,
            unit_id, role_id, is_start, is_final, can_assign, can_approve, can_return,
            COALESCE(is_optional,0) AS is_optional, optional_type, NULL AS returns_to_step_order,
            COALESCE(returns_to_approver,0) AS returns_to_approver
       FROM workflows WHERE id = ? AND deleted_at IS NULL`;
    const legacySql = `SELECT id, application_category_id, unit_id, _order,
            unit_id, role_id, is_start, is_final, can_assign, can_approve, can_return,
            0 AS is_optional, NULL AS optional_type, NULL AS returns_to_step_order, 0 AS returns_to_approver
       FROM workflows WHERE id = ? AND deleted_at IS NULL`;
    const params = [Number(id)];
    db.query(modernSql, params, (error, workflow) => {
      if (error && error.code === "ER_BAD_FIELD_ERROR") {
        db.query(compatibilitySql, params, (compatError, compatWorkflow) => {
          if (compatError && compatError.code === "ER_BAD_FIELD_ERROR") {
            db.query(legacySql, params, (fallbackError, fallbackWorkflow) => {
              if (fallbackError) {
                console.log("Error", fallbackError);
                callback(fallbackError, false, null);
                return;
              }
              const rows = Array.isArray(fallbackWorkflow) ? fallbackWorkflow : [];
              const success = rows.length > 0;
              callback(null, success, success ? rows[0] : null);
            });
            return;
          }
          if (compatError) {
            console.log("Error", compatError);
            callback(compatError, false, null);
            return;
          }
          const rows = Array.isArray(compatWorkflow) ? compatWorkflow : [];
          const success = rows.length > 0;
          callback(null, success, success ? rows[0] : null);
        });
        return;
      }
      if (error) {
        console.log("Error", error);
        callback(error, false, null);
        return;
      }
      const rows = Array.isArray(workflow) ? workflow : [];
      const success = rows.length > 0;
      callback(null, success, success ? rows[0] : null);
    });
  },

  //******** UPDATE WORKFLOW *******************************
  updateWorkflow: (req, id , data, callback) => {
    const workflowId = Number(id);
    if (!Number.isFinite(workflowId) || workflowId <= 0) {
      callback(false, "ID ya workflow si sahihi.");
      return;
    }

    const payload = module.exports.buildWorkflowPayload(data);
    const actorId = module.exports.resolveActorId(req);

    db.query(
      `SELECT id, application_category_id, _order
       FROM workflows
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [workflowId],
      (findError, rows) => {
        if (findError) {
          console.log(findError);
          callback(false, "Imeshindikana kupata workflow unayotaka kubadili.");
          return;
        }

        const currentWorkflow = Array.isArray(rows) && rows.length ? rows[0] : null;
        if (!currentWorkflow) {
          callback(false, "Workflow haijapatikana.");
          return;
        }

        const currentCategoryId = Number(currentWorkflow.application_category_id || 0);
        const currentOrder = Number(currentWorkflow._order || 0);
        const targetCategoryId = Number(payload.application_category_id || 0);
        const targetOrder = Number(payload._order || 0);

        db.beginTransaction((txError) => {
          if (txError) {
            console.log(txError);
            callback(false, "Imeshindikana kuanzisha mchakato wa kubadili workflow.");
            return;
          }

          const rollbackWithMessage = (message) => {
            db.rollback(() => {
              callback(false, message);
            });
          };

          const runValidationAndSave = () => {
            module.exports.validateOptionalWorkflowRules(payload, workflowId, (optionalValid, optionalMessage) => {
              if (!optionalValid) {
                rollbackWithMessage(optionalMessage);
                return;
              }
            module.exports.validateUniqueWorkflowFlags(payload, workflowId, [], [], (isValid, message) => {
              if (!isValid) {
                rollbackWithMessage(message);
                return;
              }

              const modernUpdateSql = `UPDATE workflows 
                 SET application_category_id = ? , _order = ? ,
                     unit_id = ?, role_id = ?, is_start = ?, is_final = ?, can_assign = ?, can_approve = ?, can_return = ?,
                     is_optional = ?, optional_type = ?, returns_to_step_order = ?, returns_to_approver = ?,
                     updated_by = ?, updated_at = ? 
                 WHERE id = ? AND deleted_at IS NULL`;
              const modernUpdateParams = [
                payload.application_category_id,
                payload._order,
                payload.unit_id,
                payload.role_id,
                payload.is_start,
                payload.is_final,
                payload.can_assign,
                payload.can_approve,
                payload.can_return,
                payload.is_optional,
                payload.optional_type,
                payload.returns_to_step_order,
                payload.returns_to_approver,
                actorId,
                formatDate(new Date()),
                workflowId
              ];
              const legacyUpdateSql = `UPDATE workflows 
                 SET application_category_id = ? , _order = ? ,
                     unit_id = ?, role_id = ?, is_start = ?, is_final = ?, can_assign = ?, can_approve = ?, can_return = ?,
                     updated_by = ?, updated_at = ? 
                 WHERE id = ? AND deleted_at IS NULL`;
              const compatibilityUpdateSql = `UPDATE workflows 
                 SET application_category_id = ? , _order = ? ,
                     unit_id = ?, role_id = ?, is_start = ?, is_final = ?, can_assign = ?, can_approve = ?, can_return = ?,
                     is_optional = ?, optional_type = ?, returns_to_approver = ?,
                     updated_by = ?, updated_at = ? 
                 WHERE id = ? AND deleted_at IS NULL`;
              const legacyUpdateParams = [
                payload.application_category_id,
                payload._order,
                payload.unit_id,
                payload.role_id,
                payload.is_start,
                payload.is_final,
                payload.can_assign,
                payload.can_approve,
                payload.can_return,
                actorId,
                formatDate(new Date()),
                workflowId
              ];
              const compatibilityUpdateParams = [
                payload.application_category_id,
                payload._order,
                payload.unit_id,
                payload.role_id,
                payload.is_start,
                payload.is_final,
                payload.can_assign,
                payload.can_approve,
                payload.can_return,
                payload.is_optional,
                payload.optional_type,
                payload.returns_to_approver,
                actorId,
                formatDate(new Date()),
                workflowId
              ];

              db.query(modernUpdateSql, modernUpdateParams, (updateError, results) => {
                  if (updateError && updateError.code === "ER_BAD_FIELD_ERROR") {
                    db.query(compatibilityUpdateSql, compatibilityUpdateParams, (compatibilityError, compatibilityResults) => {
                      if (compatibilityError && compatibilityError.code === "ER_BAD_FIELD_ERROR") {
                        db.query(legacyUpdateSql, legacyUpdateParams, (legacyUpdateError, legacyResults) => {
                          if (legacyUpdateError) {
                            console.log(legacyUpdateError);
                            rollbackWithMessage(
                              "Haujafanikiwa Kubadili Utendaji Kazi (Workflow) " + legacyUpdateError.code
                            );
                            return;
                          }

                          db.commit((commitError) => {
                            if (commitError) {
                              console.log(commitError);
                              rollbackWithMessage("Imeshindikana kukamilisha mabadiliko ya workflow.");
                              return;
                            }

                            callback(
                              Number(legacyResults?.affectedRows || 0) > 0,
                              "Umefanikiwa Kubadili Utendaji Kazi (Workflow)"
                            );
                          });
                        });
                        return;
                      }
                      if (compatibilityError) {
                        console.log(compatibilityError);
                        rollbackWithMessage(
                          "Haujafanikiwa Kubadili Utendaji Kazi (Workflow) " + compatibilityError.code
                        );
                        return;
                      }

                      db.commit((commitError) => {
                        if (commitError) {
                          console.log(commitError);
                          rollbackWithMessage("Imeshindikana kukamilisha mabadiliko ya workflow.");
                          return;
                        }

                        callback(
                          Number(compatibilityResults?.affectedRows || 0) > 0,
                          "Umefanikiwa Kubadili Utendaji Kazi (Workflow)"
                        );
                      });
                    });
                    return;
                  }
                  if (updateError) {
                    console.log(updateError);
                    rollbackWithMessage(
                      "Haujafanikiwa Kubadili Utendaji Kazi (Workflow) " + updateError.code
                    );
                    return;
                  }

                  db.commit((commitError) => {
                    if (commitError) {
                      console.log(commitError);
                      rollbackWithMessage("Imeshindikana kukamilisha mabadiliko ya workflow.");
                      return;
                    }

                    callback(
                      Number(results?.affectedRows || 0) > 0,
                      "Umefanikiwa Kubadili Utendaji Kazi (Workflow)"
                    );
                  });
                }
              );
            });
            });
          };

          const reorderWithinSameCategory = () => {
            const now = formatDate(new Date());
            db.query(
              `SELECT id, _order
               FROM workflows
               WHERE deleted_at IS NULL
                 AND application_category_id = ?
                 AND id <> ?
               ORDER BY _order ASC, id ASC`,
              [targetCategoryId, workflowId],
              (listError, rows) => {
                if (listError) {
                  console.log(listError);
                  rollbackWithMessage("Imeshindikana kupanga upya Step Order.");
                  return;
                }

                const otherRows = Array.isArray(rows) ? rows : [];
                const maxTargetOrder = otherRows.length + 1;
                const safeTargetOrder = Math.max(1, Math.min(Number(targetOrder || 1), maxTargetOrder));
                payload._order = safeTargetOrder;

                const plannedUpdates = otherRows.map((row, index) => {
                  let nextOrder = index + 1;
                  if (nextOrder >= safeTargetOrder) {
                    nextOrder += 1;
                  }
                  return {
                    id: Number(row.id || 0),
                    currentOrder: Number(row._order || 0),
                    nextOrder,
                  };
                }).filter((row) => row.id > 0);

                const changedRows = plannedUpdates.filter((row) => row.currentOrder !== row.nextOrder);
                if (!changedRows.length) {
                  runValidationAndSave();
                  return;
                }

                const caseSql = changedRows
                  .map((row) => `WHEN ${row.id} THEN ${row.nextOrder}`)
                  .join(" ");
                const idListSql = changedRows.map((row) => row.id).join(",");

                db.query(
                  `UPDATE workflows
                   SET _order = CASE id ${caseSql} END,
                       updated_by = ?,
                       updated_at = ?
                   WHERE id IN (${idListSql})`,
                  [actorId, now],
                  (shiftError) => {
                    if (shiftError) {
                      console.log(shiftError);
                      rollbackWithMessage("Imeshindikana kupanga upya Step Order.");
                      return;
                    }
                    runValidationAndSave();
                  }
                );
              }
            );
          };

          const reorderAcrossCategories = () => {
            const now = formatDate(new Date());
            db.query(
              `UPDATE workflows
               SET _order = _order - 1, updated_by = ?, updated_at = ?
               WHERE deleted_at IS NULL
                 AND application_category_id = ?
                 AND _order > ?`,
              [actorId, now, currentCategoryId, currentOrder],
              (compactError) => {
                if (compactError) {
                  console.log(compactError);
                  rollbackWithMessage("Imeshindikana kusawazisha Step Order za category ya sasa.");
                  return;
                }

                db.query(
                  `UPDATE workflows
                   SET _order = _order + 1, updated_by = ?, updated_at = ?
                   WHERE deleted_at IS NULL
                     AND application_category_id = ?
                     AND _order >= ?`,
                  [actorId, now, targetCategoryId, targetOrder],
                  (expandError) => {
                    if (expandError) {
                      console.log(expandError);
                      rollbackWithMessage("Imeshindikana kutengeneza nafasi ya Step Order kwenye category mpya.");
                      return;
                    }
                    runValidationAndSave();
                  }
                );
              }
            );
          };

          if (targetCategoryId === currentCategoryId) {
            reorderWithinSameCategory();
            return;
          }

          reorderAcrossCategories();
        });
      }
    );
  },

  //******** DELETE WORKFLOW *******************************
  deleteWorkflow: (req, id, callback) => {
    var success = false;
    const actorId = module.exports.resolveActorId(req);
    db.query(
      `UPDATE workflows
       SET deleted_at = ?, updated_at = ?, updated_by = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [formatDate(new Date()), formatDate(new Date()), actorId, id],
      (error, deletedAlgorthm) => {
        if (error) {
          console.log(error);
        }
        if (deletedAlgorthm?.affectedRows > 0) {
          success = true;
        }
        callback(success);
      }
    );
  },

  //******** RESTORE WORKFLOW *******************************
  restoreWorkflow: (req, id, callback) => {
    const workflowId = Number(id);
    if (!Number.isFinite(workflowId) || workflowId <= 0) {
      callback(false, "ID ya workflow si sahihi.");
      return;
    }

    const actorId = module.exports.resolveActorId(req);
    const now = formatDate(new Date());

    db.query(
      `SELECT id, application_category_id, _order, unit_id, is_final
       FROM workflows
       WHERE id = ? AND deleted_at IS NOT NULL
       LIMIT 1`,
      [workflowId],
      (error, rows) => {
        if (error) {
          console.log(error);
          callback(false, "Imeshindikana kuhakiki workflow ya kurejesha.");
          return;
        }

        const workflow = Array.isArray(rows) && rows.length ? rows[0] : null;
        if (!workflow) {
          callback(false, "Workflow hii haipo kwenye orodha ya zilizofutwa.");
          return;
        }

        db.query(
          `SELECT COUNT(*) AS num_rows
           FROM workflows
           WHERE deleted_at IS NULL
             AND application_category_id = ?
             AND _order = ?
             AND unit_id = ?`,
          [
            Number(workflow.application_category_id || 0),
            Number(workflow._order || 0),
            Number(workflow.unit_id || 0),
          ],
          (existsError, existsRows) => {
            if (existsError) {
              console.log(existsError);
              callback(false, "Imeshindikana kuhakiki ulinganifu wa workflow.");
              return;
            }

            if (Number(existsRows?.[0]?.num_rows || 0) > 0) {
              callback(
                false,
                "Workflow hii tayari ipo kwenye active list, haiwezi kurejeshwa."
              );
              return;
            }

            const finalizeRestore = () => {
              db.query(
                `UPDATE workflows
                 SET deleted_at = NULL, updated_at = ?, updated_by = ?
                 WHERE id = ? AND deleted_at IS NOT NULL`,
                [now, actorId, workflowId],
                (updateError, updatedWorkflow) => {
                  if (updateError) {
                    console.log(updateError);
                    callback(false, "Imeshindikana kurejesha workflow.");
                    return;
                  }

                  const success = Number(updatedWorkflow?.affectedRows || 0) > 0;
                  callback(
                    success,
                    success
                      ? "Umefanikiwa kurejesha mtiririko wa utendaji kazi."
                      : "Haujafanikiwa kurejesha mtiririko wa utendaji kazi."
                  );
                }
              );
            };

            if (Number(workflow.is_final || 0) !== 1) {
              finalizeRestore();
              return;
            }

            db.query(
              `SELECT COUNT(*) AS num_rows
               FROM workflows
               WHERE deleted_at IS NULL
                 AND application_category_id = ?
                 AND is_final = 1`,
              [Number(workflow.application_category_id || 0)],
              (finalError, finalRows) => {
                if (finalError) {
                  console.log(finalError);
                  callback(false, "Imeshindikana kuhakiki hatua ya mwisho (is_final).");
                  return;
                }

                if (Number(finalRows?.[0]?.num_rows || 0) > 0) {
                  callback(
                    false,
                    "Workflow hii tayari ina anyehitimisha. Iondoe ya sasa kwenye active workflow kwanza ndipo urejeshe hii."
                  );
                  return;
                }

                finalizeRestore();
              }
            );
          }
        );
      }
    );
  },
};
