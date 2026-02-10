import { google } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { ModelRoute } from './router';
import { LanguageModel } from 'ai';

/**
 * Centeralized AI Provider Instances
 */

// OpenRouter Setup
export const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Resolves a technical route into a concrete AI SDK LanguageModel instance.
 * This function encapsulates all provider-specific initialization logic.
 */
export function getLanguageModel(route: ModelRoute): LanguageModel {
    const { provider, id } = route;

    switch (provider) {
        case 'google':
            return google(id);

        case 'openrouter':
            return openrouter.chat(id);

        default:
            throw new Error(`The AI Provider "${provider}" is not yet configured in provider-setup.ts`);
    }
}
