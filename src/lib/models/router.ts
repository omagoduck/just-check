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
 * Resolves a UI or display model ID to a technical model route.
 */
export function resolveModelRoute(uiModelId: string, context?: RoutingContext): ModelRoute {
    switch (uiModelId) {
        case 'fast':
            if (context?.hasImages) {
                return { provider: 'openrouter', id: 'mistralai/mistral-large-2512' };
            }
            return { provider: 'openrouter', id: 'deepseek/deepseek-v3.2' };

        case 'thinker':
            if (context?.hasImages) {
                return { provider: 'openrouter', id: 'qwen/qwen3.5-397b-a17b' };
            }
            return { provider: 'openrouter', id: 'deepseek/deepseek-v3.2' };

        case 'pro-thinker':
            return { provider: 'openrouter', id: 'moonshotai/kimi-k2.5' };

        case 'lumy-sense-1':
            return { provider: 'openrouter', id: 'mistralai/mistral-large-2512' };

        case 'lumy-itor-1':
            return { provider: 'openrouter', id: 'moonshotai/kimi-k2.5' };

        default:
            // Fallback for any unknown or unspecified model IDs
            return { provider: 'openrouter', id: 'mistralai/mistral-large-2512' };
    }
}
