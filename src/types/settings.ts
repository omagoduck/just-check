/**
 * Privacy Settings
 */
export interface PrivacySettings {
  /** Share anonymous data with partners */
  shareAnonymousData: boolean;
  /** Share diagnostic data to help improve app performance */
  shareDiagnostics: boolean;
}

/**
 * AI Customization Settings
 */
export interface AICustomizationSettings {
  /** What you want to call the AI */
  aiNickname: string;
  /** What AI will call you */
  userNickname: string;
  /** Your profession (e.g., Software Engineer, Doctor, Student) */
  userProfession: string;
  /** Topics you're most interested in (comma-separated or text) */
  preferredTopics: string;
  /** Topics you prefer to avoid (comma-separated or text) */
  avoidTopics: string;
  /** More information about yourself */
  moreAboutYou: string;
  /** AI personality tone */
  aiTone: 'default' | 'friendly' | 'warmer' | 'professional' | 'gen-z';
  /** Response length preference */
  responseLength: 'default' | 'concise' | 'detail';
  /** Custom instructions for AI behavior */
  customInstructions: string;
}

/**
 * Complete User Settings
 */
export interface UserSettings {
  privacySettings: PrivacySettings;
  aiCustomizationSettings: AICustomizationSettings;
}

/**
 * Default privacy settings
 */
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  shareAnonymousData: false,
  shareDiagnostics: false,
};

/**
 * Default AI customization settings
 */
export const DEFAULT_AI_CUSTOMIZATION_SETTINGS: AICustomizationSettings = {
  aiNickname: '',
  userNickname: '',
  userProfession: '',
  preferredTopics: '',
  avoidTopics: '',
  moreAboutYou: '',
  aiTone: 'default',
  responseLength: 'default',
  customInstructions: '',
};

/**
 * Default user settings
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  privacySettings: DEFAULT_PRIVACY_SETTINGS,
  aiCustomizationSettings: DEFAULT_AI_CUSTOMIZATION_SETTINGS,
};

/**
 * Partial settings updates (for saving specific sections)
 */
export type PartialUserSettings = Partial<Pick<UserSettings, 'privacySettings' | 'aiCustomizationSettings'>>;

/**
 * Settings API response
 */
export interface UserSettingsResponse {
  id: string;
  clerk_user_id: string;
  settings_data: UserSettings;
  created_at: string;
  updated_at: string;
}
