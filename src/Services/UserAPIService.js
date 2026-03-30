require("dotenv").config();

const userModal = require("../../models/userModal");
const roleModel = require("../../models/roleModel");
const rankModel = require("../../models/rankModel");
const hierarchyModel = require("../../models/hierarchyModel");
const zoneModel = require("../../models/zoneModel");
const designationModel = require("../../models/designationModel");
const sharedModel = require("../../models/sharedModel");
const db = require("../Config/DbConfig");
const { QueryTypes } = require("sequelize");
const HandoverService = require("./HandoverService");
const {
  sendEmail,
  setMailOptions,
  generateAccessToken,
  generateRandomText,
} = require("../../utils");
const { resetPassword } = require("../../templates/emailTemplate");

const safeLower = (value) => (value ? String(value).toLowerCase() : "");
const safeUpper = (value) => (value ? String(value).toUpperCase() : "");

const toBoolean = (value) =>
  value === true || value === "true" || value === 1 || value === "1";

const PROFILE_PHONE_REGEX = /^\+?[0-9\s-]{9,20}$/;
const PROFILE_USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,40}$/;
const PROFILE_PHOTO_REGEX = /^data:image\/(png|jpe?g|webp);base64,/i;
const MAX_PROFILE_PHOTO_LENGTH = 3_500_000;

const hasPermission = (req, permissionName) =>
  Array.isArray(req.user?.userPermissions) &&
  req.user.userPermissions.includes(permissionName);

const asPromise = (fn) =>
  new Promise((resolve, reject) => {
    try {
      fn((...args) => resolve(args));
    } catch (error) {
      reject(error);
    }
  });

const extractSearchValue = (req) => {
  const querySearch = req.query.search;
  if (typeof querySearch === "object" && querySearch !== null) {
    return querySearch.value || "";
  }

  return (
    req.query.search_value ||
    querySearch ||
    req.body?.search?.value ||
    req.body?.search_value ||
    ""
  );
};

const getUsers = async (req) => {
  const per_page = Number.parseInt(req.query.per_page, 10) || 10;
  const page = Number.parseInt(req.query.page, 10) || 1;
  const offset = (page - 1) * per_page;
  const search_value = extractSearchValue(req);

  const inactive = toBoolean(
    req.query.inactive !== undefined ? req.query.inactive : req.body?.inactive,
  );
  const unitFilterRaw =
    req.query.unit_id !== undefined ? req.query.unit_id : req.body?.unit_id;
  const requestedUnitId = Number.parseInt(unitFilterRaw, 10);
  const roleName = String(req?.user?.jukumu || req?.user?.role_name || req?.user?.role || "").toLowerCase();
  const isAdminRole = ["super admin", "super-admin", "admin", "system admin", "administrator"].some(
    (name) => roleName.includes(name),
  );
  const unitId = isAdminRole && Number.isInteger(requestedUnitId) && requestedUnitId > 0
    ? requestedUnitId
    : null;

  const [error, users, numRows] = await asPromise((cb) =>
    userModal.getUsers(
      offset,
      per_page,
      search_value,
      req.user,
      inactive,
      unitId,
      (err, list, total) => cb(err, list || [], total || 0),
    ),
  );

  return {
    error: Boolean(error),
    statusCode: error ? 306 : 300,
    data: error ? [] : users,
    numRows: Number(numRows || 0),
    current_page: page,
    per_page,
    last_page: Math.ceil(Number(numRows || 0) / per_page) || 1,
    message: error ? "Failed to fetch users." : "List of Users.",
  };
};

const findUser = async (req) => {
  const userId = req.params.id;
  const [error, success, user] = await asPromise((cb) =>
    userModal.findUser(userId, req.user, (err, ok, data) => cb(err, ok, data)),
  );
  const hasData = Array.isArray(user) ? user.length > 0 : Boolean(user);

  return {
    error: Boolean(error) || !hasData,
    statusCode: error || !hasData ? 306 : 300,
    data: error ? [] : user,
    message: error ? "Not Found" : hasData && success ? "Success" : "Not Found",
  };
};

const createUser = async (req) => {
  const password = req.body.password || generateRandomText(10);
  const signPayload = Array.isArray(req.body.selectedFile)
    ? req.body.selectedFile[0]
    : req.body.selectedFile || null;
  const userData = {
    fullname: req.body.name,
    username: req.body.username,
    phoneNumber: req.body.phone,
    email: req.body.email,
    roleId: req.body.roleId,
    password,
    levelId: req.body.levelId,
    lgas: req.body.lgas,
    zone: req.body.zone,
    region: req.body.region,
    sign: signPayload,
  };

  const [success, user, duplicateCheo = false, emailExists = false] = await asPromise((cb) =>
    userModal.createUser(userData, (...args) => cb(...args)),
  );

  return {
    error: success ? false : true,
    statusCode: success ? 300 : 306,
    data: success ? user : [],
    message: duplicateCheo
      ? "Whoops! Mtumiaji mwenye cheo hiki ameshasajiliwa."
      : emailExists
      ? "Baruapepe ya mtumiaji huyu imeshatumika, Tafadhali hakiki ili uendelee."
      : success
      ? "Umefanikiwa kutengeneza akaunti ya Mtumiaji."
      : "Haujafanikiwa kutengeneza Akaunti kuna tatizo limetokea",
  };
};

const updateUser = async (req) => {
  const userId = req.params.id;
  const signPayload = Array.isArray(req.body.selectedFile)
    ? req.body.selectedFile[0]
    : req.body.selectedFile || null;
  const [success, user, duplicateCheo = false, emailExists = false] = await asPromise((cb) =>
    userModal.updateUser(
      userId,
      {
        fullname: req.body.name,
        username: req.body.username,
        phoneNumber: req.body.phone,
        email: req.body.email,
        roleId: req.body.roleId,
        password: req.body.password,
        levelId: req.body.levelId,
        lgas: req.body.lgas,
        zone: req.body.zone,
        region: req.body.region,
        sign: signPayload,
        has_to_change_password_changed: req.body.has_to_change_password_changed,
      },
      (...args) => cb(...args),
    ),
  );

  return {
    error: success ? false : true,
    statusCode: success ? 300 : 306,
    data: success ? user : [],
    message: duplicateCheo
      ? "Whoops! Mtumiaji mwenye cheo hiki ameshasajiliwa."
      : emailExists
      ? "Baruapepe ya mtumiaji huyu imeshatumika, Tafadhali hakiki ili uendelee."
      : success
      ? "Umefanikiwa kubadili taarifa za akaunti ya Mtumiaji."
      : "Haujafanikiwa kubadili taarifa za akaunti hii kuna tatizo limetokea",
  };
};

const activateDeactivateUser = async (req) => {
  const userId = req.params.id;
  const [success, message] = await asPromise((cb) =>
    userModal.activateDeactivateUser(req.user, userId, (ok, msg) => cb(ok, msg)),
  );

  return {
    statusCode: success ? 300 : 306,
    message,
  };
};

const myProfile = async (req) => {
  const [profile, activities] = await asPromise((cb) =>
    userModal.getMyProfile(req.user.id, (data, logActivities) => cb(data, logActivities)),
  );

  const [staffs] = await asPromise((cb) =>
    sharedModel.myStaffs(req.user, (data) => cb(data || [])),
  );

  return {
    user: profile,
    staffs,
    activities,
  };
};

const updateMyProfile = async (req) => {
  const canEditUsername = hasPermission(req, "update-users");

  const fullName = String(req.body?.full_name || req.body?.name || req.user?.name || "").trim();
  const phoneNumber = String(req.body?.phone_number || "").trim();
  const emailNotify = toBoolean(req.body?.email_notify) ? 1 : 0;
  const username = String(req.body?.username || "").trim();
  const hasProfilePhoto = Object.prototype.hasOwnProperty.call(req.body || {}, "profile_photo");
  const profilePhoto = hasProfilePhoto ? String(req.body?.profile_photo || "").trim() : null;

  if (!fullName || fullName.length < 3) {
    return {
      statusCode: 422,
      message: "Jina kamili linahitajika (angalau herufi 3).",
    };
  }

  if (!phoneNumber || !PROFILE_PHONE_REGEX.test(phoneNumber)) {
    return {
      statusCode: 422,
      message: "Namba ya simu si sahihi. Tumia tarakimu 9 hadi 20.",
    };
  }

  if (canEditUsername && (!username || !PROFILE_USERNAME_REGEX.test(username))) {
    return {
      statusCode: 422,
      message: "Jina la mtumiaji si sahihi. Tumia herufi/tarakimu 3 hadi 40.",
    };
  }

  if (hasProfilePhoto) {
    const isRemoving = profilePhoto === "";
    if (!isRemoving) {
      if (
        !PROFILE_PHOTO_REGEX.test(profilePhoto) ||
        profilePhoto.length > MAX_PROFILE_PHOTO_LENGTH
      ) {
        return {
          statusCode: 422,
          message: "Picha ya wasifu si sahihi. Tumia PNG/JPG/WEBP yenye ukubwa sahihi.",
        };
      }
    }
  }

  const payload = {
    user_id: req.user.id,
    full_name: fullName,
    phone_number: phoneNumber,
    email_notify: emailNotify,
  };

  if (canEditUsername) {
    payload.username = username;
  }

  if (hasProfilePhoto) {
    payload.profile_photo = profilePhoto;
  }

  const [success, meta] = await asPromise((cb) =>
    userModal.updateMyProfile(payload, (ok, info = {}) => cb(Boolean(ok), info)),
  );

  if (!success && meta?.reason === "email_exists") {
    return {
      statusCode: 422,
      message: "Barua pepe imeshatumika na mtumiaji mwingine.",
    };
  }

  if (!success && meta?.reason === "username_exists") {
    return {
      statusCode: 422,
      message: "Jina la mtumiaji limeshatumika.",
    };
  }

  if (!success && meta?.reason === "not_found") {
    return {
      statusCode: 404,
      message: "Akaunti haijapatikana.",
    };
  }

  return {
    statusCode: success ? 300 : 306,
    message: success
      ? "Umefanikiwa kurekebisha taarifa zako."
      : "Haujafanikiwa kurekebisha taarifa zako.",
  };
};

const changeMyPassword = async (req) => {
  const { oldpassword, newpassword } = req.body;
  const [success, message] = await asPromise((cb) =>
    userModal.changeMyPassword(oldpassword, newpassword, req.user.id, (ok, msg) => cb(ok, msg)),
  );

  return {
    statusCode: success ? 300 : 306,
    message,
  };
};

const resetUserPassword = async (req) => {
  const email = req.body.email;
  const [success, user] = await asPromise((cb) =>
    userModal.findUserByEmail(email, (ok, data) => cb(ok, data || [])),
  );

  if (!success) {
    return {
      statusCode: 306,
      message: "Mtumiaji mwenye email hii hayupo au akaunti yake imesitishwa(In Active).",
    };
  }

  const link = `${(process.env.APP_URL + "/PasswordReset" || "http:localhost:" + process.env.HTTP_PORT)}/PasswordReset`;
  const name = user[0].name;
  const htmlContent = resetPassword(name, link);
  const mailOptions = setMailOptions(email, "Reset Password", htmlContent);

  const [error, info] = await asPromise((cb) =>
    sendEmail(mailOptions, (err, details) => cb(err, details)),
  );

  return {
    statusCode: error ? 306 : 300,
    data: error ? null : info,
    message: error
      ? "Email haijatumwa kwa muhusika kuna tatizo."
      : `Email imetumwa kwa mtumiaji mwenye email ${email}`,
  };
};

const buildFreshTokenPayload = async (user = {}) => {
  const userId = Number.parseInt(user?.id, 10);
  if (!userId) return null;

  const users = await db.query(
    `SELECT s.id AS id, s.name AS name, s.username AS username, s.email AS email,
            s.user_status AS user_status, s.new_role_id AS role_id, s.station_level AS station_level,
            s.user_level AS user_level, s.office AS office, s.zone_id AS zone_id, z.zone_name AS zone_name,
            s.region_code AS region_code, s.district_code AS district_code, s.is_password_changed AS is_password_changed,
            v.id AS section_id, v.id AS cheo_office, rnk.name AS ngazi, v.rank_name AS sehemu, r.name AS rank_name,
            rm.role_name AS jukumu
     FROM staffs s
     INNER JOIN roles r ON r.id = s.user_level
     INNER JOIN vyeo v ON r.vyeoId = v.id
     INNER JOIN role_management rm ON rm.id = s.new_role_id
     LEFT JOIN ranks rnk ON rnk.id = v.rank_level
     LEFT JOIN zones z ON z.id = s.zone_id
     WHERE s.id = :userId AND s.user_status = 1
     LIMIT 1`,
    {
      type: QueryTypes.SELECT,
      replacements: { userId },
    },
  );

  const account = users?.[0];
  if (!account) return null;

  const permissions = await db.query(
    `SELECT pr.permission_id, p.permission_name
     FROM permission_role pr
     JOIN permissions p ON pr.permission_id = p.id
     WHERE pr.role_id = :roleId`,
    {
      type: QueryTypes.SELECT,
      replacements: { roleId: account.role_id },
    },
  );

  const basePermissions = permissions.map((item) => item.permission_name);
  const handoverContext = await HandoverService.resolveDelegationContextForUser(account.id, {
    autoTransition: true,
  });
  const userPermissions = Array.from(
    new Set([...(basePermissions || []), ...(handoverContext?.delegatedPermissions || [])]),
  );
  const primaryDelegation = handoverContext?.primaryDelegation || null;

  return {
    id: account.id,
    name: account.name,
    office: account.office,
    zone_id: Number(account.zone_id || 0),
    kanda: account.zone_name || null,
    region_code: account.region_code || null,
    district_code: account.district_code || null,
    userPermissions,
    user_level: Number(account.user_level || 0),
    section_id: Number(account.section_id || 0),
    ngazi: safeLower(account.ngazi),
    sehemu: safeLower(account.sehemu),
    cheo: primaryDelegation?.from_user_rank_name
      ? `k${safeLower(primaryDelegation.from_user_rank_name)}`
      : safeLower(account.rank_name || user?.cheo || ""),
    handover_by: primaryDelegation?.from_user_id || user?.handover_by || null,
    delegated_from_user_name: primaryDelegation?.from_user_name || user?.delegated_from_user_name || null,
    delegated_until_at: primaryDelegation?.end_at || user?.delegated_until_at || null,
    delegated_from_user_ids: Array.isArray(handoverContext?.delegatedFromUserIds)
      ? handoverContext.delegatedFromUserIds
      : [],
    active_handover_ids: Array.isArray(handoverContext?.activeHandoverIds)
      ? handoverContext.activeHandoverIds
      : [],
    primary_handover_id: primaryDelegation?.id || null,
    has_active_incoming_handover: Boolean(handoverContext?.hasIncomingActiveHandover),
    has_active_outgoing_handover: Boolean(handoverContext?.hasOutgoingActiveHandover),
    delegation_scope_type: primaryDelegation?.scope_type || null,
    delegation_status: primaryDelegation?.status || null,
    is_password_changed: account.is_password_changed,
    cheo_office: Number(account.cheo_office || 0),
    jukumu: safeUpper(account.jukumu),
    role_id: account.role_id,
    station_level: account.station_level ?? null,
  };
};

const refreshToken = async (req) => {
  const freshPayload = await buildFreshTokenPayload(req.user || {});
  if (!freshPayload) {
    return {
      success: false,
      statusCode: 401,
      message: "User not found or inactive",
    };
  }

  const token = generateAccessToken(freshPayload);
  return {
    success: true,
    statusCode: 300,
    token,
    userPermissions: freshPayload.userPermissions,
    role_id: freshPayload.role_id,
  };
};

const lookupRoles = async (req) => {
  const [error, roles] = await asPromise((cb) =>
    roleModel.lookupRoles(req.user, (err, data) => cb(err, data || [])),
  );

  return {
    error: Boolean(error),
    statusCode: error ? 306 : 300,
    data: error ? [] : roles,
    message: error ? "Roles hazikupatikana." : "Success",
  };
};

const lookupRanks = async (req) => {
  const [error, ranks] = await asPromise((cb) =>
    rankModel.lookupRanks(req.user, (err, data) => cb(err, data || [])),
  );

  return {
    error: Boolean(error),
    statusCode: error ? 306 : 300,
    data: error ? [] : ranks,
    message: error ? "Ngazi hazikupatikana." : "Success",
  };
};

const lookupHierarchiesByRanks = async (req) => {
  const rankId = req.query.rank_id || req.body?.rank_id;
  const [error, hierarchies] = await asPromise((cb) =>
    hierarchyModel.lookupHierarchies(rankId, req.user, (err, data) => cb(err, data || [])),
  );

  return {
    error: Boolean(error),
    statusCode: error ? 306 : 300,
    hierarchies: error ? [] : hierarchies,
    message: error ? "Hierarchies hazikupatikana." : "List of Hierarchies.",
  };
};

const lookupZones = async (req) => {
  const [error, zones] = await asPromise((cb) =>
    zoneModel.lookupZones(req.user, (err, data) => cb(err, data || [])),
  );

  return {
    error: Boolean(error),
    statusCode: error ? 306 : 300,
    data: error ? [] : zones,
    message: error ? "Kanda hazikupatikana." : "Success",
  };
};

const lookupDesignationsBySection = async (req) => {
  const hierarchyId = req.query.hierarchy_id || req.body?.hierarchy_id;
  const [error, designations] = await asPromise((cb) =>
    designationModel.lookupDesignations(hierarchyId, (err, data) => cb(err, data || [])),
  );

  return {
    error: Boolean(error),
    statusCode: error ? 306 : 300,
    designations: error ? [] : designations,
    message: error ? "Vyeo havikupatikana." : "List of designations.",
  };
};

module.exports = {
  getUsers,
  findUser,
  createUser,
  updateUser,
  activateDeactivateUser,
  myProfile,
  updateMyProfile,
  changeMyPassword,
  resetUserPassword,
  refreshToken,
  lookupRoles,
  lookupRanks,
  lookupHierarchiesByRanks,
  lookupZones,
  lookupDesignationsBySection,
};
