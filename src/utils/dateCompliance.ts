import { PpmSchedule, PpmComplianceStatus, Asset } from "../types";

export const HOSPITAL_TIMEZONE = "Asia/Riyadh";

/**
 * Normalizes a date to hospital calendar day (midnight in facility timezone)
 */
export function parseHospitalDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  // If dateStr is YYYY-MM-DD format, parse year, month, day directly to avoid UTC shift
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Calculates calendar days remaining until target date relative to reference date.
 * Negative number means overdue.
 */
export function calculateDaysRemaining(
  targetDateStr?: string | null,
  referenceDate: Date = new Date()
): number | null {
  const target = parseHospitalDate(targetDateStr);
  if (!target) return null;
  const ref = parseHospitalDate(referenceDate.toISOString()) || new Date();
  ref.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - ref.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Centralized compliance status calculator:
 * - متأخرة: Passed the due date (daysRemaining < 0)
 * - مستحقة قريباً: Due within alert window (0 <= daysRemaining <= alertWindowDays)
 * - سارية: Beyond alert window (daysRemaining > alertWindowDays)
 * - غير مكتملة: Date is missing or unparseable
 */
export function calculateComplianceStatus(
  nextDueDateStr?: string | null,
  alertWindowDays: number = 7,
  referenceDate: Date = new Date()
): PpmComplianceStatus {
  const daysRemaining = calculateDaysRemaining(nextDueDateStr, referenceDate);
  if (daysRemaining === null) {
    return "غير مكتملة";
  }
  if (daysRemaining < 0) {
    return "متأخرة";
  }
  if (daysRemaining <= alertWindowDays) {
    return "مستحقة قريباً";
  }
  return "سارية";
}

/**
 * Reconciles PPM schedules with the single source of truth (Assets registry)
 * Prevents desynchronized names, models, or departments.
 */
export function reconcilePpmSchedulesWithAssets(
  schedules: PpmSchedule[],
  assets: Asset[],
  alertWindowDays: number = 7,
  referenceDate: Date = new Date()
): PpmSchedule[] {
  const assetMap = new Map<string, Asset>(assets.map((a) => [a.id, a]));

  return schedules.map((schedule) => {
    const linkedAsset = assetMap.get(schedule.assetId);
    const dynamicStatus = schedule.complianceStatus === "غير مكتملة" ? "غير مكتملة" : calculateComplianceStatus(
      schedule.nextDueDate,
      alertWindowDays,
      referenceDate
    );

    if (linkedAsset) {
      return {
        ...schedule,
        assetName: linkedAsset.name,
        model: linkedAsset.model,
        department: linkedAsset.department,
        serial: linkedAsset.serial,
        location: linkedAsset.location,
        complianceStatus: dynamicStatus,
      };
    }

    return {
      ...schedule,
      complianceStatus: dynamicStatus,
    };
  });
}
