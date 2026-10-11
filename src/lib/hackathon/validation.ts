// Client-side mirror of the checks in hackathon_register_team (the server is
// still the authority and its error message is always shown if it rejects).
import type { PersonInput } from "./types";

export const FIELD_LIMITS = { full_name: 100, registration_number: 30, department: 100, college: 150 } as const;
export const TEAM_NAME_MIN = 2;
export const TEAM_NAME_MAX = 50;

export type PersonErrors = Partial<Record<keyof PersonInput, string>>;

export function emptyPerson(): PersonInput {
  return { full_name: "", registration_number: "", year_of_study: "", phone: "", department: "", college: "" };
}

/** Strips formatting and a leading +91 / 91 so "+91 98765-43210" -> "9876543210". */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}

export function normalizeRegNo(raw: string): string {
  return raw.trim().toUpperCase();
}

export function validatePerson(p: PersonInput): PersonErrors {
  const e: PersonErrors = {};
  const required: [keyof typeof FIELD_LIMITS, string][] = [
    ["full_name", "Enter the full name."],
    ["registration_number", "Enter the registration number."],
    ["department", "Enter the department."],
    ["college", "Enter the college."],
  ];
  for (const [key, message] of required) {
    const value = p[key].trim();
    if (!value) e[key] = message;
    else if (value.length > FIELD_LIMITS[key]) e[key] = `Keep this under ${FIELD_LIMITS[key]} characters.`;
  }
  if (!/^[6-9]\d{9}$/.test(normalizePhone(p.phone))) e.phone = "Enter a 10-digit mobile number starting with 6-9.";
  const year = Number(p.year_of_study);
  if (!Number.isInteger(year) || year < 1 || year > 5) e.year_of_study = "Select the year of study.";
  return e;
}

export function validateTeamName(name: string): string | undefined {
  const len = name.trim().length;
  if (len < TEAM_NAME_MIN || len > TEAM_NAME_MAX) return `Team name must be ${TEAM_NAME_MIN} to ${TEAM_NAME_MAX} characters.`;
}

/**
 * Validates the whole team. `people[0]` is the leader. Repeated registration
 * numbers are flagged on every occurrence after the first.
 */
export function validatePeople(people: PersonInput[]): PersonErrors[] {
  const seen = new Set<string>();
  return people.map((p) => {
    const errors = validatePerson(p);
    const reg = normalizeRegNo(p.registration_number);
    if (reg && !errors.registration_number) {
      if (seen.has(reg)) errors.registration_number = "This registration number is used twice in the form.";
      seen.add(reg);
    }
    return errors;
  });
}

export const hasErrors = (errors: PersonErrors) => Object.keys(errors).length > 0;

/** The shape register RPC expects for one person. */
export function toPayload(p: PersonInput) {
  return {
    full_name: p.full_name.trim(),
    registration_number: normalizeRegNo(p.registration_number),
    year_of_study: Number(p.year_of_study),
    phone: normalizePhone(p.phone),
    department: p.department.trim(),
    college: p.college.trim(),
  };
}
