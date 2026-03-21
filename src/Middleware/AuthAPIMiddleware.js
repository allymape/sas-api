// src/Middleware/AuthAPIMiddleware.js
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { getStaffWithRole } = require("../Services/StaffAPIService");
const { getJson, setJsonEx } = require("../Config/RedisClient");
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "the-super-strong-secrect";

// --------------------------------------------
// Authentication Middleware
// --------------------------------------------
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: true,
        statusCode: 401,
        message: "No token provided. Please login first.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        ACCESS_TOKEN_SECRET,
      );
    } catch (err) {
      return res.status(401).json({
        error: true,
        statusCode: 401,
        message:
          err.name === "TokenExpiredError"
            ? "Token expired. Please login again."
            : "Invalid token. Please login again.",
      });
    }

    // Fetch user from DB when available, but keep token payload as a safe fallback.
    const safeDecoded =
      decoded && typeof decoded === "object" && !Array.isArray(decoded)
        ? decoded
        : {};

    let user = null;
    const staffCacheTtlSeconds = Number.parseInt(
      process.env.AUTH_STAFF_CACHE_TTL_SECONDS,
      10,
    );
    const cacheEnabled = Number.isFinite(staffCacheTtlSeconds) && staffCacheTtlSeconds > 0;
    const staffId = safeDecoded.id;
    const staffCacheKey = staffId ? `sas:auth:staff:v3:${staffId}` : null;

    if (cacheEnabled && staffCacheKey) {
      try {
        const cached = await getJson(staffCacheKey);
        if (cached && typeof cached === "object" && !Array.isArray(cached)) {
          user = cached;
        }
      } catch (cacheError) {
        // Ignore cache errors; fall back to DB.
      }
    }

    try {
      const staffInstance = !user && staffId
        ? await getStaffWithRole(staffId)
        : null;
      if (staffInstance) {
        user =
          typeof staffInstance.toJSON === "function"
            ? staffInstance.toJSON()
            : staffInstance;

        if (cacheEnabled && staffCacheKey) {
          try {
            await setJsonEx(staffCacheKey, staffCacheTtlSeconds, user);
          } catch (cacheWriteError) {
            // Ignore cache errors.
          }
        }
      }
    } catch (dbError) {
      console.error("Auth Middleware staff lookup warning:", dbError);
    }

    if (!user && !safeDecoded.id) {
      return res.status(401).json({
        error: true,
        statusCode: 401,
        message: "User not found or inactive",
      });
    }

   // 4. Check token blacklist
//    const blacklisted = await TokenBlacklist.findOne({ where: { token } });
//    if (blacklisted) {
//      return res.status(401).json({
//        error: true,
//        statusCode: 401,
//        message: "Token has been invalidated",
//      });
//    }


    // Attach user info kwenye request
    const safeUser =
      user && typeof user === "object" && !Array.isArray(user) ? user : {};

    req.user = {
      id: safeUser.id ?? safeDecoded.id,
      name: safeUser.name ?? safeDecoded.name ?? "",
      username: safeUser.username ?? safeDecoded.username ?? "",
      roleId: safeUser.new_role_id ?? safeDecoded.role_id ?? null,
      roleName: safeUser.role?.name || safeDecoded.jukumu || null,
      vyeoId: safeUser.role?.vyeoId || null,
      stationLevel: safeUser.station_level ?? safeDecoded.station_level ?? null,
      office: (() => {
        const rankLevel = Number.parseInt(safeUser?.role?.vyeo?.rank_level, 10);
        if (Number.isFinite(rankLevel)) return rankLevel;
        const staffOffice = Number.parseInt(safeUser.office, 10);
        if (Number.isFinite(staffOffice)) return staffOffice;
        const tokenOffice = Number.parseInt(safeDecoded.office, 10);
        if (Number.isFinite(tokenOffice)) return tokenOffice;
        return 1;
      })(),
      zoneId: safeUser.zone_id ?? safeDecoded.zone_id ?? 0,
      regionCode: safeUser.region_code ?? safeDecoded.region_code ?? null,
      districtCode: safeUser.district_code ?? safeDecoded.district_code ?? null,
      isKaimu: safeUser.kaimu === 1,
      kaimuCheo: safeUser.kaimu_cheo ?? null,
      // Backward-compatible keys used by legacy filters/services.
      userPermissions: Array.isArray(safeDecoded.userPermissions) ? safeDecoded.userPermissions : [],
      section_id: safeDecoded.section_id ?? safeUser.section_id ?? null,
      cheo_office: safeDecoded.cheo_office ?? safeUser.cheo_office ?? null,
      user_level: safeDecoded.user_level ?? safeUser.user_level ?? null,
      zone_id: safeUser.zone_id ?? safeDecoded.zone_id ?? 0,
      region_code: safeUser.region_code ?? safeDecoded.region_code ?? null,
      district_code: safeUser.district_code ?? safeDecoded.district_code ?? null,
      ngazi: safeDecoded.ngazi || null,
      sehemu: safeDecoded.sehemu || null,
      cheo: safeDecoded.cheo || null,
      handover_by: safeDecoded.handover_by || null,
      jukumu: safeDecoded.jukumu || null,
    };

    req.token = token;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({
      error: true,
      statusCode: 500,
      message: "Internal server error during authentication",
    });
  }
};

// --------------------------------------------
// Role-based authorization
// --------------------------------------------
const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user)
      return res
        .status(401)
        .json({ error: true, statusCode: 401, message: "Unauthorized" });

    const userRole = req.user.roleName;
    const userVyeo = req.user.vyeoId;

    if (
      allowedRoles.length > 0 &&
      !allowedRoles.includes(userRole) &&
      !allowedRoles.includes(userVyeo)
    ) {
      return res.status(403).json({
        error: true,
        statusCode: 403,
        message:
          "Forbidden. You do not have permission to access this resource.",
      });
    }

    next();
  };

// --------------------------------------------
// Check user office/region
// --------------------------------------------
const checkOffice = (officeType) => (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ error: true, message: "Unauthorized" });

  if (officeType === "DISTRICT" && !req.user.districtCode) {
    return res
      .status(403)
      .json({
        error: true,
        message: "You must belong to a district to access this resource",
      });
  }

  if (officeType === "REGION" && !req.user.regionCode) {
    return res
      .status(403)
      .json({
        error: true,
        message: "You must belong to a region to access this resource",
      });
  }

  next();
};

module.exports = authMiddleware;
module.exports.authorize = authorize;
module.exports.checkOffice = checkOffice;
