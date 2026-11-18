/**
 * Release gates default closed.
 * Official SETA exports are intentionally unavailable until the first SETA,
 * authoritative template, reporting year and approval process are verified.
 * Setting an environment variable alone MUST NOT enable this feature.
 */
export const RELEASE_GATES = Object.freeze({
  officialSetaExports: false,
  externalSetaSubmission: false,
  employerRegistration: false,
  collectEmployeeData: false,
  grantEligibilityCalculations: false,
} as const);

export function canUseOfficialSetaExports(): boolean {
  return RELEASE_GATES.officialSetaExports;
}
