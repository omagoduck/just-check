/**
 * Utility functions for proper age calculation and validation
 */

/**
 * Calculate age in years from a date of birth
 * This properly accounts for whether the birthday has occurred this year
 * @param dateOfBirth - Date of birth as string or Date object
 * @returns age in years
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  
  // Validate date
  if (isNaN(dob.getTime()) || dob > today) {
    return -1 // Invalid date or future date
  }
  
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  
  // If birthday hasn't occurred this year yet, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  
  return age
}

/**
 * Validate if age is within acceptable range
 * @param dateOfBirth - Date of birth as string
 * @param minAge - Minimum allowed age (default: 1)
 * @param maxAge - Maximum allowed age (default: 150)
 * @returns Object with validation result and error message
 */
export function validateAge(
  dateOfBirth: string,
  minAge: number = 1,
  maxAge: number = 150
): { isValid: boolean; error?: string; calculatedAge?: number } {
  const age = calculateAge(dateOfBirth)
  
  if (age < 0) {
    return { isValid: false, error: 'Please enter a valid date of birth' }
  }
  
  if (age < minAge) {
    return { 
      isValid: false, 
      error: `Age must be at least ${minAge} year${minAge !== 1 ? 's' : ''}` 
    }
  }
  
  if (age > maxAge) {
    return { 
      isValid: false, 
      error: `Age cannot exceed ${maxAge} years` 
    }
  }
  
  return { isValid: true, calculatedAge: age }
}

/**
 * Get a human-readable age range description
 * @param minAge - Minimum age
 * @param maxAge - Maximum age
 * @returns Formatted string describing the age range
 */
export function getAgeRangeDescription(minAge: number = 1, maxAge: number = 150): string {
  if (minAge === 1 && maxAge === 150) {
    return 'ages 1 to 150'
  }
  return `ages ${minAge} to ${maxAge}`
}