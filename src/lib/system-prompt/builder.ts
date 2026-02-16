import { AICustomizationSettings, DEFAULT_AI_CUSTOMIZATION_SETTINGS } from '@/types/settings';

// TODO P4: The builder is not perfect. It's so generic and a just working version. We need to take a deep look on it later and make it more robust for our LLMs.

/**
 * Static base system prompt - Lumy's core identity, capabilities, and tools.
 * This is the foundation that never changes based on user preferences.
 */
const BASE_SYSTEM_PROMPT = `You are Lumy, a helpful AI assistant.
You are friendly, knowledgeable, and provide helpful responses.
You can help with coding, writing, analysis, and answering questions.
You have access to tools that can provide:
- getTime: Current date and time
- getWeather: Current weather and forecast for any location
You can automatically detect user location for weather queries if they don't specify a location.
Always be respectful and helpful in your responses.`;

/**
 * Tone modifiers to adjust AI personality based on user preference
 */
const TONE_MODIFIERS = {
  default: '',
  friendly: 'Be warm, approachable, and use a conversational tone. Show enthusiasm in your responses.',
  warmer: 'Be especially empathetic and supportive. Acknowledge feelings and provide comfort when appropriate.',
  professional: 'Maintain a formal, precise, and business-like tone. Avoid casual language.',
  'gen-z': 'Use modern, casual language and occasional slang appropriate for Gen-Z. Be trendy but not cringe. Use short sentences and emojis sparingly if natural.',
} as const;

/**
 * Response length modifiers
 */
const LENGTH_MODIFIERS = {
  default: '',
  concise: 'Keep responses brief and to the point. Prioritize clarity and avoid unnecessary elaboration.',
  detail: 'Provide thorough, detailed explanations. Include examples and cover edge cases when relevant.',
} as const;

/**
 * Build the complete dynamic suffix based on user preferences.
 * This section contains all user-specific instructions that get appended to the base prompt.
 */
function buildDynamicSuffix(settings: AICustomizationSettings): string {
  const {
    aiNickname, // What user likes to call the AI
    userNickname,
    userProfession,
    preferredTopics,
    avoidTopics,
    moreAboutYou,
    aiTone = 'default',
    responseLength = 'default',
    customInstructions,
  } = settings;

  const parts: string[] = [];

  // How user refers to the AI
  if (aiNickname?.trim()) {
    parts.push(`The user likes to call you "${aiNickname.trim()}". Respond positively when they use this nickname.`);
  }

  // Personalization
  if (userNickname?.trim()) {
    parts.push(`The user's name is ${userNickname.trim()}. Address them by name when appropriate.`);
  }

  if (userProfession?.trim()) {
    parts.push(`The user is a ${userProfession.trim()}. Tailor explanations to their professional background when helpful.`);
  }

  if (preferredTopics?.trim()) {
    parts.push(`The user has expressed interest in: ${preferredTopics.trim()}. Feel free to reference these topics when relevant to the conversation.`);
  }

  if (moreAboutYou?.trim()) {
    parts.push(`Additional context: ${moreAboutYou.trim()}. Use this to better understand the user's perspective and needs.`);
  }

  // Topics to avoid
  if (avoidTopics?.trim()) {
    parts.push(`Avoid these topics unless explicitly asked: ${avoidTopics.trim()}.`);
  }

  // Tone modifier
  const toneModifier = TONE_MODIFIERS[aiTone];
  if (toneModifier) {
    parts.push(toneModifier);
  }

  // Response length
  const lengthModifier = LENGTH_MODIFIERS[responseLength];
  if (lengthModifier) {
    parts.push(lengthModifier);
  }

  // Custom instructions (highest priority)
  if (customInstructions?.trim()) {
    parts.push(`Additional Instructions:\n${customInstructions.trim()}`);
  }

  return parts.length > 0 ? '\n\n' + parts.join('\n\n') : '';
}

/**
 * Build a complete system prompt by combining base instructions with user preferences.
 *
 * @param settings - User's AI customization settings
 * @returns Complete system prompt string ready for the AI model
 */
export function buildSystemPrompt(settings: AICustomizationSettings = DEFAULT_AI_CUSTOMIZATION_SETTINGS): string {
  const base = BASE_SYSTEM_PROMPT;
  const suffix = buildDynamicSuffix(settings);
  return base + suffix;
}
