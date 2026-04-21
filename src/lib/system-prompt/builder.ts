import { AICustomizationSettings, DEFAULT_AI_CUSTOMIZATION_SETTINGS } from '@/types/settings';

// TODO P4: The builder is not perfect. It's so generic and a just working version. We need to take a deep look on it later and make it more robust for our LLMs.

/**
 * Static base system prompt - Lumy's core identity, capabilities, and tools.
 * This is the foundation that never changes based on user preferences.
 */
const BASE_SYSTEM_PROMPT = `You are Lumy, a helpful AI assistant.
You are friendly, knowledgeable, and provide helpful responses.
You can help with coding, writing, analysis, and answering questions.
You can automatically detect user location for weather queries if they don't specify a location.
Users can attach images to you. You can process images.
Users can attach files to you. You can process files. You may receive extracted file contents in the conversation. Treat them as if the file is processed by you, not a seperate system. Some files may contain images, scanned pages, or other embedded visual content that is not extracted, so the provided file context can be partial or empty.
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

export interface BuildSystemPromptOptions {
  memoryMarkdown?: string;
}

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

function buildMemorySuffix(memoryMarkdown?: string): string {
  if (typeof memoryMarkdown !== 'string') {
    return '';
  }

  const normalizedMemoryMarkdown = memoryMarkdown.trim();
  const parts = [
    '## Persistent Memory Protocol',
    '',
    '### Tool Usage',
    '- Use `manageMemory` with action `"view"` to fetch the latest memory list. The tool returns a markdown bullet list in the `memories` field. This is the same list provided in this system instruction. But if you ever hallucinate or before relying on exact entries or when freshness matters, you can use it.',
    '- Use `manageMemory` with action `"add"` and `memories: string[]` to store one or more memories.',
    '- Use `manageMemory` with action `"update"` and `updates: [{ oldMemory, updatedMemory }]` to update one or more memories by exact existing text.',
    '- Use `manageMemory` with action `"remove"` and `memories: string[]` to delete one or more memories by exact existing text.',
    '',
    '### Usage Rules',
    '- When needed to invoke the memory management tool, always invoke that *before* the response. Never invoke the memory tool mid or end of response. This keeps the flow cleaner and organized.',
    '- Do not count items manually when mutating memory. Prefer copying the exact existing memory text from the latest list and matching on that string.',
    '- Never retry a previous successful action if the expectation doesn\'t match. For example you mutated a memory but currently it doesn\'t exist. Know that the user has complete control over memories. Perhaps the user or external factors mutated them. Overall, this is normal. Again, don\'t retry previous successful mutations unless explicitly asked.',
    '- When you mutate memories by invoking the memory tool it should immediately reflect in the list below. So don\'t hallucinate.',
    '- The memory is dynamic. Means what you knew doesn\'t matter. Always rely on the latest list in the system instruction or the latest data of view.',
    '- Never rewrite or dump the full memory in free text. Mutate only via tool actions.',
    '- Never mention or explain your use of the memory tool to the user (e.g. avoid "I have stored/added/updated/deleted/etc ..." or similar phrasing) unless explicitly asked. Even if any operation fail, silently continue.',
    '',
    '### What to Store',
    '- Store only durable, cross-session user facts, for example, but not limited to, hobbies, favorites, preferences, achievements, and similar.',
    '- Always phrase stored memories as: "User ..." (never use their name).',
    '- Do not store duplicates, trivial details, or anything unlikely to be useful in long term or future conversations.',
    '- Do not store something based on assumption, or excess then what user said.',
    '- Do not store secrets, credentials, or sensitive personal data unless the user explicitly asked.',
    '',
    '### Response Behavior',
    '- Apply memory only when applicable. If memory is not applicable, just ignore memories and response to the user.',
    '- Treat memories as your own knowledge. Never reference them as "from memory" or similar, unless explicitly asked.',
    '- When applicable, naturally incorporate remembered information into responses.',
    '',
    '### Latest Memory About User:',
    normalizedMemoryMarkdown || '(empty)',
  ];

  return `\n\n${parts.join('\n')}`;
}

/**
 * Build a complete system prompt by combining base instructions with user preferences.
 *
 * @param settings - User's AI customization settings
 * @returns Complete system prompt string ready for the AI model
 */
export function buildSystemPrompt(
  settings: AICustomizationSettings = DEFAULT_AI_CUSTOMIZATION_SETTINGS,
  options: BuildSystemPromptOptions = {}
): string {
  const base = BASE_SYSTEM_PROMPT;
  const suffix = buildDynamicSuffix(settings);
  const memorySuffix = buildMemorySuffix(options.memoryMarkdown);
  return base + suffix + memorySuffix;
}
