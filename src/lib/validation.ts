/**
 * Validation utilities for Singapore-specific data
 */

/**
 * Validates Singapore postal codes
 * Singapore postal codes are 6-digit numbers with specific ranges
 * Valid ranges: Based on actual Singapore postal districts (01-82)
 * @param postalCode - The postal code string to validate
 * @returns boolean indicating if the postal code is valid
 */
export function isValidSingaporePostalCode(postalCode: string): boolean {
  // Remove any whitespace and check basic format
  const cleaned = postalCode.trim();

  // Must be exactly 6 digits
  if (!/^\d{6}$/.test(cleaned)) {
    return false;
  }

  const code = parseInt(cleaned, 10);

  // Singapore postal codes use specific district ranges
  // Valid first two digits (districts): 01-82
  const firstTwoDigits = Math.floor(code / 10000);

  // Valid Singapore postal districts: 01-82 (83-99 are not used)
  if (firstTwoDigits < 1 || firstTwoDigits > 82) {
    return false;
  }

  // Additional specific range validation
  // Singapore postal codes range approximately from 018956 to 828893
  if (code < 10000 || code > 829999) {
    return false;
  }

  // Additional validation for specific invalid ranges within valid districts
  // District 00 is invalid
  if (firstTwoDigits === 0) {
    return false;
  }

  return true;
}

/**
 * Formats a postal code for display
 * @param postalCode - The postal code to format
 * @returns Formatted postal code string
 */
export function formatPostalCode(postalCode: string): string {
  const cleaned = postalCode.replace(/\D/g, '');
  if (cleaned.length === 6) {
    return cleaned;
  }
  return postalCode;
}

/**
 * Gets user-friendly error message for invalid postal codes
 * @param postalCode - The invalid postal code
 * @returns Error message string
 */
export function getPostalCodeErrorMessage(postalCode: string): string {
  const cleaned = postalCode.trim();

  if (cleaned.length === 0) {
    return 'Please enter a postal code';
  }

  if (!/^\d+$/.test(cleaned)) {
    return 'Postal code must contain only numbers';
  }

  if (cleaned.length !== 6) {
    return 'Singapore postal codes must be exactly 6 digits';
  }

  return 'Please enter a valid Singapore postal code (districts 01-82, e.g., 238895)';
}

/**
 * Validates PSLE scores for Singapore education system
 * PSLE scores range from 4 (highest achievement) to 30 (lowest)
 * @param psleScore - The PSLE score string to validate
 * @returns boolean indicating if the PSLE score is valid
 */
export function isValidPSLEScore(psleScore: string): boolean {
  // Remove any whitespace and check basic format
  const cleaned = psleScore.trim();

  // Must be a valid number
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }

  const score = parseInt(cleaned, 10);

  // PSLE scores must be between 4 and 30 (inclusive)
  if (score < 4 || score > 30) {
    return false;
  }

  return true;
}

/**
 * Gets user-friendly error message for invalid PSLE scores
 * @param psleScore - The invalid PSLE score
 * @returns Error message string
 */
export function getPSLEScoreErrorMessage(psleScore: string): string {
  const cleaned = psleScore.trim();

  if (cleaned.length === 0) {
    return 'Please enter a PSLE score';
  }

  if (!/^\d+$/.test(cleaned)) {
    return 'PSLE score must be a number';
  }

  const score = parseInt(cleaned, 10);

  if (score < 4) {
    return 'PSLE score cannot be lower than 4';
  }

  if (score > 30) {
    return 'PSLE score cannot be higher than 30';
  }

  return 'Please enter a valid PSLE score between 4 and 30';
}