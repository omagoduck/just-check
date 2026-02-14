/**
 * Profile Type Definitions
 * Defines the shape of user profile data stored in Supabase
 * and the request structure for profile updates.
 */

/**
 * Represents a user profile in the database
 * Maps to the 'profiles' table in Supabase
 */
export interface Profile {
  /** Primary key (UUID) */
  id: string;
  /** Clerk user ID - foreign key linking to Clerk authentication */
  clerk_user_id: string;
  /** User's email address (denormalized from Clerk for quick access) */
  email: string;
  /** User's full name - can be null if not set */
  full_name: string | null;
  /** User's preferred nickname/display name - can be null if not set */
  nickname: string | null;
  /** Date of birth in YYYY-MM-DD format - can be null if not set */
  date_of_birth: string | null;
  /** URL to user's avatar image - can be null if not set */
  avatar_url: string | null;
  /** Timestamp when profile was created */
  created_at: string;
  /** Timestamp when profile was last updated */
  updated_at: string;
  /** Timestamp when profile was soft-deleted - null if not deleted */
  deleted_at: string | null;
}

/**
 * Request body for updating a profile
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateProfileRequest {
  /** Updated full name */
  full_name?: string;
  /** Updated nickname */
  nickname?: string;
  /** Updated date of birth (YYYY-MM-DD format) */
  date_of_birth?: string;
  /** Updated avatar image URL */
  avatar_url?: string;
}
