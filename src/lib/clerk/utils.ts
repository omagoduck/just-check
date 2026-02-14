/**
 * Clerk-related utility functions.
 */

/**
 * Split a full name into first name and last name.
 * First word becomes firstName, all remaining words become lastName.
 * Returns null if the name has fewer than 2 words.
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } | null {
  const trimmed = fullName.trim()
  const parts = trimmed.split(/\s+/)

  if (parts.length < 2) {
    return null
  }

  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ')

  return { firstName, lastName }
}
