import { AdminSecurityAudit } from "../models/AdminSecurityAudit.js";

export const recordAdminSecurityAudit = async ({ actorId, targetId, targetType, action, previousValue, newValue, request = {} }) =>
  AdminSecurityAudit.create({
    actorId,
    targetId,
    targetType,
    action,
    previousValue,
    newValue,
    ipAddress: String(request.ip || "").slice(0, 64),
    userAgent: String(request.userAgent || "").slice(0, 512),
  });
