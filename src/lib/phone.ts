/** Bangladeshi phone numbers as stored/entered here: exactly 11 digits, no spaces/dashes/+. */
export const PHONE_REGEX = /^\d{11}$/;

export const PHONE_VALIDATION_MESSAGE =
  "Phone number must be exactly 11 digits, e.g. 01568254672 (no spaces, dashes, or +).";

export function isValidPhone(value: string): boolean {
  return PHONE_REGEX.test(value);
}

/** Strips everything but digits and caps at 11, for live input filtering. */
export function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}
