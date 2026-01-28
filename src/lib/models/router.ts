import { ModelProvider } from './types';

export interface ModelRoute {
    provider: ModelProvider;
    id: string;
}

export interface RoutingContext {
    hasImages?: boolean;
    hasFiles?: boolean;
}

/**
 * Smart Router
 * 
 * Resolves a UI Persona ID to a technical model route.
 * This is where the "intelligence" of Lumy's model selection lives.
 */
export function resolveModelRoute(uiModelId: string, context?: RoutingContext): ModelRoute {
    switch (uiModelId) {
        case 'fast':
            // If the user uploads an image, we upgrade from the free Mimo model 
            // to Gemini 2.0 Flash which has native vision support.
            if (context?.hasImages) {
                return { provider: 'google', id: 'gemini-2.0-flash' };
            }
            return { provider: 'openrouter', id: 'z-ai/glm-4.5-air:free' };

        case 'thinker':
            // Logic for the basic 'Thinker' persona
            return { provider: 'openrouter', id: 'nvidia/nemotron-3-nano-30b-a3b:free' };

        case 'pro-thinker':
            // Logic for the advanced 'Pro Thinker' persona
            return { provider: 'google', id: 'gemini-2.5-flash' };

        case 'lumy-sense-1':
            // Focused on creative writing and empathy
            return { provider: 'openrouter', id: 'openai/gpt-oss-120b:free' };

        case 'lumy-itor-1':
            // Specialised technical/coding persona
            return { provider: 'google', id: 'gemini-2.0-flash' };

        default:
            // Fallback for any unknown or unspecified model IDs
            return { provider: 'openrouter', id: 'xiaomi/mimo-v2-flash:free' };
    }
}
