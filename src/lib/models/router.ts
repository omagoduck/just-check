import { ModelProvider, ProviderOptions } from './types';

export interface ModelRoute {
    provider: ModelProvider;
    id: string;
    providerOptions?: ProviderOptions;
}

export interface RoutingContext {
    hasImages?: boolean;
    hasFiles?: boolean;
}

/**
 * Smart Router
 * 
 * Resolves a UI or display model ID to a technical model route.
 * Returns the provider, model ID, and optional metadata (like thinking mode).
 */
export function resolveModelRoute(uiModelId: string, context?: RoutingContext): ModelRoute {
    switch (uiModelId) {
        case 'fast':
            if (context?.hasImages) {
                return {
                    provider: 'openrouter',
                    id: 'moonshotai/kimi-k2.5',
                    providerOptions: { openrouter: { reasoning: { enabled: false } } }
                };
            }
            return {
                provider: 'openrouter',
                id: 'deepseek/deepseek-v3.2',
                providerOptions: { openrouter: { reasoning: { enabled: false } } }
            };

        case 'thinker':
            if (context?.hasImages) {
                return {
                    provider: 'openrouter',
                    id: 'moonshotai/kimi-k2.5',
                    providerOptions: { openrouter: { reasoning: { enabled: true } } }
                };
            }
            return {
                provider: 'openrouter',
                id: 'deepseek/deepseek-v3.2',
                providerOptions: { openrouter: { reasoning: { enabled: true } } }
            };

        case 'pro-thinker':
            return {
                provider: 'openrouter',
                id: 'moonshotai/kimi-k2.6',
                providerOptions: { openrouter: { reasoning: { enabled: true } } }
            };

        case 'lumy-flash-1':
            if (context?.hasImages) {
                return {
                    provider: 'openrouter',
                    id: 'moonshotai/kimi-k2.5',
                    providerOptions: { openrouter: { reasoning: { enabled: false } } }
                };
            }
            return {
                provider: 'openrouter',
                id: 'deepseek/deepseek-v3.2',
                providerOptions: { openrouter: { reasoning: { enabled: false } } }
            };

        case 'lumy-itor-1':
            return {
                provider: 'openrouter',
                id: 'moonshotai/kimi-k2.6',
                providerOptions: { openrouter: { reasoning: { enabled: true } } }
            };

        default:
            // Fallback for any unknown or unspecified model IDs
            return { provider: 'openrouter', id: 'moonshotai/kimi-k2.5' };
    }
}
