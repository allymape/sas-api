const db = require("../Config/DbConfig");
const { QueryTypes } = require("sequelize");

const ACTIONS = {
  ASSIGN: "Assign",
  REVIEW: "Review",
  FORWARD: "Forward",
  APPROVE: "Approve",
  REJECT: "Reject",
  RETURN: "Return",
  RETURN_BACK: "Return_back",
};

const FINAL_ROLE_PATTERN = /(commissioner|kamishna|^ke$| elimu)/i;

const STAFF_PROFILE_SQL = `
  SELECT s.id,
         s.name,
         s.email,
         s.user_status,
         s.office,
         s.zone_id,
         s.region_code,
         s.district_code,
         s.new_role_id,
         s.user_level,
         r.name AS role_name,
         r.vyeoId AS vyeo_id,
         v.rank_name AS designation_name,
         v.rank_level,
         rm.role_name AS management_role_name
    FROM staffs s
    LEFT JOIN roles r ON r.id = s.user_level
    LEFT JOIN vyeo v ON v.id = r.vyeoId
    LEFT JOIN role_management rm ON rm.id = s.new_role_id
   WHERE s.user_status = 1
`;

const toNumber = (value) => {
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) ? num : null;
};

const normalizeStaffProfile = (row) => {
  if (!row) return null;
  return {
    id: toNumber(row.id),
    name: row.name || "",
    email: row.email || "",
    office: String(row.office || ""),
    zone_id: row.zone_id || null,
    region_code: row.region_code || null,
    district_code: row.district_code || null,
    new_role_id: toNumber(row.new_role_id),
    user_level: toNumber(row.user_level),
    role_name: row.role_name || null,
    management_role_name: row.management_role_name || null,
    vyeo_id: toNumber(row.vyeo_id),
    designation_name: row.designation_name || null,
    rank_level: toNumber(row.rank_level),
  };
};

const matchesOfficeScope = (baseStaff, candidate) => {
  if (!baseStaff || !candidate) return false;
  if (String(baseStaff.office || "") !== String(candidate.office || "")) return false;

  if (baseStaff.district_code) {
    return String(baseStaff.district_code) === String(candidate.district_code || "");
  }

  if (baseStaff.region_code) {
    return String(baseStaff.region_code) === String(candidate.region_code || "");
  }

  if (baseStaff.zone_id) {
    return String(baseStaff.zone_id) === String(candidate.zone_id || "");
  }

  return true;
};

const isFinalApprover = (staff) => {
  const text = [staff?.role_name, staff?.management_role_name, staff?.designation_name]
    .filter(Boolean)
    .join(" ");
  return FINAL_ROLE_PATTERN.test(text);
};

const hasAssignStaffPermission = (user = {}) => {
  const permissions = Array.isArray(user?.userPermissions) ? user.userPermissions : [];
  return permissions.some(
    (permission) => String(permission || "").trim().toLowerCase() === "assign-staff",
  );
};

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();
const toActionCode = (value = "") =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

class WorkflowHelper {
  static async getActionTypes() {
    const rows = await db.query(
      `SELECT id, code, name, description
       FROM action_types
       WHERE deleted_at IS NULL
       ORDER BY id ASC`,
      { type: QueryTypes.SELECT },
    );

    return Array.isArray(rows) ? rows : [];
  }

  static async getStaffProfile(staffId) {
    const parsedId = toNumber(staffId);
    if (!parsedId) return null;

    const rows = await db.query(`${STAFF_PROFILE_SQL} AND s.id = :staffId LIMIT 1`, {
      type: QueryTypes.SELECT,
      replacements: { staffId: parsedId },
    });

    return normalizeStaffProfile(rows[0]);
  }

  static async getScopedStaff(baseStaff) {
    if (!baseStaff?.id) return [];

    const rows = await db.query(STAFF_PROFILE_SQL, {
      type: QueryTypes.SELECT,
    });

    return rows
      .map(normalizeStaffProfile)
      .filter((candidate) => candidate?.id && matchesOfficeScope(baseStaff, candidate));
  }

  static async getImmediateSupervisor(staff) {
    if (!staff?.id) return null;

    const scoped = await this.getScopedStaff(staff);
    const supervisors = scoped
      .filter((candidate) => candidate.id !== staff.id)
      .filter((candidate) => {
        if (staff.vyeo_id && candidate.vyeo_id) {
          return candidate.vyeo_id > staff.vyeo_id;
        }
        return false;
      })
      .sort((left, right) => left.vyeo_id - right.vyeo_id || left.id - right.id);

    return supervisors[0] || null;
  }

  static async getAssignableStaff(actor) {
    if (!actor?.id) return [];

    const scoped = await this.getScopedStaff(actor);
    return scoped
      .filter((candidate) => candidate.id !== actor.id)
      .filter((candidate) => {
        if (actor.vyeo_id && candidate.vyeo_id) {
          return candidate.vyeo_id < actor.vyeo_id;
        }
        return false;
      })
      .sort((left, right) => right.vyeo_id - left.vyeo_id || left.name.localeCompare(right.name))
      .map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        role_name: candidate.role_name || candidate.designation_name || "-",
      }));
  }

  static async getUnitAssignableStaff(actor, unitId) {
    if (!actor?.id || !unitId) return [];

    const scoped = await this.getScopedStaff(actor);
    return scoped
      .filter((candidate) => candidate.id !== actor.id)
      .filter((candidate) => Number(candidate.vyeo_id) === Number(unitId))
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        role_name: candidate.role_name || candidate.designation_name || "-",
      }));
  }

  static async getReturnStaff(application, actor) {
    const comments = Array.isArray(application?.comments) ? application.comments : [];
    const actorId = toNumber(actor?.id);
    if (!actorId) return null;

    for (let index = comments.length - 1; index >= 0; index -= 1) {
      const comment = comments[index];
      const receiverId = toNumber(comment?.user_to);
      const senderId = toNumber(comment?.user_from);
      if (receiverId === actorId && senderId && senderId !== actorId) {
        return this.getStaffProfile(senderId);
      }
    }

    return null;
  }

  static async getWorkflowContext(application, actorId, currentUser = {}) {
    const actor = await this.getStaffProfile(actorId);
    if (!application || !actor) {
      return {
        actor: null,
        is_current_assignee: false,
        is_unit_supervisor: false,
        can_comment: false,
        allowed_actions: [],
        action_labels: {},
        action_types: [],
        assignable_staff: [],
        final_approver: false,
      };
    }

    const currentProcess = application?.current_process
      || application?.get?.("current_process")
      || null;
    const workflowSteps = application?.workflow_steps
      || application?.get?.("workflow_steps")
      || [];
    const currentWorkflowId = toNumber(currentProcess?.workflow_id);
    const currentWorkflowStep = Array.isArray(workflowSteps)
      ? workflowSteps.find((step) => toNumber(step?.workflow_id) === currentWorkflowId)
      : null;
    const currentStepIsFinal = toNumber(currentWorkflowStep?.is_final) === 1;
    const currentStepCanApprove = toNumber(currentWorkflowStep?.can_approve) === 1;
    const currentStepCanReturn = toNumber(currentWorkflowStep?.can_return) === 1;
    const currentWorkflowUnitId = toNumber(currentWorkflowStep?.unit_id);
    const currentProcessStatus = normalizeStatus(currentProcess?.status || currentProcess?.process_status);
    const currentProcessAssignedTo = toNumber(currentProcess?.assigned_to);
    const actorSectionId = toNumber(currentUser?.section_id) || actor.vyeo_id;
    const canAssignStaff = hasAssignStaffPermission(currentUser);
    const canAssignInOwnUnit = Boolean(
      canAssignStaff
      && actorSectionId
      && currentWorkflowUnitId
      && Number(actorSectionId) === Number(currentWorkflowUnitId)
      && ["pending", "in-progress"].includes(currentProcessStatus),
    );
    const canActOnOwnPendingUnit = Boolean(
      actorSectionId
      && currentWorkflowUnitId
      && Number(actorSectionId) === Number(currentWorkflowUnitId)
      && currentProcessStatus === "pending"
      && currentProcessAssignedTo === null,
    );

    const assignedStaff = await this.getStaffProfile(application.staff_id);
    let assignableStaff = [];
    if (canAssignInOwnUnit && currentWorkflowUnitId) {
      assignableStaff = await this.getUnitAssignableStaff(actor, currentWorkflowUnitId);
    }
    if (!assignableStaff.length && canAssignStaff && actor.vyeo_id) {
      assignableStaff = await this.getUnitAssignableStaff(actor, actor.vyeo_id);
    }

    const isCurrentAssignee = currentProcessAssignedTo
      ? currentProcessAssignedTo === actor.id
      : (
        toNumber(application.staff_id) === actor.id
        || canActOnOwnPendingUnit
      );
    const isUnassignedUnitActor = Boolean(
      canActOnOwnPendingUnit
      && !toNumber(application.staff_id)
      && currentProcessAssignedTo === null,
    );
    const finalApprover = Boolean(
      currentStepIsFinal
      && currentStepCanApprove
      && canAssignStaff
    );

    const allowedActions = [];
    if (Number(application?.is_approved) <= 1) {
      if (finalApprover) {
        allowedActions.push(ACTIONS.APPROVE, ACTIONS.REJECT);
        if (currentStepCanReturn) {
          allowedActions.push(ACTIONS.RETURN_BACK);
        }
        if (assignableStaff.length) {
          allowedActions.push(ACTIONS.ASSIGN, ACTIONS.RETURN);
        }
      } else if (isCurrentAssignee) {
        // Action visibility is permission-driven:
        // - without assign-staff -> REVIEW
        // - with assign-staff    -> FORWARD
        if (!canAssignStaff) {
          allowedActions.push(ACTIONS.REVIEW);
        } else {
          allowedActions.push(ACTIONS.FORWARD);
          if (currentStepCanReturn) {
            allowedActions.push(ACTIONS.RETURN_BACK);
          }
          if (assignableStaff.length) {
            allowedActions.push(ACTIONS.ASSIGN, ACTIONS.RETURN);
          }
        }
      } else if (canAssignInOwnUnit && assignableStaff.length) {
        allowedActions.push(ACTIONS.ASSIGN);
      }
    }

    const actionTypes = await this.getActionTypes();
    const actionTypeMap = new Map(
      actionTypes.map((item) => [toActionCode(item?.code), item]),
    );
    const actionLabels = {};
    Object.values(ACTIONS).forEach((action) => {
      const code = toActionCode(action);
      const fromTable = actionTypeMap.get(code);
      if (fromTable?.name) {
        actionLabels[action] = String(fromTable.name).trim();
      }
    });

    return {
      actor,
      assigned_staff: assignedStaff
        ? {
            id: assignedStaff.id,
            name: assignedStaff.name,
            role_name: assignedStaff.role_name || assignedStaff.designation_name || "-",
          }
        : null,
      is_current_assignee: isCurrentAssignee,
      is_unit_supervisor: canAssignInOwnUnit,
      can_comment: isCurrentAssignee || canAssignInOwnUnit,
      allowed_actions: allowedActions,
      action_labels: actionLabels,
      action_types: actionTypes,
      assignable_staff: assignableStaff,
      final_approver: finalApprover,
    };
  }

  static async resolveActionTarget({
    action,
    actor,
    application,
    targetStaffId,
    assignableStaff = [],
  }) {
    if (action === ACTIONS.REVIEW) {
      const supervisor = await this.getImmediateSupervisor(actor);
      if (!supervisor) {
        throw new Error("No supervisor configured for this officer.");
      }

      return {
        targetStaff: supervisor,
        updates: {
          staff_id: supervisor.id,
          status_id: 1,
          is_approved: 1,
          approved_by: null,
          approved_at: null,
        },
      };
    }

    if (action === ACTIONS.ASSIGN || action === ACTIONS.RETURN) {
      const availableAssignableStaff = Array.isArray(assignableStaff) && assignableStaff.length
        ? assignableStaff
        : await this.getAssignableStaff(actor);
      const targetId = toNumber(targetStaffId);
      const target = availableAssignableStaff.find((item) => item.id === targetId);
      if (!target) {
        throw new Error(action === ACTIONS.ASSIGN ? "Please select staff to assign." : "Please select staff to return this application to.");
      }

      return {
        targetStaff: target,
        updates: {
          staff_id: target.id,
          status_id: 1,
          is_approved: 1,
          approved_by: null,
          approved_at: null,
        },
      };
    }

    if (action === ACTIONS.FORWARD) {
      const supervisor = await this.getImmediateSupervisor(actor);
      if (!supervisor) {
        throw new Error("No next approval step configured for this user.");
      }

      return {
        targetStaff: supervisor,
        updates: {
          staff_id: supervisor.id,
          status_id: 1,
          is_approved: 1,
          approved_by: null,
          approved_at: null,
        },
      };
    }

    if (action === ACTIONS.APPROVE) {
      return {
        targetStaff: null,
        updates: {
          staff_id: actor.id,
          status_id: 1,
          is_approved: 2,
          approved_by: actor.id,
          approved_at: new Date(),
        },
      };
    }

    if (action === ACTIONS.REJECT) {
      return {
        targetStaff: null,
        updates: {
          staff_id: actor.id,
          status_id: 1,
          is_approved: 3,
          approved_by: actor.id,
          approved_at: new Date(),
        },
      };
    }

    if (action === ACTIONS.RETURN_BACK) {
      return {
        targetStaff: null,
        updates: {
          staff_id: null,
          status_id: 1,
          is_approved: 4,
          approved_by: null,
          approved_at: null,
        },
      };
    }

    throw new Error("Unsupported workflow action.");
  }
}

WorkflowHelper.ACTIONS = ACTIONS;

module.exports = WorkflowHelper;
