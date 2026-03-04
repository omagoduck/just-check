/**
 * Password Validation Utility
 * Shared validation logic for password strength requirements.
 * Used by both frontend (account page) and backend (API routes).
 */

export interface PasswordRequirement {
  met: boolean;
  label: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  requirements: PasswordRequirement[];
}

/**
 * Minimum password length requirement
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Validates password strength against all requirements
 * @param password - The password to validate
 * @returns Validation result with individual requirement status
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const requirements: PasswordRequirement[] = [
    { met: password.length >= MIN_PASSWORD_LENGTH, label: `At least ${MIN_PASSWORD_LENGTH} characters` },
    { met: /[A-Z]/.test(password), label: 'At least one uppercase letter' },
    { met: /[a-z]/.test(password), label: 'At least one lowercase letter' },
    { met: /\d/.test(password), label: 'At least one number' },
    { met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), label: 'At least one special character' },
  ];

  const isValid = requirements.every(r => r.met);
  return { isValid, requirements };
}

/**
 * Validates password and returns the first error message if invalid
 * @param password - The password to validate
 * @returns Error message if invalid, null if valid
 */
export function getPasswordValidationError(password: string): string | null {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character';
  }

  return null;
}

/**
 * Checks if two passwords match
 * @param password - The primary password
 * @param confirmPassword - The confirmation password
 * @returns True if passwords match
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}
