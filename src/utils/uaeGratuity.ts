// UAE End-of-Service Gratuity calculation, per UAE Labour Law No. 33 of 2021, Article 51.
//
// This is real business logic (not a UI mock) — the same formula a backend
// service would implement, kept here so the frontend can compute a genuine
// gratuity estimate today, before Phase 1c's backend exists.
//
// IMPORTANT: validate against current MOHRE guidance and legal counsel
// before relying on this for a real payout — see the flag in the HRMS plan.

export type TerminationType = 'resignation' | 'termination' | 'contract_end' | 'termination_for_cause';

export interface GratuityInput {
  basicMonthlySalary: number;
  joinDate: string; // ISO date
  lastWorkingDay: string; // ISO date
  terminationType: TerminationType;
}

export interface GratuityResult {
  eligible: boolean;
  yearsOfService: number;
  dailyWage: number;
  daysEntitled: number;
  grossGratuity: number;
  cap: number;
  finalGratuity: number;
  reason?: string;
}

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

export function calculateGratuity({ basicMonthlySalary, joinDate, lastWorkingDay, terminationType }: GratuityInput): GratuityResult {
  const start = new Date(joinDate);
  const end = new Date(lastWorkingDay);
  const yearsOfService = Math.max(0, (end.getTime() - start.getTime()) / MS_PER_YEAR);
  const dailyWage = basicMonthlySalary / 30;
  const cap = 24 * basicMonthlySalary; // 2 years' worth of basic salary

  if (terminationType === 'termination_for_cause') {
    return {
      eligible: false,
      yearsOfService,
      dailyWage,
      daysEntitled: 0,
      grossGratuity: 0,
      cap,
      finalGratuity: 0,
      reason: 'Article 44 termination for cause forfeits gratuity entirely.',
    };
  }

  if (yearsOfService < 1) {
    return {
      eligible: false,
      yearsOfService,
      dailyWage,
      daysEntitled: 0,
      grossGratuity: 0,
      cap,
      finalGratuity: 0,
      reason: 'Less than 1 year of continuous service — no gratuity entitlement.',
    };
  }

  const firstFiveYears = Math.min(yearsOfService, 5);
  const remainingYears = Math.max(0, yearsOfService - 5);
  const daysEntitled = firstFiveYears * 21 + remainingYears * 30;
  const grossGratuity = daysEntitled * dailyWage;
  const finalGratuity = Math.min(grossGratuity, cap);

  return {
    eligible: true,
    yearsOfService,
    dailyWage,
    daysEntitled,
    grossGratuity,
    cap,
    finalGratuity,
  };
}
