// Src/Services/ApplicationAPIService.js
const paginate = require("../Helpers/Paginate");
const {
  Application,
  EstablishingSchool,
  Applicant,
  User,
  Comment,
  Attachment,
  AttachmentType,
  Staff,
  Role,
  ApplicationCategory,
  PersonalInfo,
  InstituteInfo,
  SchoolCategory,
  SchoolSubCategory,
  SchoolRegistration,
  RegistryType,
  Language,
  BuildingStructure,
  SchoolGenderType,
  SchoolSpecialization,
  RegistrationStructure,
  Curriculum,
  CertificateType,
  Combination,
  SchoolCombination,
  SectName,
  Street,
  Ward,
  District,
  Region,
} = require("../Models");
const resolveApplicantPolymorphic = require("../Utils/resolveApplicantPolymorphic");
const Zone = require("../Models/ZoneModel");
const { Op, QueryTypes } = require("sequelize");

const WorkflowHelper = require("../Utils/WorkflowHelper");

class ApplicationAPIService {
  static normalizeNullableCode(value) {
    const normalized = String(value ?? "").trim();
    if (!normalized) return null;
    const lowered = normalized.toLowerCase();
    if (["null", "undefined", "na", "n/a", "-", "--"].includes(lowered)) return null;
    return normalized;
  }

  static normalizeOfficeValue(value) {
    const parsed = Number.parseInt(String(value ?? "").trim(), 10);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
  }

  static uniqueNonEmptyCodes(values = []) {
    const set = new Set();
    values.forEach((value) => {
      const normalized = this.normalizeNullableCode(value);
      if (normalized) set.add(normalized);
    });
    return Array.from(set);
  }

  static resolveStaffLocationLabel(staff = {}, maps = {}) {
    const zoneId = this.normalizeNullableCode(staff?.zone_id);
    const regionCode = this.normalizeNullableCode(staff?.region_code);
    const districtCode = this.normalizeNullableCode(staff?.district_code);

    const hasZone = Boolean(zoneId);
    const hasRegion = Boolean(regionCode);
    const hasDistrict = Boolean(districtCode);

    if (hasZone && hasRegion && hasDistrict) {
      return maps?.districtByCode?.get(districtCode) || null;
    }

    if (hasZone && !hasRegion && !hasDistrict) {
      return maps?.zoneById?.get(zoneId) || null;
    }

    if (hasZone && hasRegion && !hasDistrict) {
      return maps?.regionByCode?.get(regionCode) || null;
    }

    return null;
  }

  static setModelDataValue(modelOrObject, key, value) {
    if (!modelOrObject || typeof modelOrObject !== "object") return;
    if (typeof modelOrObject.setDataValue === "function") {
      modelOrObject.setDataValue(key, value);
      return;
    }
    modelOrObject[key] = value;
  }

  static getModelDataValue(modelOrObject, key) {
    if (!modelOrObject || typeof modelOrObject !== "object") return undefined;
    if (typeof modelOrObject.getDataValue === "function") {
      return modelOrObject.getDataValue(key);
    }
    return modelOrObject[key];
  }

  static async loadLocationMaps({ zoneIds = [], regionCodes = [], districtCodes = [] } = {}) {
    const normalizedZoneIds = this.uniqueNonEmptyCodes(zoneIds);
    const normalizedRegionCodes = this.uniqueNonEmptyCodes(regionCodes);
    const normalizedDistrictCodes = this.uniqueNonEmptyCodes(districtCodes);

    const [zones, regions, districts] = await Promise.all([
      normalizedZoneIds.length
        ? Zone.findAll({
            where: { id: { [Op.in]: normalizedZoneIds } },
            attributes: ["id", "zone_name"],
            raw: true,
          })
        : Promise.resolve([]),
      normalizedRegionCodes.length
        ? Region.findAll({
            where: { RegionCode: { [Op.in]: normalizedRegionCodes } },
            attributes: ["RegionCode", "RegionName"],
            raw: true,
          })
        : Promise.resolve([]),
      normalizedDistrictCodes.length
        ? District.findAll({
            where: { LgaCode: { [Op.in]: normalizedDistrictCodes } },
            attributes: ["LgaCode", "LgaName"],
            raw: true,
          })
        : Promise.resolve([]),
    ]);

    return {
      zoneById: new Map(
        zones.map((row) => [this.normalizeNullableCode(row?.id), this.normalizeNullableCode(row?.zone_name)]),
      ),
      regionByCode: new Map(
        regions.map((row) => [this.normalizeNullableCode(row?.RegionCode), this.normalizeNullableCode(row?.RegionName)]),
      ),
      districtByCode: new Map(
        districts.map((row) => [this.normalizeNullableCode(row?.LgaCode), this.normalizeNullableCode(row?.LgaName)]),
      ),
    };
  }

  static async fetchCommentLocationSnapshots(commentIds = []) {
    const normalizedCommentIds = Array.from(
      new Set(
        commentIds
          .map((value) => Number.parseInt(value, 10))
          .filter((value) => Number.isFinite(value) && value > 0),
      ),
    );

    if (!normalizedCommentIds.length) {
      return new Map();
    }

    const rows = await Application.sequelize.query(
      `
        SELECT
          comment_id,
          staff_id,
          zone_id,
          lga_code
        FROM maoni_comment_locations
        WHERE comment_id IN (:commentIds)
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { commentIds: normalizedCommentIds },
      },
    );

    return new Map(
      rows.map((row) => [
        Number.parseInt(row?.comment_id, 10),
        {
          comment_id: Number.parseInt(row?.comment_id, 10) || null,
          staff_id: Number.parseInt(row?.staff_id, 10) || null,
          zone_id: this.normalizeNullableCode(row?.zone_id),
          lga_code: this.normalizeNullableCode(row?.lga_code),
        },
      ]),
    );
  }

  static async loadCommentLocationMaps({ lgaCodes = [], zoneIds = [] } = {}) {
    const normalizedLgaCodes = this.uniqueNonEmptyCodes(lgaCodes);
    const normalizedZoneRefs = this.uniqueNonEmptyCodes(zoneIds);

    if (!normalizedLgaCodes.length && !normalizedZoneRefs.length) {
      return {
        districtByCode: new Map(),
        zoneById: new Map(),
        zoneByCode: new Map(),
      };
    }

    const districts = normalizedLgaCodes.length
      ? await District.findAll({
          where: { LgaCode: { [Op.in]: normalizedLgaCodes } },
          attributes: ["LgaCode", "LgaName", "RegionCode"],
          raw: true,
        })
      : [];

    const districtRegionCodes = this.uniqueNonEmptyCodes(districts.map((row) => row?.RegionCode));
    const regions = districtRegionCodes.length
      ? await Region.findAll({
          where: { RegionCode: { [Op.in]: districtRegionCodes } },
          attributes: ["RegionCode", "zone_id"],
          raw: true,
        })
      : [];

    const zoneIdsFromRegions = this.uniqueNonEmptyCodes(regions.map((row) => row?.zone_id));
    const combinedZoneRefs = this.uniqueNonEmptyCodes([...normalizedZoneRefs, ...zoneIdsFromRegions]);
    const numericZoneIds = combinedZoneRefs
      .filter((value) => /^\d+$/.test(String(value)))
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value));

    const zoneOrConditions = [];
    if (numericZoneIds.length) {
      zoneOrConditions.push({ id: { [Op.in]: numericZoneIds } });
    }
    if (combinedZoneRefs.length) {
      zoneOrConditions.push({ zone_code: { [Op.in]: combinedZoneRefs } });
    }

    const zones = zoneOrConditions.length
      ? await Zone.findAll({
          where: zoneOrConditions.length === 1 ? zoneOrConditions[0] : { [Op.or]: zoneOrConditions },
          attributes: ["id", "zone_code", "zone_name"],
          raw: true,
        })
      : [];

    return {
      districtByCode: new Map(
        districts.map((row) => [
          this.normalizeNullableCode(row?.LgaCode),
          {
            name: this.normalizeNullableCode(row?.LgaName),
            regionCode: this.normalizeNullableCode(row?.RegionCode),
          },
        ]),
      ),
      zoneById: new Map(
        zones.map((row) => [this.normalizeNullableCode(row?.id), this.normalizeNullableCode(row?.zone_name)]),
      ),
      zoneByCode: new Map(
        zones.map((row) => [this.normalizeNullableCode(row?.zone_code), this.normalizeNullableCode(row?.zone_name)]),
      ),
    };
  }

  static resolveCommentLocationLabel(snapshot = {}, maps = {}) {
    const lgaCode = this.normalizeNullableCode(snapshot?.lga_code);
    const zoneId = this.normalizeNullableCode(snapshot?.zone_id);

    if (lgaCode) {
      const districtInfo = maps?.districtByCode?.get(lgaCode) || null;
      if (districtInfo?.name) return districtInfo.name;
    }

    if (zoneId) {
      return maps?.zoneById?.get(zoneId) || maps?.zoneByCode?.get(zoneId) || null;
    }

    if (lgaCode) {
      return maps?.zoneById?.get(lgaCode) || maps?.zoneByCode?.get(lgaCode) || null;
    }

    return null;
  }

  static async upsertCommentLocationSnapshot(commentId, snapshot = {}, transaction = null) {
    const parsedCommentId = Number.parseInt(commentId, 10);
    const parsedStaffId = Number.parseInt(snapshot?.staff_id, 10);
    if (!Number.isFinite(parsedCommentId) || parsedCommentId <= 0) return;
    if (!Number.isFinite(parsedStaffId) || parsedStaffId <= 0) return;

    const zoneId = this.normalizeNullableCode(snapshot?.zone_id);
    const lgaCode = this.normalizeNullableCode(snapshot?.lga_code);

    await Application.sequelize.query(
      `
        INSERT INTO maoni_comment_locations
          (comment_id, staff_id, zone_id, lga_code, created_at, updated_at)
        VALUES
          (:commentId, :staffId, :zoneId, :lgaCode, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          staff_id = VALUES(staff_id),
          zone_id = VALUES(zone_id),
          lga_code = VALUES(lga_code),
          updated_at = VALUES(updated_at)
      `,
      {
        type: QueryTypes.INSERT,
        transaction,
        replacements: {
          commentId: parsedCommentId,
          staffId: parsedStaffId,
          zoneId,
          lgaCode,
        },
      },
    );
  }

  static normalizeCommentTitleValue(value) {
    const normalized = String(value || "").trim().toUpperCase();
    if (!normalized) return null;
    if (["REVIEW", "ASSIGN", "FORWARD", "APPROVE", "REJECT", "RETURN", "RETURN_BACK"].includes(normalized)) {
      return null;
    }
    return normalized;
  }

  static async resolveCommentSnapshotContext(currentUser = {}, staffId = null) {
    let office = this.normalizeOfficeValue(currentUser?.office);
    let zoneId = this.normalizeNullableCode(currentUser?.zone_id);
    let regionCode = this.normalizeNullableCode(currentUser?.region_code);
    let districtCode = this.normalizeNullableCode(currentUser?.district_code);
    let cheo = this.normalizeCommentTitleValue(
      currentUser?.cheo || currentUser?.rank_name || currentUser?.jukumu || currentUser?.role_name || "",
    );

    const normalizedStaffId = Number.parseInt(staffId, 10);
    if (Number.isFinite(normalizedStaffId) && normalizedStaffId > 0) {
      const shouldLoadStaff = !cheo || !office || !zoneId || !regionCode || !districtCode;
      if (shouldLoadStaff) {
        const staff = await Staff.findByPk(normalizedStaffId, {
          attributes: ["office", "zone_id", "region_code", "district_code"],
          include: [{ model: Role, as: "role", attributes: ["name"], required: false }],
        });
        if (staff) {
          if (!office) office = this.normalizeOfficeValue(staff.office);
          if (!zoneId) zoneId = this.normalizeNullableCode(staff.zone_id);
          if (!regionCode) regionCode = this.normalizeNullableCode(staff.region_code);
          if (!districtCode) districtCode = this.normalizeNullableCode(staff.district_code);
          if (!cheo) cheo = this.normalizeCommentTitleValue(staff?.role?.name || "");
        }
      }
    }

    return {
      office,
      zoneId,
      regionCode,
      districtCode,
      cheo,
    };
  }

  static buildCommentTitleFromSnapshotContext(snapshotContext = {}) {
    return String(snapshotContext?.cheo || "REVIEW").substring(0, 100);
  }

  static buildCommentLocationSnapshotFromContext(snapshotContext = {}, staffId = null) {
    const normalizedStaffId = Number.parseInt(staffId, 10);
    if (!Number.isFinite(normalizedStaffId) || normalizedStaffId <= 0) return null;

    const office = this.normalizeOfficeValue(snapshotContext?.office);
    const zoneId = this.normalizeNullableCode(snapshotContext?.zoneId);
    const districtCode = this.normalizeNullableCode(snapshotContext?.districtCode);

    if (office === 2) {
      if (!zoneId) return null;
      return {
        staff_id: normalizedStaffId,
        zone_id: zoneId,
        lga_code: null,
      };
    }

    if (office === 3) {
      if (!zoneId || !districtCode) return null;
      return {
        staff_id: normalizedStaffId,
        zone_id: zoneId,
        lga_code: districtCode,
      };
    }

    return null;
  }

  static async createCommentWithLocationSnapshot({
    trackingNumber,
    staffId,
    userTo = null,
    content,
    action = null,
    applicationProcessId = null,
    currentUser = null,
    snapshotContext = null,
    transaction = null,
  } = {}) {
    const normalizedTracking = String(trackingNumber || "").trim();
    const parsedStaffId = Number.parseInt(staffId, 10);
    if (!normalizedTracking) {
      throw new Error("Tracking number is required for comment.");
    }
    if (!Number.isFinite(parsedStaffId) || parsedStaffId <= 0) {
      throw new Error("Valid staff id is required for comment.");
    }

    const resolvedSnapshotContext = snapshotContext
      || await this.resolveCommentSnapshotContext(currentUser || {}, parsedStaffId);
    const titleSnapshot = this.buildCommentTitleFromSnapshotContext(resolvedSnapshotContext);
    const commentLocationSnapshot = this.buildCommentLocationSnapshotFromContext(
      resolvedSnapshotContext,
      parsedStaffId,
    );
    const normalizedAction = this.normalizeWorkflowAction(action);
    const allowedCommentActions = new Set([
      "Assign",
      "Review",
      "Forward",
      "Approve",
      "Reject",
      "Return",
      "Return_back",
    ]);
    const commentAction = allowedCommentActions.has(normalizedAction) ? normalizedAction : null;
    const parsedProcessId = Number.parseInt(applicationProcessId, 10);

    const commentPayload = {
      trackingNo: normalizedTracking,
      user_from: parsedStaffId,
      user_to: userTo ? Number.parseInt(userTo, 10) : null,
      coments: content,
      title: titleSnapshot,
      application_process_id: Number.isFinite(parsedProcessId) && parsedProcessId > 0 ? parsedProcessId : null,
      action: commentAction,
      type_of_comment: 1,
      created_at: new Date(),
    };

    const comment = await Comment.create(
      commentPayload,
      transaction ? { transaction } : undefined,
    );

    if (commentLocationSnapshot) {
      await this.upsertCommentLocationSnapshot(comment.id, commentLocationSnapshot, transaction);
    }

    return comment;
  }

  static async decorateCommentSenderLocations(application) {
    const comments = Array.isArray(application?.comments) ? application.comments : [];
    if (!comments.length) return;

    const commentIds = comments.map((comment) => comment?.id);
    const commentLocationSnapshots = await this.fetchCommentLocationSnapshots(commentIds);

    const dynamicSenders = [];
    const commentLgaCodes = [];
    const commentZoneIds = [];
    const zoneIds = [];
    const regionCodes = [];
    const districtCodes = [];

    comments.forEach((comment) => {
      const commentId = Number.parseInt(comment?.id, 10);
      const snapshot = Number.isFinite(commentId) ? (commentLocationSnapshots.get(commentId) || null) : null;
      this.setModelDataValue(comment, "location_snapshot", snapshot);
      commentLgaCodes.push(snapshot?.lga_code);
      commentZoneIds.push(snapshot?.zone_id);

      const sender = comment?.sender;
      if (!sender || typeof sender !== "object") return;

      dynamicSenders.push(sender);
      zoneIds.push(sender?.zone_id);
      regionCodes.push(sender?.region_code);
      districtCodes.push(sender?.district_code);
    });

    if (!dynamicSenders.length && !commentLgaCodes.length && !commentZoneIds.length) return;

    const [senderMaps, commentMaps] = await Promise.all([
      dynamicSenders.length
        ? this.loadLocationMaps({ zoneIds, regionCodes, districtCodes })
        : Promise.resolve(null),
      (commentLgaCodes.length || commentZoneIds.length)
        ? this.loadCommentLocationMaps({ lgaCodes: commentLgaCodes, zoneIds: commentZoneIds })
        : Promise.resolve(null),
    ]);

    if (senderMaps) {
      dynamicSenders.forEach((sender) => {
        const locationLabel = this.resolveStaffLocationLabel(sender, senderMaps);
        this.setModelDataValue(sender, "location_label", locationLabel);
      });
    }

    if (commentMaps) {
      comments.forEach((comment) => {
        const snapshot = this.getModelDataValue(comment, "location_snapshot");
        const locationLabel = this.resolveCommentLocationLabel(snapshot, commentMaps);
        this.setModelDataValue(comment, "location_label", locationLabel);
      });
    }
  }

  static resolveWorkflowUnitId(user = {}) {
    const parsed = Number.parseInt(user?.section_id, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return null;
  }

  static hasAssignStaffPermission(user = {}) {
    const permissions = Array.isArray(user?.userPermissions) ? user.userPermissions : [];
    return permissions.some(
      (permission) => String(permission || "").trim().toLowerCase() === "assign-staff",
    );
  }

  static normalizeWorkflowAction(action) {
    const normalized = String(action || "").trim().toLowerCase();
    if (!normalized) return "";

    if (normalized === "submit") return "Review";
    if (normalized === "review") return "Review";
    if (normalized === "assign") return "Assign";
    if (normalized === "forward") return "Forward";
    if (normalized === "return") return "Return";
    if (normalized === "return_back") return "Return_back";
    if (normalized === "approve") return "Approve";
    if (normalized === "reject") return "Reject";

    return String(action || "").trim();
  }

  static normalizeWorkflowRouteSteps(steps = []) {
    const stepMap = new Map();
    (Array.isArray(steps) ? steps : []).forEach((row) => {
      const workFlowId = Number.parseInt(row?.work_flow_id || row?.id, 10);
      if (!Number.isFinite(workFlowId) || workFlowId <= 0) return;

      const parsedOrder = Number.parseInt(row?._order, 10);
      const orderValue = Number.isFinite(parsedOrder) ? parsedOrder : 0;
      const isStart = Number.parseInt(row?.is_start, 10) === 1;
      const isFinal = Number.parseInt(row?.is_final, 10) === 1;
      const unitId = Number.parseInt(row?.unit_id, 10);

      if (!stepMap.has(workFlowId)) {
        stepMap.set(workFlowId, {
          work_flow_id: workFlowId,
          _order: orderValue,
          is_start: isStart ? 1 : 0,
          is_final: isFinal ? 1 : 0,
          unit_id: Number.isFinite(unitId) ? unitId : null,
        });
      }
    });

    return Array.from(stepMap.values()).sort(
      (left, right) => left._order - right._order || left.work_flow_id - right.work_flow_id,
    );
  }

  static resolveStepOrderValue(routeStep = null, fallback = 0) {
    const parsed = Number.parseInt(routeStep?._order, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    const parsedFallback = Number.parseInt(fallback, 10);
    return Number.isFinite(parsedFallback) && parsedFallback > 0 ? parsedFallback : 1;
  }

  static async setCurrentProcessInProgress(processId, assignedTo, actorId, transaction) {
    await Application.sequelize.query(
      `
        UPDATE application_processes
        SET assigned_to = :assignedTo,
            status = 'In-progress',
            acted_by = :actorId,
            acted_at = NOW(),
            updated_at = NOW()
        WHERE id = :processId
        LIMIT 1
      `,
      {
        type: QueryTypes.UPDATE,
        transaction,
        replacements: {
          processId: Number(processId),
          assignedTo: Number(assignedTo),
          actorId: Number(actorId),
        },
      },
    );
  }

  static async setCurrentProcessPending(processId, actorId, transaction) {
    await Application.sequelize.query(
      `
        UPDATE application_processes
        SET assigned_to = NULL,
            status = 'Pending',
            acted_by = :actorId,
            acted_at = NOW(),
            updated_at = NOW()
        WHERE id = :processId
        LIMIT 1
      `,
      {
        type: QueryTypes.UPDATE,
        transaction,
        replacements: {
          processId: Number(processId),
          actorId: Number(actorId),
        },
      },
    );
  }

  static async closeCurrentProcess(processId, closingStatus, actorId, transaction) {
    const normalizedClosingStatus = String(closingStatus || "").trim().toLowerCase();
    const completeAtSql = normalizedClosingStatus === "completed" ? "completed_at = NOW()," : "";

    await Application.sequelize.query(
      `
        UPDATE application_processes
        SET assigned_to = NULL,
            status = :closingStatus,
            acted_by = :actorId,
            acted_at = NOW(),
            ${completeAtSql}
            updated_at = NOW()
        WHERE id = :processId
        LIMIT 1
      `,
      {
        type: QueryTypes.UPDATE,
        transaction,
        replacements: {
          processId: Number(processId),
          closingStatus,
          actorId: Number(actorId),
        },
      },
    );
  }

  static async createPendingApplicationProcess({
    trackingNumber,
    workFlowId,
    stepOrder,
    actorId,
    transaction,
  }) {
    await Application.sequelize.query(
      `
        INSERT INTO application_processes (
          tracking_number,
          work_flow_id,
          step_order,
          assigned_to,
          status,
          acted_by,
          acted_at,
          started_at,
          completed_at,
          created_at,
          updated_at
        ) VALUES (
          :trackingNumber,
          :workFlowId,
          :stepOrder,
          NULL,
          'Pending',
          :actorId,
          NOW(),
          NULL,
          NULL,
          NOW(),
          NOW()
        )
      `,
      {
        type: QueryTypes.INSERT,
        transaction,
        replacements: {
          trackingNumber: String(trackingNumber || "").trim(),
          workFlowId: Number(workFlowId),
          stepOrder: Number(stepOrder),
          actorId: Number(actorId),
        },
      },
    );
  }

  static pendingProcessExistsSql(tableAlias, unitRef) {
    return `
      EXISTS (
        SELECT 1
        FROM application_processes ap
        JOIN work_flow wf ON wf.id = ap.work_flow_id
        WHERE ap.tracking_number = ${tableAlias}.tracking_number
          AND wf.unit_id = ${unitRef}
          AND LOWER(TRIM(COALESCE(ap.status, ''))) = 'pending'
          AND ap.step_order = (
            SELECT MAX(ap2.step_order)
            FROM application_processes ap2
            WHERE ap2.tracking_number = ${tableAlias}.tracking_number
          )
      )
    `;
  }

  static pendingAssignedToStaffProcessExistsSql(tableAlias, unitRef, staffRef) {
    return `
      EXISTS (
        SELECT 1
        FROM application_processes ap
        JOIN work_flow wf ON wf.id = ap.work_flow_id
        WHERE ap.tracking_number = ${tableAlias}.tracking_number
          AND wf.unit_id = ${unitRef}
          AND LOWER(TRIM(COALESCE(ap.status, ''))) = 'pending'
          AND ap.assigned_to = ${staffRef}
          AND ap.work_flow_id IS NOT NULL
          AND ap.step_order = (
            SELECT MAX(ap2.step_order)
            FROM application_processes ap2
            WHERE ap2.tracking_number = ${tableAlias}.tracking_number
          )
      )
    `;
  }

  static pendingUnassignedProcessExistsSql(tableAlias, unitRef) {
    return `
      EXISTS (
        SELECT 1
        FROM application_processes ap
        JOIN work_flow wf ON wf.id = ap.work_flow_id
        WHERE ap.tracking_number = ${tableAlias}.tracking_number
          AND wf.unit_id = ${unitRef}
          AND LOWER(TRIM(COALESCE(ap.status, ''))) = 'Pending'
          AND ap.assigned_to IS NULL
          AND ap.work_flow_id IS NOT NULL
      )
    `;
  }

  static applicationStaffInUnitSql(tableAlias, unitRef) {
    return `
      (
        ${tableAlias}.staff_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM staffs s
          JOIN roles r ON r.id = s.user_level
          WHERE s.id = ${tableAlias}.staff_id
            AND r.vyeoId = ${unitRef}
        )
      )
    `;
  }

  static touchedProcessExistsSql(tableAlias, unitRef) {
    return `
      EXISTS (
        SELECT 1
        FROM application_processes ap
        JOIN work_flow wf ON wf.id = ap.work_flow_id
        WHERE ap.tracking_number = ${tableAlias}.tracking_number
          AND wf.unit_id = ${unitRef}
      )
    `;
  }

  static shouldLoadSchoolCombinations(establishingSchool) {
    const category = String(establishingSchool?.school_type?.category || "").toUpperCase();
    const certificate = String(establishingSchool?.certificate_type?.certificate || "").toUpperCase();

    const isSecondarySchool = category.includes("SEKONDARI") || category.includes("SECONDARY");
    const isAllowedCertificate = certificate.includes("ACSEE") || certificate.includes("CSEE");

    return isSecondarySchool && isAllowedCertificate;
  }

  static async resolveLocationHierarchy(establishingSchool) {
    const blank = {
      street: null,
      ward: null,
      district: null,
      region: null,
    };

    if (!establishingSchool) return blank;

    const villageId = String(establishingSchool?.village_id || "").trim();
    const wardId = String(establishingSchool?.ward_id || "").trim();

    const findStreet = async (token) => {
      if (!token) return null;
      const numeric = Number.parseInt(token, 10);
      const candidates = [{ StreetCode: token }, { area_code: token }];
      if (Number.isFinite(numeric)) {
        candidates.push({ id: numeric });
        candidates.push({ tamisemi_id: numeric });
      }

      for (const where of candidates) {
        // eslint-disable-next-line no-await-in-loop
        const row = await Street.findOne({ where });
        if (row) return row;
      }
      return null;
    };

    const findWard = async (token) => {
      if (!token) return null;
      const numeric = Number.parseInt(token, 10);
      const candidates = [{ WardCode: token }, { area_code: token }];
      if (Number.isFinite(numeric)) {
        candidates.push({ id: numeric });
        candidates.push({ tamisemi_id: numeric });
      }

      for (const where of candidates) {
        // eslint-disable-next-line no-await-in-loop
        const row = await Ward.findOne({ where });
        if (row) return row;
      }
      return null;
    };

    const street = await findStreet(villageId);
    const ward = street?.WardCode ? await Ward.findOne({ where: { WardCode: street.WardCode } }) : await findWard(wardId);
    const district = ward?.LgaCode ? await District.findOne({ where: { LgaCode: ward.LgaCode } }) : null;
    const region = district?.RegionCode ? await Region.findOne({ where: { RegionCode: district.RegionCode } }) : null;

    return {
      street: street
        ? {
            id: street.id,
            code: street.StreetCode,
            name: street.StreetName,
            ward_code: street.WardCode,
          }
        : null,
      ward: ward
        ? {
            id: ward.id,
            code: ward.WardCode,
            name: ward.WardName,
            district_code: ward.LgaCode,
          }
        : null,
      district: district
        ? {
            id: district.id,
            code: district.LgaCode,
            name: district.LgaName,
            region_code: district.RegionCode,
          }
        : null,
      region: region
        ? {
            id: region.id,
            code: region.RegionCode,
            name: region.RegionName,
          }
        : null,
    };
  }

  static applySearchFilter(where, rawSearch) {
    const search = String(rawSearch || "").trim();
    if (!search) return;

    const like = `%${search}%`;
    if (!Array.isArray(where[Op.and])) where[Op.and] = [];
    where[Op.and].push({
      [Op.or]: [
        { tracking_number: { [Op.like]: like } },
        { "$application_category.app_name$": { [Op.like]: like } },
        { "$establishing_school.school_name$": { [Op.like]: like } },
        { "$assigned_staff.name$": { [Op.like]: like } },
        { "$assigned_staff.role.name$": { [Op.like]: like } },
      ],
    });
  }

  static async fetchApplicationCategorySummary(req) {
    const sequelize = Application.sequelize;
    const approvalState = Number.parseInt(req?.query?.is_approved, 10);
    const whereSql = [
      "a.application_category_id = ac.id",
      "a.establishing_school_id IS NOT NULL",
    ];
    const replacements = {};

    if (Number.isInteger(approvalState) && approvalState >= 0) {
      whereSql.push("a.is_approved = :approvalState");
      replacements.approvalState = approvalState;
    }

    const sql = `
      SELECT
        ac.id,
        ac.app_name AS label,
        COUNT(a.id) AS total
      FROM application_categories ac
      LEFT JOIN applications a
        ON ${whereSql.join("\n        AND ")}
      GROUP BY ac.id, ac.app_name
      ORDER BY ac.id ASC
    `;

    return sequelize.query(sql, { type: QueryTypes.SELECT, replacements });
  }

  static async fetchApplicationCategorySummaryByStaff(user, workTab = "pending") {
    const sequelize = Application.sequelize;
    const normalizedTab = String(workTab || "pending").toLowerCase();
    const workflowUnitId = this.resolveWorkflowUnitId(user);
    const canAssignStaff = this.hasAssignStaffPermission(user);
    const fallbackStaffId = Number.parseInt(user?.id, 10) || 0;
    const handledFilter = `
      EXISTS (
        SELECT 1
        FROM maoni m
        WHERE m.trackingNo = a.tracking_number
          AND m.user_from = :staffId
      )
      AND (a.staff_id <> :staffId OR a.staff_id IS NULL)
    `;

    if (normalizedTab === "handled") {
      const sql = `
        SELECT
          ac.id,
          ac.app_name AS label,
          COUNT(a.id) AS total
        FROM application_categories ac
        LEFT JOIN applications a
          ON a.application_category_id = ac.id
          AND a.establishing_school_id IS NOT NULL
          AND ${handledFilter}
        GROUP BY ac.id, ac.app_name
        ORDER BY ac.id ASC
      `;

      return sequelize.query(sql, {
        type: QueryTypes.SELECT,
        replacements: { staffId: fallbackStaffId },
      });
    }

    if (!workflowUnitId) {
      const pendingFilter = `
        a.staff_id = :staffId
        AND a.is_approved IN (0, 1)
      `;
      const whereFilter = pendingFilter;
      const sql = `
        SELECT
          ac.id,
          ac.app_name AS label,
          COUNT(a.id) AS total
        FROM application_categories ac
        LEFT JOIN applications a
          ON a.application_category_id = ac.id
          AND a.establishing_school_id IS NOT NULL
          AND ${whereFilter}
        GROUP BY ac.id, ac.app_name
        ORDER BY ac.id ASC
      `;

      return sequelize.query(sql, {
        type: QueryTypes.SELECT,
        replacements: { staffId: fallbackStaffId },
      });
    }

    const pendingFilter = `
      EXISTS (
        SELECT 1
        FROM application_processes ap
        INNER JOIN work_flow wf
          ON wf.id = ap.work_flow_id
        WHERE ap.tracking_number = a.tracking_number
          AND wf.unit_id = :workflowUnitId
          AND (
            (
              :canAssignStaff = 1
              AND ap.status = 'Pending'
              AND (
                ap.assigned_to = :staffId
                OR ap.assigned_to IS NULL
              )
            )
            OR (
              :canAssignStaff = 0
              AND ap.assigned_to = :staffId
              AND ap.status IN ('Pending', 'In-progress')
            )
          )
      )
    `;
    const whereFilter = pendingFilter;
    const sql = `
      SELECT
        ac.id,
        ac.app_name AS label,
        COUNT(a.id) AS total
      FROM application_categories ac
      LEFT JOIN applications a
        ON a.application_category_id = ac.id
        AND a.establishing_school_id IS NOT NULL
        AND ${whereFilter}
      GROUP BY ac.id, ac.app_name
      ORDER BY ac.id ASC
    `;

    return sequelize.query(sql, {
      type: QueryTypes.SELECT,
      replacements: {
        workflowUnitId,
        staffId: fallbackStaffId,
        canAssignStaff: canAssignStaff ? 1 : 0,
      },
    });
  }

  // 1. Fetch all applications
  static async fetchAllApplications(req) {
    const categoryId = Number.parseInt(req?.query?.application_category_id, 10);
    const approvalState = Number.parseInt(req?.query?.is_approved, 10);
    const search = req?.query?.search;
    const where = {
      establishing_school_id: {
        [Op.ne]: null,
      },
    };

    if (Number.isInteger(categoryId) && categoryId > 0) {
      where.application_category_id = categoryId;
    }
    if (Number.isInteger(approvalState) && approvalState >= 0) {
      where.is_approved = approvalState;
    }
    this.applySearchFilter(where, search);

    const paginated = await paginate(Application, {
      req,
      where,
      include: [
        { model: ApplicationCategory,
            as: "application_category"
         },
        {
          model: User,
          as: "applicant",
          attributes: ["id", "name", "email"],
          required: false,
        },
        { model: Staff,
          as: "assigned_staff", // Use the correct alias
          attributes: ["id", "name"],
          include: [
            {
              model: Role,
              as: "role",
              attributes: ["name"],
              required: false,
            },
          ] },
        {
          model: EstablishingSchool,
          as: "establishing_school",
          attributes: ["school_name"],
          include: [
            {
              model: SchoolCategory,
              as: "school_type",
              attributes: ["category"],
            },
            {
              model: RegistryType,
              as: "registry_type",
              attributes: ["id", "registry"],
              required: false,
            },
          ],
        },
      ],
      subQuery: false,
      order: [["created_at", "DESC"]],
    });

    paginated.data = paginated.data.map((application) => {
      const row = application?.toJSON ? application.toJSON() : application;
      if (row?.establishing_school) {
        const schoolType = row.establishing_school.school_type?.category || null;
        const schoolName = row.establishing_school.school_name || null;

        row.establishing_school.school_type = schoolType
          ? String(schoolType).toUpperCase()
          : null;
        row.establishing_school.school_name = schoolName
          ? String(schoolName).toUpperCase()
          : null;
      }

      if (row?.assigned_staff) {
        const cheo = row.assigned_staff.role?.name || null;
        row.assigned_staff = {
          id: row.assigned_staff.id,
          cheo,
        };
      }
      return row;
    });

    return paginated;
  }

  static async fetchMyApplications(req) {
    const staffId = req?.user?.id;
    const numericStaffId = Number.parseInt(staffId, 10) || 0;
    const workflowUnitId = this.resolveWorkflowUnitId(req?.user);
    const canAssignStaff = this.hasAssignStaffPermission(req?.user);
    const categoryId = Number.parseInt(req?.query?.application_category_id, 10);
    const approvalState = Number.parseInt(req?.query?.is_approved, 10);
    const workTab = String(req?.query?.work_tab || "pending").toLowerCase();
    const search = req?.query?.search;
    const where = {
      establishing_school_id: {
        [Op.ne]: null,
      },
    };
    const include = [
      { model: ApplicationCategory, as: "application_category" },
      {
        model: User,
        as: "applicant",
        attributes: ["id", "name", "email"],
        required: false,
      },
      {
        model: Staff,
        as: "assigned_staff",
        attributes: ["id", "name"],
        include: [
          {
            model: Role,
            as: "role",
            attributes: ["name"],
            required: false,
          },
        ],
      },
      {
        model: EstablishingSchool,
        as: "establishing_school",
        attributes: ["school_name"],
        include: [
          {
            model: SchoolCategory,
            as: "school_type",
            attributes: ["category"],
          },
          {
            model: RegistryType,
            as: "registry_type",
            attributes: ["id", "registry"],
            required: false,
          },
        ],
      },
    ];

    if (Number.isInteger(categoryId) && categoryId > 0) {
      where.application_category_id = categoryId;
    }
    if (workTab === "pending") {
      if (workflowUnitId) {
        if (!Array.isArray(where[Op.and])) where[Op.and] = [];
        const pendingVisibilitySql = `
          EXISTS (
            SELECT 1
            FROM application_processes ap
            INNER JOIN work_flow wf
              ON wf.id = ap.work_flow_id
            WHERE ap.tracking_number = Application.tracking_number
              AND wf.unit_id = ${Number(workflowUnitId)}
              AND (
                (
                  ${canAssignStaff ? 1 : 0} = 1
                  AND ap.status = 'Pending'
                  AND (
                    ap.assigned_to = ${Number(numericStaffId)}
                    OR ap.assigned_to IS NULL
                  )
                )
                OR (
                  ${canAssignStaff ? 1 : 0} = 0
                  AND ap.assigned_to = ${Number(numericStaffId)}
                  AND ap.status IN ('Pending', 'In-progress')
                )
              )
          )
        `;
        where[Op.and].push(
          Application.sequelize.literal(pendingVisibilitySql),
        );
      } else {
        where.staff_id = staffId;
        where.is_approved = { [Op.in]: [0, 1] };
      }
    } else if (workTab === "handled") {
      if (!Array.isArray(where[Op.and])) where[Op.and] = [];
      where[Op.and].push({
        [Op.or]: [
          { staff_id: { [Op.ne]: staffId } },
          { staff_id: { [Op.is]: null } },
        ],
      });
      where[Op.and].push(
        Application.sequelize.literal(`EXISTS (
          SELECT 1
          FROM maoni m
          WHERE m.trackingNo = Application.tracking_number
            AND m.user_from = ${Number(staffId) || 0}
        )`),
      );
    } else if (Number.isInteger(approvalState) && approvalState >= 0) {
      where.staff_id = staffId;
      where.is_approved = approvalState;
    }
    this.applySearchFilter(where, search);

    const paginated = await paginate(Application, {
      req,
      where,
      include,
      order: [["created_at", workTab === "pending" ? "ASC" : "DESC"]],
    });

    paginated.data = paginated.data.map((application) => {
      const row = application?.toJSON ? application.toJSON() : application;

      if (row?.establishing_school) {
        const schoolType = row.establishing_school.school_type?.category || null;
        const schoolName = row.establishing_school.school_name || null;

        row.establishing_school.school_type = schoolType
          ? String(schoolType).toUpperCase()
          : null;
        row.establishing_school.school_name = schoolName
          ? String(schoolName).toUpperCase()
          : null;
      }

      if (row?.assigned_staff) {
        const cheo = row.assigned_staff.role?.name || null;
        row.assigned_staff = {
          id: row.assigned_staff.id,
          cheo,
        };
      }
      return row;
    });

    return paginated;
  }

  static async canAccessPendingApplication(application, user = {}) {
    const trackingNumber = String(application?.tracking_number || "").trim();
    const staffId = Number.parseInt(user?.id, 10) || 0;
    if (!trackingNumber || !staffId) return false;

    const workflowUnitId = this.resolveWorkflowUnitId(user);
    if (!workflowUnitId) {
      return Number(application?.staff_id) === staffId && [0, 1].includes(Number(application?.is_approved));
    }

    const canAssignStaff = this.hasAssignStaffPermission(user);
    const sequelize = Application.sequelize;

    const rows = await sequelize.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM application_processes ap
          INNER JOIN work_flow wf
            ON wf.id = ap.work_flow_id
          WHERE ap.tracking_number = :trackingNumber
            AND wf.unit_id = :workflowUnitId
            AND (
              (
                :canAssignStaff = 1
                AND ap.status = 'Pending'
                AND (
                  ap.assigned_to = :staffId
                  OR ap.assigned_to IS NULL
                )
              )
              OR (
                :canAssignStaff = 0
                AND ap.assigned_to = :staffId
                AND ap.status IN ('Pending', 'In-progress')
              )
            )
        ) AS can_attend
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          trackingNumber,
          workflowUnitId,
          staffId,
          canAssignStaff: canAssignStaff ? 1 : 0,
        },
      },
    );

    return Number(rows?.[0]?.can_attend || 0) === 1;
  }

  static async fetchCurrentProcess(trackingNumber) {
    const normalizedTracking = String(trackingNumber || "").trim();
    if (!normalizedTracking) return null;

    const sequelize = Application.sequelize;
    const runModernQuery = async () => {
      return sequelize.query(
        `
          SELECT
            ap.*,
            wf.unit_id AS current_workflow_unit_id,
            v.rank_name AS current_workflow_unit_name,
            wf.is_start AS current_workflow_is_start,
            wf.is_final AS current_workflow_is_final
          FROM application_processes ap
          LEFT JOIN work_flow wf
            ON wf.id = ap.work_flow_id
          LEFT JOIN vyeo v
            ON v.id = wf.unit_id
          WHERE ap.tracking_number = :trackingNumber
          ORDER BY
            CASE WHEN LOWER(TRIM(COALESCE(ap.status, ''))) = 'pending' THEN 0 ELSE 1 END,
            ap.step_order DESC,
            ap.id DESC
          LIMIT 1
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { trackingNumber: normalizedTracking },
        },
      );
    };

    const runLegacyQuery = async () => {
      return sequelize.query(
        `
          SELECT
            ap.*,
            wf.start_from AS current_workflow_unit_id,
            v.rank_name AS current_workflow_unit_name,
            0 AS current_workflow_is_start,
            0 AS current_workflow_is_final
          FROM application_processes ap
          LEFT JOIN work_flow wf
            ON wf.id = ap.work_flow_id
          LEFT JOIN vyeo v
            ON v.id = wf.start_from
          WHERE ap.tracking_number = :trackingNumber
          ORDER BY
            CASE WHEN LOWER(TRIM(COALESCE(ap.status, ''))) = 'pending' THEN 0 ELSE 1 END,
            ap.step_order DESC,
            ap.id DESC
          LIMIT 1
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { trackingNumber: normalizedTracking },
        },
      );
    };

    let rows = [];
    try {
      rows = await runModernQuery();
    } catch (error) {
      if (error?.original?.code === "ER_BAD_FIELD_ERROR" || error?.parent?.code === "ER_BAD_FIELD_ERROR") {
        rows = await runLegacyQuery();
      } else {
        throw error;
      }
    }

    const process = rows?.[0] || null;
    if (!process) return null;

    const workflowId = Number.parseInt(process?.work_flow_id, 10);
    process.current_workflow_unit = await this.fetchCurrentWorkflowUnit(workflowId);
    delete process.current_workflow_unit_id;
    delete process.current_workflow_unit_name;
    delete process.current_workflow_is_start;
    delete process.current_workflow_is_final;

    return process;
  }

  static stripWorkflowAuditFields(workflowRow = {}) {
    const clean = { ...(workflowRow || {}) };
    delete clean.created_at;
    delete clean.deleted_at;
    delete clean.created_by;
    delete clean.updated_by;
    return clean;
  }

  static async fetchCurrentWorkflowUnit(workflowId) {
    const parsedWorkflowId = Number.parseInt(workflowId, 10);
    if (!Number.isFinite(parsedWorkflowId) || parsedWorkflowId <= 0) return null;

    const sequelize = Application.sequelize;

    const runModernQuery = async () => {
      return sequelize.query(
        `
          SELECT
            wf.*,
            v.rank_name AS name
          FROM work_flow wf
          LEFT JOIN vyeo v
            ON v.id = wf.unit_id
          WHERE wf.id = :workflowId
          LIMIT 1
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { workflowId: parsedWorkflowId },
        },
      );
    };

    const runLegacyQuery = async () => {
      return sequelize.query(
        `
          SELECT
            wf.*,
            v.rank_name AS name
          FROM work_flow wf
          LEFT JOIN vyeo v
            ON v.id = wf.start_from
          WHERE wf.id = :workflowId
          LIMIT 1
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { workflowId: parsedWorkflowId },
        },
      );
    };

    let rows = [];
    try {
      rows = await runModernQuery();
    } catch (error) {
      if (error?.original?.code === "ER_BAD_FIELD_ERROR" || error?.parent?.code === "ER_BAD_FIELD_ERROR") {
        rows = await runLegacyQuery();
      } else {
        throw error;
      }
    }

    const workflowRow = rows?.[0] || null;
    if (!workflowRow) return null;

    return this.stripWorkflowAuditFields(workflowRow);
  }

  static async fetchWorkflowStepsByCategory(applicationCategoryId, trackingNumber) {
    const categoryId = Number.parseInt(applicationCategoryId, 10);
    const normalizedTracking = String(trackingNumber || "").trim();
    if (!Number.isFinite(categoryId) || categoryId <= 0) return [];
    if (!normalizedTracking) return [];

    const sequelize = Application.sequelize;

    const runModernQuery = async () => {
      return sequelize.query(
        `
          SELECT
            w.id AS work_flow_id,
            w.application_category_id,
            w._order,
            w.unit_id,
            v.rank_name AS unit_name,
            w.role_id,
            rm.role_name,
            w.is_start,
            w.is_final,
            w.can_assign,
            w.can_approve,
            w.can_return,
            ap.id AS process_id,
            ap.status AS process_status,
            ap.assigned_to,
            ap.step_order AS process_step_order,
            ap.created_at AS process_created_at,
            ap.updated_at AS process_updated_at
          FROM work_flow w
          LEFT JOIN vyeo v ON v.id = w.unit_id
          LEFT JOIN role_management rm ON rm.id = w.role_id
          LEFT JOIN application_processes ap
            ON ap.work_flow_id = w.id
           AND ap.tracking_number = :trackingNumber
          WHERE w.application_category_id = :applicationCategoryId
            AND w.deleted_at IS NULL
          ORDER BY w._order ASC
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            applicationCategoryId: categoryId,
            trackingNumber: normalizedTracking,
          },
        },
      );
    };

    const runLegacyQuery = async () => {
      return sequelize.query(
        `
          SELECT
            w.id AS work_flow_id,
            w.application_category_id,
            w._order,
            w.start_from AS unit_id,
            v.rank_name AS unit_name,
            NULL AS role_id,
            NULL AS role_name,
            0 AS is_start,
            0 AS is_final,
            0 AS can_assign,
            0 AS can_approve,
            0 AS can_return,
            ap.id AS process_id,
            ap.status AS process_status,
            ap.assigned_to,
            ap.step_order AS process_step_order,
            ap.created_at AS process_created_at,
            ap.updated_at AS process_updated_at
          FROM work_flow w
          LEFT JOIN vyeo v ON v.id = w.start_from
          LEFT JOIN application_processes ap
            ON ap.work_flow_id = w.id
           AND ap.tracking_number = :trackingNumber
          WHERE w.application_category_id = :applicationCategoryId
          ORDER BY w._order ASC
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            applicationCategoryId: categoryId,
            trackingNumber: normalizedTracking,
          },
        },
      );
    };

    try {
      return await runModernQuery();
    } catch (error) {
      if (error?.original?.code === "ER_BAD_FIELD_ERROR" || error?.parent?.code === "ER_BAD_FIELD_ERROR") {
        return runLegacyQuery();
      }
      throw error;
    }
  }

  // 2. Fetch applications assigned to a staff (Inbox)
  static async fetchApplicationsByStaff(staffId) {
    return await Application.findAll({
      where: { staff_id: staffId },
      include: [
        { model: ApplicationCategory },
        { model: Staff, attributes: ["id", "name", "role"] },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  // 3. Fetch single application with details
  static async fetchApplicationDetails(trackingNumber, currentUser = null) {
    const application = await Application.findOne({
      where: { tracking_number: trackingNumber },
      include: [
        { model: ApplicationCategory, as: "application_category" },
        { model: User, as: "applicant" },
        { model: Staff, as: "assigned_staff", attributes: ["id", "name"] },
        {
          model: EstablishingSchool,
          as: "establishing_school",
          include: [
            {
              model: SchoolCategory,
              as: "school_type",
              required: false,
            },
            {
              model: SchoolRegistration,
              as: "school_registration",
              required: false,
              include: [
                {
                  model: RegistryType,
                  as: "registration",
                  required: false,
                },
              ],
            },
            {
              model: SchoolSubCategory,
              as: "school_sub_category",
              required: false,
            },
            {
              model: RegistryType,
              as: "registry_type",
              required: false,
            },
            {
              model: Language,
              as: "language",
              required: false,
            },
            {
              model: BuildingStructure,
              as: "building_structure",
              required: false,
            },
            {
              model: SchoolGenderType,
              as: "school_gender_type",
              required: false,
            },
            {
              model: SchoolSpecialization,
              as: "school_specialization",
              required: false,
            },
            {
              model: RegistrationStructure,
              as: "registration_structure",
              required: false,
            },
            {
              model: Curriculum,
              as: "curriculum",
              required: false,
            },
            {
              model: CertificateType,
              as: "certificate_type",
              required: false,
            },
            {
              model: SectName,
              as: "sect_name",
              required: false,
            },
            {
              model: Applicant,
              as: "contact_person",
              required: false,
              include: [
                {
                  model: PersonalInfo,
                  as: "personal_info",
                  required: false,
                  attributes: [
                    "id",
                    "secure_token",
                    "first_name",
                    "middle_name",
                    "last_name",
                    "occupation",
                    "identity_type_id",
                    "personal_id_number",
                    "user_id",
                    "created_at",
                    "updated_at",
                  ],
                },
                {
                  model: InstituteInfo,
                  as: "institute_info",
                  required: false,
                  attributes: [
                    "id",
                    "category",
                    "secure_token",
                    "name",
                    "registration_number",
                    "registration_certificate_copy",
                    "organizational_constitution",
                    "agreement_document",
                    "created_at",
                    "updated_at",
                  ],
                },
                {
                  model: District,
                  as: "lga_district",
                  required: false,
                  attributes: ["id", "LgaCode", "LgaName", "RegionCode"],
                },
              ],
            },
          ],
        },
        {
          model: Comment,
          as: "comments",
          include: [
            {
              model: Staff,
              as: "sender",
              attributes: ["id", "name", "zone_id", "region_code", "district_code"],
            },
            { model: Staff, as: "receiver", attributes: ["id", "name"] },
          ],
        },
        {
          model: Attachment,
          as: "attachments",
          required: false,
          include: [
            {
              model: AttachmentType,
              as: "attachment_type",
              required: false,
            },
          ],
        },
      ],
    });
    
     if (!application) return null;

     const contact = application.establishing_school?.contact_person;

     await resolveApplicantPolymorphic(contact, {
      loadPersonalInfo: async (id) => PersonalInfo.findByPk(id),
      loadInstituteInfo: async (id) => InstituteInfo.findByPk(id),
     });

     if (contact) {
      const rawLocation = String(contact.getDataValue("lga_box_location") || "").trim() || null;
      const lgaDistrict = contact?.lga_district || null;

      if (lgaDistrict?.LgaName) {
        contact.setDataValue("lga_box_location_code", rawLocation);
        contact.setDataValue("lga_box_location_name", lgaDistrict.LgaName);
        contact.setDataValue("lga_box_location", lgaDistrict.LgaName);
        contact.setDataValue("lga_district", {
          id: lgaDistrict.id || null,
          code: lgaDistrict.LgaCode || null,
          name: lgaDistrict.LgaName || null,
          region_code: lgaDistrict.RegionCode || null,
        });
      } else {
        contact.setDataValue("lga_box_location_name", null);
        contact.setDataValue("lga_district", null);
      }
     }

     await this.decorateCommentSenderLocations(application);

     if (application.establishing_school) {
      const hierarchy = await this.resolveLocationHierarchy(application.establishing_school);
      application.establishing_school.setDataValue("location_hierarchy", hierarchy);
      application.establishing_school.setDataValue(
        "school_category",
        application.establishing_school.school_type || null,
      );
      application.establishing_school.setDataValue(
        "certificate_types",
        application.establishing_school.certificate_type || null,
      );

      const schoolRegistration = application.establishing_school.school_registration;
      const shouldLoadCombinations = this.shouldLoadSchoolCombinations(application.establishing_school);

      if (schoolRegistration) {
        if (shouldLoadCombinations) {
          const schoolCombinations = await SchoolCombination.findAll({
            where: { school_registration_id: schoolRegistration.id },
            include: [
              {
                model: Combination,
                as: "combination",
                required: false,
                include: [
                  {
                    model: CertificateType,
                    as: "certificate_type",
                    required: false,
                  },
                  {
                    model: SchoolSpecialization,
                    as: "school_specialization",
                    required: false,
                  },
                ],
              },
            ],
            order: [["id", "ASC"]],
          });

          schoolRegistration.setDataValue("school_combinations", schoolCombinations);
        } else {
          schoolRegistration.setDataValue("school_combinations", []);
        }
      }
     }

     const currentProcess = await this.fetchCurrentProcess(application.tracking_number);
     application.setDataValue("current_process", currentProcess);
     const workflowSteps = await this.fetchWorkflowStepsByCategory(
      application?.application_category_id,
      application?.tracking_number,
     );
     application.setDataValue("workflow_steps", workflowSteps);

     if (currentUser?.id) {
      const workflow = await WorkflowHelper.getWorkflowContext(application, currentUser.id, currentUser);
      const canAttend = await this.canAccessPendingApplication(application, currentUser);
      application.setDataValue("workflow", workflow);
      application.setDataValue("can_attend", canAttend);
     }

     return application;
  }

  // 4. Add comment
  static async addComment(trackingNumber, staffId, content, currentUser = null) {
    return this.createCommentWithLocationSnapshot({
      trackingNumber,
      staffId,
      userTo: null,
      content,
      currentUser: currentUser || {},
    });
  }

  // 5. Advance workflow
  static async advanceWorkflow(trackingNumber, staffId, payload = {}, currentUser = null) {
    const rawAction = String(payload?.action || "").trim();
    const action = this.normalizeWorkflowAction(rawAction);
    const content = String(payload?.content || "").trim();
    const targetStaffId = payload?.target_staff_id;

    if (!action) throw new Error("Workflow action is required.");
    if (!content) throw new Error("Comment is required.");

    const application = await this.fetchApplicationDetails(trackingNumber, currentUser);
    if (!application) throw new Error("Application not found");

    const workflow = application.get("workflow")
      || await WorkflowHelper.getWorkflowContext(application, staffId, currentUser || {});
    const allowedActions = Array.isArray(workflow?.allowed_actions) ? workflow.allowed_actions : [];

    if (!allowedActions.includes(action)) {
      throw new Error("This workflow action is not allowed for you.");
    }

    const actorId = Number.parseInt(staffId, 10);
    const currentProcess = application.get("current_process") || null;
    const currentProcessId = Number.parseInt(currentProcess?.id, 10);
    const currentWorkflowId = Number.parseInt(currentProcess?.work_flow_id, 10);
    const currentProcessStepOrder = Number.parseInt(currentProcess?.step_order, 10);
    const workflowSteps = this.normalizeWorkflowRouteSteps(application.get("workflow_steps") || []);
    const currentStepIndex = workflowSteps.findIndex((step) => Number(step.work_flow_id) === currentWorkflowId);
    const currentWorkflowStep = currentStepIndex >= 0 ? workflowSteps[currentStepIndex] : null;

    if (!Number.isFinite(currentProcessId) || currentProcessId <= 0) {
      throw new Error("No active workflow process found for this application.");
    }

    if (!Number.isFinite(currentWorkflowId) || currentWorkflowId <= 0) {
      throw new Error("Current workflow step is missing.");
    }

    const snapshotContext = await this.resolveCommentSnapshotContext(currentUser || {}, staffId);
    const nextRouteStep = currentStepIndex >= 0 ? (workflowSteps[currentStepIndex + 1] || null) : null;
    const previousRouteStep = currentStepIndex > 0 ? (workflowSteps[currentStepIndex - 1] || null) : null;

    const transaction = await Application.sequelize.transaction();

    try {
      if (action === "Assign") {
        const parsedTargetStaffId = Number.parseInt(targetStaffId, 10);
        if (!Number.isFinite(parsedTargetStaffId) || parsedTargetStaffId <= 0) {
          throw new Error("Please select staff to assign.");
        }

        const assignableStaff = Array.isArray(workflow?.assignable_staff) ? workflow.assignable_staff : [];
        if (
          assignableStaff.length
          && !assignableStaff.some((row) => Number.parseInt(row?.id, 10) === parsedTargetStaffId)
        ) {
          throw new Error("Selected staff is not assignable in this workflow unit.");
        }

        await this.createCommentWithLocationSnapshot({
          trackingNumber: application.tracking_number,
          staffId,
          userTo: parsedTargetStaffId,
          content,
          action,
          applicationProcessId: currentProcessId,
          currentUser: currentUser || {},
          snapshotContext,
          transaction,
        });

        await this.setCurrentProcessInProgress(currentProcessId, parsedTargetStaffId, actorId, transaction);

        if (Number(application.is_approved || 0) === 0) {
          application.is_approved = 1;
        }
        application.staff_id = parsedTargetStaffId;
        application.status_id = 1;
        application.approved_by = null;
        application.approved_at = null;
        application.updated_at = new Date();
        await application.save({ transaction });
      } else if (action === "Review") {
        await this.createCommentWithLocationSnapshot({
          trackingNumber: application.tracking_number,
          staffId,
          userTo: null,
          content,
          action,
          applicationProcessId: currentProcessId,
          currentUser: currentUser || {},
          snapshotContext,
          transaction,
        });

        await this.setCurrentProcessPending(currentProcessId, actorId, transaction);

        if (Number(application.is_approved || 0) === 0) {
          application.is_approved = 1;
        }
        application.staff_id = null;
        application.status_id = 1;
        application.approved_by = null;
        application.approved_at = null;
        application.updated_at = new Date();
        await application.save({ transaction });
      } else if (action === "Forward") {
        if (!nextRouteStep) {
          throw new Error("No next workflow step configured.");
        }

        await this.createCommentWithLocationSnapshot({
          trackingNumber: application.tracking_number,
          staffId,
          userTo: null,
          content,
          action,
          applicationProcessId: currentProcessId,
          currentUser: currentUser || {},
          snapshotContext,
          transaction,
        });

        await this.closeCurrentProcess(currentProcessId, "Completed", actorId, transaction);
        await this.createPendingApplicationProcess({
          trackingNumber: application.tracking_number,
          workFlowId: nextRouteStep.work_flow_id,
          stepOrder: this.resolveStepOrderValue(nextRouteStep, currentProcessStepOrder + 1),
          actorId,
          transaction,
        });

        if (Number(application.is_approved || 0) === 0) {
          application.is_approved = 1;
        }
        application.staff_id = null;
        application.status_id = 1;
        application.approved_by = null;
        application.approved_at = null;
        application.updated_at = new Date();
        await application.save({ transaction });
      } else if (action === "Return") {
        if (Number.parseInt(currentWorkflowStep?.is_start, 10) === 1) {
          throw new Error("Cannot return from start workflow step.");
        }
        if (!previousRouteStep) {
          throw new Error("No previous workflow step configured.");
        }

        await this.createCommentWithLocationSnapshot({
          trackingNumber: application.tracking_number,
          staffId,
          userTo: null,
          content,
          action,
          applicationProcessId: currentProcessId,
          currentUser: currentUser || {},
          snapshotContext,
          transaction,
        });

        await this.closeCurrentProcess(currentProcessId, "Returned", actorId, transaction);
        await this.createPendingApplicationProcess({
          trackingNumber: application.tracking_number,
          workFlowId: previousRouteStep.work_flow_id,
          stepOrder: this.resolveStepOrderValue(previousRouteStep, currentProcessStepOrder - 1),
          actorId,
          transaction,
        });

        if (Number(application.is_approved || 0) === 0) {
          application.is_approved = 1;
        }
        application.staff_id = null;
        application.status_id = 1;
        application.approved_by = null;
        application.approved_at = null;
        application.updated_at = new Date();
        await application.save({ transaction });
      } else if (action === "Approve" || action === "Reject") {
        if (Number.parseInt(currentWorkflowStep?.is_final, 10) !== 1) {
          throw new Error("Approve/Reject is allowed only on final workflow unit.");
        }

        await this.createCommentWithLocationSnapshot({
          trackingNumber: application.tracking_number,
          staffId,
          userTo: null,
          content,
          action,
          applicationProcessId: currentProcessId,
          currentUser: currentUser || {},
          snapshotContext,
          transaction,
        });

        await this.closeCurrentProcess(currentProcessId, "Completed", actorId, transaction);

        application.staff_id = actorId;
        application.status_id = 1;
        application.is_approved = action === "Approve" ? 2 : 3;
        application.approved_by = actorId;
        application.approved_at = new Date();
        application.updated_at = new Date();
        await application.save({ transaction });
      } else {
        const actor = workflow?.actor || await WorkflowHelper.getStaffProfile(staffId);
        const target = await WorkflowHelper.resolveActionTarget({
          action,
          actor,
          application,
          targetStaffId,
          assignableStaff: workflow?.assignable_staff,
        });

        await this.createCommentWithLocationSnapshot({
          trackingNumber: application.tracking_number,
          staffId,
          userTo: target?.targetStaff?.id || null,
          content,
          action,
          applicationProcessId: currentProcessId,
          currentUser: currentUser || {},
          snapshotContext,
          transaction,
        });

        application.staff_id = target.updates.staff_id;
        application.status_id = target.updates.status_id;
        application.is_approved = target.updates.is_approved;
        application.approved_by = target.updates.approved_by;
        application.approved_at = target.updates.approved_at;
        application.updated_at = new Date();
        await application.save({ transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return await this.fetchApplicationDetails(trackingNumber, currentUser);
  }
}

module.exports = ApplicationAPIService;
