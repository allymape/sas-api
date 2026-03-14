require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { QueryTypes } = require("sequelize");
const db = require("../Config/DbConfig");

const getUserOffice = (user) => {
  if (!user.zone_id && !user.district_code) return 1;
  if (user.zone_id && !user.district_code) return 2;
  if (user.district_code) return 3;
  return 0;
};

const safeLower = (value) => (value ? String(value).toLowerCase() : "");
const safeUpper = (value) => (value ? String(value).toUpperCase() : "");
const safeTitle = (value) => {
  if (!value) return "";
  const text = String(value).trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const buildTokenPayload = (user) => ({
  id: user.id,
  name: user.name,
  office: user.office,
  zone_id: user.zone_id,
  kanda: user.kanda,
  region_code: user.region_code,
  district_code: user.district_code,
  userPermissions: user.userPermissions,
  user_level: Number(user.user_level),
  section_id: Number(user.section_id),
  ngazi: user.ngazi,
  sehemu: user.sehemu,
  cheo: user.cheo,
  handover_by: user.handover_by,
  is_password_changed: user.is_password_changed,
  cheo_office: Number(user.cheo_office),
  jukumu: user.jukumu,
});

const TRANSIENT_LOCK_ERRNOS = new Set([1205, 1213]); // lock wait timeout, deadlock

const getDbErrorMeta = (error) => {
  const source = error?.original || error || {};
  return {
    errno: Number(source.errno || 0),
    code: source.code || "",
    sqlState: source.sqlState || "",
    message: source.sqlMessage || error?.message || "Unknown DB error",
  };
};

const isTransientLockError = (error) => {
  const { errno, code } = getDbErrorMeta(error);
  return TRANSIENT_LOCK_ERRNOS.has(errno) || ["ER_LOCK_WAIT_TIMEOUT", "ER_LOCK_DEADLOCK"].includes(code);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateAccessToken = (user) => {
  return jwt.sign(
    user,
    process.env.ACCESS_TOKEN_SECRET || "the-super-strong-secrect",
    { expiresIn: process.env.EXPIRED_IN || "15m" },
  );
};

class AuthAPIService {
  static async runNonCriticalWrite(sql, options, contextLabel, config = {}) {
    const {
      suppressTransientLockLog = true,
      maxAttempts = 2,
    } = config;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await db.query(sql, options);
        return true;
      } catch (error) {
        const meta = getDbErrorMeta(error);
        const canRetry = isTransientLockError(error) && attempt < maxAttempts;
        const isTransientLock = isTransientLockError(error);

        if (canRetry) {
          await sleep(80 * attempt);
          continue;
        }

        if (isTransientLock && suppressTransientLockLog) {
          return false;
        }

        console.warn(`[AuthAPIService] Non-critical write failed (${contextLabel})`, {
          attempt,
          errno: meta.errno,
          code: meta.code,
          sqlState: meta.sqlState,
          message: meta.message,
        });
        return false;
      }
    }

    return false;
  }

  static async resolveOfficeName(office, user) {
    if (office === 1) return "HQ";

    if (office === 2) {
      const rows = await db.query(
        "SELECT zone_name FROM zones WHERE id = :zone_id LIMIT 1",
        {
          type: QueryTypes.SELECT,
          replacements: { zone_id: user.zone_id },
        },
      );
      return rows[0]?.zone_name || null;
    }

    if (office === 3) {
      const rows = await db.query(
        "SELECT LgaName FROM districts WHERE LgaCode = :district_code LIMIT 1",
        {
          type: QueryTypes.SELECT,
          replacements: { district_code: user.district_code },
        },
      );
      return rows[0]?.LgaName || null;
    }

    return null;
  }

  static async getHandover(userId) {
    const rows = await db.query(
      `SELECT h.handover_by, LOWER(r.name) AS handedover_cheo
       FROM handover h
       JOIN staffs s ON s.id = h.handover_by
       JOIN roles r ON r.id = s.user_level
       WHERE h.staff_id = :user_id
         AND h.start <= NOW()
         AND h.end >= NOW()
         AND h.active = 1
       LIMIT 1`,
      {
        type: QueryTypes.SELECT,
        replacements: { user_id: userId },
      },
    );

    return {
      handover_by: rows[0]?.handover_by || null,
      handedover_cheo: rows[0]?.handedover_cheo || null,
    };
  }

  static async login(payload = {}) {
    const { username, password, clientIp, browser, device } = payload;

    if (!username || !password) {
      return {
        error: true,
        statusCode: 422,
        message: "Username na password zinahitajika.",
      };
    }

    const users = await db.query(
      `SELECT s.id AS id, s.password, s.name AS name, s.username AS username,
              s.phone_no AS phone_no, s.user_status AS user_status, s.last_login AS last_login,
              s.role_id AS role_id, s.new_role_id AS new_role_id, s.email AS email,
              v.id AS section_id, rnk.name AS ngazi, v.rank_name AS sehemu,
              rm.role_name AS jukumu, s.station_level AS station_level, s.user_level,
              s.office AS office, r.id AS rank_id, r.name AS rank_name,
              s.zone_id, z.zone_name, s.region_code, s.district_code,
              v.status_id AS status_id, s.is_password_changed, v.id AS cheo_office,
              v.rank_level AS rank_level, s.twofa AS twofa
       FROM staffs s
       INNER JOIN roles r ON r.id = s.user_level
       INNER JOIN vyeo v ON r.vyeoId = v.id
       INNER JOIN role_management rm ON rm.id = s.new_role_id
       LEFT JOIN ranks rnk ON rnk.id = v.rank_level
       LEFT JOIN zones z ON z.id = s.zone_id
       WHERE (s.email = :login OR s.username = :login) AND s.user_status = 1
       LIMIT 1`,
      {
        type: QueryTypes.SELECT,
        replacements: { login: username },
      },
    );

    if (!users.length) {
      return {
        error: false,
        statusCode: 302,
        message: "Wrong username or password.",
      };
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      return {
        error: false,
        statusCode: 302,
        message: "Wrong username or password.",
      };
    }

    const permissions = await db.query(
      `SELECT pr.permission_id, p.permission_name
       FROM permission_role pr
       JOIN permissions p ON pr.permission_id = p.id
       WHERE pr.role_id = :role_id`,
      {
        type: QueryTypes.SELECT,
        replacements: { role_id: user.new_role_id },
      },
    );

    const userPermissions = permissions.map((item) => item.permission_name);
    const office = getUserOffice(user);
    const office_name = await this.resolveOfficeName(office, user);
    const handover = await this.getHandover(user.id);
    const now = new Date();

    // Non-critical audit writes should never delay login response.
    void this.runNonCriticalWrite(
      "UPDATE staffs SET last_login = :last_login WHERE id = :user_id",
      {
        type: QueryTypes.UPDATE,
        replacements: { last_login: now, user_id: user.id },
      },
      "update-last-login",
      { suppressTransientLockLog: true, maxAttempts: 1 },
    );

    void this.runNonCriticalWrite(
      `INSERT INTO login_activity(staff_id, ip, device, browser, created_at, updated_at)
       VALUES(:staff_id, :ip, :device, :browser, :created_at, :updated_at)`,
      {
        type: QueryTypes.INSERT,
        replacements: {
          staff_id: user.id,
          ip: clientIp || null,
          device: safeTitle(device || "unknown"),
          browser: browser || "",
          created_at: now,
          updated_at: now,
        },
      },
      "insert-login-activity",
      { suppressTransientLockLog: true, maxAttempts: 1 },
    );

    const userData = {
      id: user.id,
      name: user.name,
      username: user.username,
      phone_no: user.phone_no,
      user_status: user.user_status,
      last_login: now,
      user_level: user.user_level,
      role_id: user.new_role_id,
      station_level: user.station_level,
      office,
      office_name,
      rank_name: user.rank_name,
      is_password_changed: user.is_password_changed,
      zone_id: Number(user.zone_id),
      kanda: user.zone_name,
      region_code: user.region_code,
      district_code: user.district_code,
      rank_level: user.rank_level,
      twofa: user.twofa,
      email: user.email,
      section_id: user.section_id,
      ngazi: safeLower(user.ngazi),
      sehemu: safeLower(user.sehemu),
      cheo: handover.handedover_cheo
        ? "k" + handover.handedover_cheo
        : safeLower(user.rank_name),
      handover_by: handover.handover_by,
      cheo_office: user.cheo_office,
      jukumu: safeUpper(user.jukumu),
      userPermissions,
    };

    const token = generateAccessToken(buildTokenPayload(userData));

    return {
      error: false,
      statusCode: 300,
      message: "Logged in!",
      token,
      RoleManage: permissions,
      user: userData,
    };
  }

  static async logout() {
    return {
      error: false,
      statusCode: 300,
      message: "Logged out successfully.",
    };
  }
}

module.exports = AuthAPIService;
