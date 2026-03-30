require("dotenv").config();
const express = require("express");
const handoverRouter = express.Router();
const { isAuth } = require("../utils");
const HandoverService = require("../src/Services/HandoverService");

const success = (res, payload = {}) => {
  res.send({
    statusCode: 300,
    ...payload,
  });
};

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  return ["1", "true", "yes", "y", "on"].includes(String(value).trim().toLowerCase());
};

const failure = (res, error, fallbackMessage = "Operation failed") => {
  const statusCode = Number(error?.statusCode || 306);
  res.status(200).send({
    statusCode,
    message: error?.message || fallbackMessage,
  });
};

const parseHandoverPayload = (body = {}) => {
  const legacyStaff = body?.staff;
  const directToUser = body?.to_user_id;
  const toUserId = Number.parseInt(directToUser || legacyStaff, 10);

  let startAt = body?.start_at || null;
  let endAt = body?.end_at || null;

  if ((!startAt || !endAt) && body?.dates) {
    const parsed = HandoverService.parseLegacyDateRangeInput(body.dates);
    startAt = parsed.startAt;
    endAt = parsed.endAt;
  }

  return {
    toUserId,
    reason: body?.reason,
    notes: body?.notes,
    scopeType: body?.scope_type || body?.scopeType || HandoverService.SCOPE.TASKS_ONLY,
    startAt,
    endAt,
    saveAsDraft: Boolean(body?.save_as_draft || body?.saveAsDraft),
    autoApprove: Boolean(body?.auto_approve || body?.autoApprove),
  };
};

const canApproveHandover = (user = {}) => {
  const permissions = Array.isArray(user?.userPermissions) ? user.userPermissions : [];
  const normalized = permissions.map((permission) => String(permission || "").toLowerCase());
  const role = String(user?.jukumu || "").toLowerCase();

  if (normalized.includes("approve-handover")) return true;
  if (normalized.includes("update-handover")) return true;
  if (["super admin", "super-admin", "admin"].includes(role)) return true;

  return false;
};

const canViewAllHandovers = (user = {}) => {
  if (canApproveHandover(user)) return true;
  const permissions = Array.isArray(user?.userPermissions) ? user.userPermissions : [];
  const normalized = permissions.map((permission) => String(permission || "").toLowerCase());
  return normalized.includes("view-handover") || normalized.includes("view-audit");
};

const parseListFilters = (req = {}) => ({
  page: req.query?.page,
  perPage: req.query?.per_page || req.query?.perPage,
  status: req.query?.status,
  scopeType: req.query?.scope_type || req.query?.scopeType,
  fromDate: req.query?.from_date || req.query?.fromDate,
  toDate: req.query?.to_date || req.query?.toDate,
});

handoverRouter.get("/handover-list", isAuth, async (req, res) => {
  try {
    const perPage = Number.parseInt(req.query.per_page || req.body?.per_page, 10) || 10;
    const page = Number.parseInt(req.query.page || req.body?.page, 10) || 1;

    const list = await HandoverService.listHandoversByOwner({
      ownerId: req.user?.id,
      page,
      perPage,
      ...parseListFilters(req),
    });

    const context = await HandoverService.resolveDelegationContextForUser(req.user?.id, {
      autoTransition: true,
    });

    const handovers = (list.rows || []).map((row) => ({
      ...row,
      // legacy compatibility for existing admin profile UI table
      name: row.to_user_name,
      start: row.start_at,
      end: row.end_at,
      active: String(row.status) === HandoverService.STATUS.ACTIVE ? 1 : 0,
    }));

    success(res, {
      handovers,
      activeHandover: Boolean(context.hasOutgoingActiveHandover),
      numRows: Number(list.total || 0),
    });
  } catch (error) {
    failure(res, error, "Failed to fetch handover list.");
  }
});

handoverRouter.post("/my-active-handover", isAuth, async (req, res) => {
  try {
    const context = await HandoverService.resolveDelegationContextForUser(req.user?.id, {
      autoTransition: true,
    });

    success(res, {
      active: Boolean(context.hasOutgoingActiveHandover),
      outgoing_handover: context.activeOutgoingHandovers?.[0] || null,
    });
  } catch (error) {
    failure(res, error, "Failed to fetch active handover status.");
  }
});

handoverRouter.post("/handover", isAuth, async (req, res) => {
  try {
    const payload = parseHandoverPayload(req.body || {});
    const autoApproveTasksOnlyEnabled = toBool(process.env.HANDOVER_AUTO_APPROVE_TASKS_ONLY, false);
    const requiresApproval = payload.saveAsDraft
      ? false
      : HandoverService.shouldRequireApprovalForRequest({
          scopeType: payload.scopeType,
          user: req.user,
          autoApproveTasksOnlyEnabled,
        });

    const created = await HandoverService.createHandover({
      fromUserId: req.user?.id,
      toUserId: payload.toUserId,
      reason: payload.reason,
      notes: payload.notes,
      scopeType: payload.scopeType,
      startAt: payload.startAt,
      endAt: payload.endAt,
      createdBy: req.user?.id,
      initialStatus: payload.saveAsDraft
        ? HandoverService.STATUS.DRAFT
        : HandoverService.STATUS.PENDING_APPROVAL,
    });

    if (payload.saveAsDraft) {
      return success(res, {
        message: "Handover draft saved successfully.",
        handover: created,
      });
    }

    if (!requiresApproval) {
      await HandoverService.approveHandover({
        handoverId: created?.id,
        approverId: req.user?.id,
      });

      return success(res, {
        message: "Handover auto-approved by policy and processed successfully.",
      });
    }

    if (payload.autoApprove && canApproveHandover(req.user)) {
      await HandoverService.approveHandover({
        handoverId: created?.id,
        approverId: req.user?.id,
      });

      return success(res, {
        message: "Handover created, approved, and processed successfully.",
      });
    }

    return success(res, {
      message: "Handover submitted successfully and is waiting for approval.",
    });
  } catch (error) {
    failure(res, error, "Haujafanikiwa kuanzisha handover.");
  }
});

handoverRouter.put("/handover/:id", isAuth, async (req, res) => {
  try {
    const payload = parseHandoverPayload(req.body || {});
    const updated = await HandoverService.updateHandover({
      handoverId: req.params.id,
      actorId: req.user?.id,
      toUserId: payload.toUserId,
      reason: payload.reason,
      notes: payload.notes,
      scopeType: payload.scopeType,
      startAt: payload.startAt,
      endAt: payload.endAt,
    });

    success(res, {
      message: "Handover updated successfully.",
      handover: updated,
    });
  } catch (error) {
    failure(res, error, "Failed to update handover.");
  }
});

handoverRouter.put("/handover/:id/submit", isAuth, async (req, res) => {
  try {
    const handover = await HandoverService.submitHandover({
      handoverId: req.params.id,
      actorId: req.user?.id,
    });

    success(res, {
      message: "Handover submitted for approval.",
      handover,
    });
  } catch (error) {
    failure(res, error, "Failed to submit handover.");
  }
});

handoverRouter.put("/stop-handover", isAuth, async (req, res) => {
  try {
    const latest = await HandoverService.findLatestOwnerOpenHandover(req.user?.id);

    if (!latest) {
      return res.send({
        statusCode: 306,
        message: "Hakuna handover ya kusimamisha.",
      });
    }

    if (String(latest.status) === HandoverService.STATUS.ACTIVE) {
      await HandoverService.reclaimHandover({
        handoverId: latest.id,
        reclaimedBy: req.user?.id,
      });

      return success(res, {
        message: "Umefanikiwa kurejesha majukumu yako (handover reclaimed).",
      });
    }

    await HandoverService.cancelHandover({
      handoverId: latest.id,
      cancelledBy: req.user?.id,
    });

    return success(res, {
      message: "Umefanikiwa kusitisha handover kabla ya kuanza.",
    });
  } catch (error) {
    failure(res, error, "Haujafanikiwa kusitisha handover.");
  }
});

handoverRouter.get("/handover-pending-approvals", isAuth, async (req, res) => {
  try {
    if (!canApproveHandover(req.user)) {
      return res.status(403).send({
        statusCode: 403,
        message: "403 Forbidden",
      });
    }

    const perPage = Number.parseInt(req.query.per_page || req.body?.per_page, 10) || 10;
    const page = Number.parseInt(req.query.page || req.body?.page, 10) || 1;

    const list = await HandoverService.listPendingApprovals({
      page,
      perPage,
    });

    success(res, {
      handovers: list.rows,
      numRows: Number(list.total || 0),
    });
  } catch (error) {
    failure(res, error, "Failed to fetch pending handover approvals.");
  }
});

handoverRouter.put("/handover/:id/approve", isAuth, async (req, res) => {
  try {
    if (!canApproveHandover(req.user)) {
      return res.status(403).send({
        statusCode: 403,
        message: "403 Forbidden",
      });
    }

    await HandoverService.approveHandover({
      handoverId: req.params.id,
      approverId: req.user?.id,
    });

    success(res, {
      message: "Handover approved successfully.",
    });
  } catch (error) {
    failure(res, error, "Failed to approve handover.");
  }
});

handoverRouter.put("/handover/:id/reject", isAuth, async (req, res) => {
  try {
    if (!canApproveHandover(req.user)) {
      return res.status(403).send({
        statusCode: 403,
        message: "403 Forbidden",
      });
    }

    await HandoverService.rejectHandover({
      handoverId: req.params.id,
      rejectedBy: req.user?.id,
      reason: req.body?.reason,
    });

    success(res, {
      message: "Handover rejected successfully.",
    });
  } catch (error) {
    failure(res, error, "Failed to reject handover.");
  }
});

handoverRouter.put("/handover/:id/cancel", isAuth, async (req, res) => {
  try {
    await HandoverService.cancelHandover({
      handoverId: req.params.id,
      cancelledBy: req.user?.id,
    });

    success(res, {
      message: "Handover cancelled successfully.",
    });
  } catch (error) {
    failure(res, error, "Failed to cancel handover.");
  }
});

handoverRouter.put("/handover/:id/reclaim", isAuth, async (req, res) => {
  try {
    await HandoverService.reclaimHandover({
      handoverId: req.params.id,
      reclaimedBy: req.user?.id,
    });

    success(res, {
      message: "Handover reclaimed successfully.",
    });
  } catch (error) {
    failure(res, error, "Failed to reclaim handover.");
  }
});

handoverRouter.get("/handover-assigned-list", isAuth, async (req, res) => {
  try {
    const list = await HandoverService.listHandoversAssignedToUser({
      delegateId: req.user?.id,
      ...parseListFilters(req),
    });

    success(res, {
      handovers: list.rows,
      numRows: Number(list.total || 0),
    });
  } catch (error) {
    failure(res, error, "Failed to fetch assigned handovers.");
  }
});

handoverRouter.get("/handover-all-list", isAuth, async (req, res) => {
  try {
    if (!canViewAllHandovers(req.user)) {
      return res.status(403).send({
        statusCode: 403,
        message: "403 Forbidden",
      });
    }

    const list = await HandoverService.listAllHandovers({
      ...parseListFilters(req),
    });

    success(res, {
      handovers: list.rows,
      numRows: Number(list.total || 0),
    });
  } catch (error) {
    failure(res, error, "Failed to fetch handovers.");
  }
});

handoverRouter.get("/handover/:id/details", isAuth, async (req, res) => {
  try {
    const handover = await HandoverService.getHandoverDetailsById(req.params.id);
    if (!handover) {
      return res.send({
        statusCode: 404,
        message: "Handover not found.",
      });
    }

    const userId = Number(req.user?.id || 0);
    const allowed = canViewAllHandovers(req.user)
      || Number(handover.from_user_id) === userId
      || Number(handover.to_user_id) === userId
      || Number(handover.approved_by) === userId;

    if (!allowed) {
      return res.status(403).send({
        statusCode: 403,
        message: "403 Forbidden",
      });
    }

    success(res, { handover });
  } catch (error) {
    failure(res, error, "Failed to fetch handover details.");
  }
});

handoverRouter.get("/handover/:id/audits", isAuth, async (req, res) => {
  try {
    const handover = await HandoverService.getHandoverDetailsById(req.params.id);
    if (!handover) {
      return res.send({
        statusCode: 404,
        message: "Handover not found.",
      });
    }

    const userId = Number(req.user?.id || 0);
    const allowed = canViewAllHandovers(req.user)
      || Number(handover.from_user_id) === userId
      || Number(handover.to_user_id) === userId
      || Number(handover.approved_by) === userId;

    if (!allowed) {
      return res.status(403).send({
        statusCode: 403,
        message: "403 Forbidden",
      });
    }

    const list = await HandoverService.listHandoverAudits({
      handoverId: req.params.id,
      page: req.query?.page,
      perPage: req.query?.per_page,
    });

    success(res, {
      audits: list.rows,
      numRows: Number(list.total || 0),
    });
  } catch (error) {
    failure(res, error, "Failed to fetch handover audits.");
  }
});

handoverRouter.get("/handover-audit-list", isAuth, async (req, res) => {
  try {
    const list = canViewAllHandovers(req.user)
      ? await HandoverService.listAllHandoverAudits({
          page: req.query?.page,
          perPage: req.query?.per_page,
          status: req.query?.status,
        })
      : await HandoverService.listUserHandoverAudits({
          userId: req.user?.id,
          page: req.query?.page,
          perPage: req.query?.per_page,
          status: req.query?.status,
        });

    success(res, {
      audits: list.rows,
      numRows: Number(list.total || 0),
    });
  } catch (error) {
    failure(res, error, "Failed to fetch handover audit trail.");
  }
});

handoverRouter.post("/handover/run-maintenance", isAuth, async (req, res) => {
  try {
    if (!canApproveHandover(req.user)) {
      return res.status(403).send({
        statusCode: 403,
        message: "403 Forbidden",
      });
    }

    const result = await HandoverService.runMaintenance();
    success(res, {
      message: "Handover maintenance completed.",
      ...result,
    });
  } catch (error) {
    failure(res, error, "Failed to run handover maintenance.");
  }
});

module.exports = handoverRouter;
