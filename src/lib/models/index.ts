import { GoogleModels } from './internal_models/google';
import { OpenrouterModels } from './internal_models/openrouter';
import { Model, ModelProvider, ProviderOptions, UIModelMeta } from './types';

export const allInternalModels: Model[] = [...GoogleModels, ...OpenrouterModels];



/**
 * Result of resolving a model by provider and ID.
 * Contains the resolved model ID, provider, and any provider-specific options.
 */
export interface ResolvedModel {
    /** The resolved model ID to use with the provider (e.g., without :thinking suffix) */
    id: string;
    /** The model provider */
    provider: ModelProvider;
    /** Provider-specific options for the AI SDK (e.g., for thinking mode) */
    providerMetadata?: ProviderOptions;
}

/**
 * Find a model by provider and ID, resolving any provider metadata.
 * 
 * This function:
 * 1. Looks up the model in the internal registry by provider + model ID
 * 2. Strips any suffixes (like :thinking) from the model ID
 * 3. Resolves provider metadata based on model definition or meta parameter
 * 
 * @param provider - The model provider (e.g., 'openrouter', 'google')
 * @param modelId - The model ID from the router (may include suffixes like :thinking)
 * @param meta - Optional metadata for the resolution (e.g., { thinking: true })
 * @returns ResolvedModel with id, provider, and providerMetadata
 */
export function findModelByProviderAndId(
    provider: ModelProvider, 
    modelId: string,
    meta?: UIModelMeta
): ResolvedModel {
    
    // Find the model in the internal registry
    const model = allInternalModels.find(
        m => m.provider === provider && m.id === modelId
    );
    
    if (!model) {
        // If model not found, return a fallback with the original ID
        // This shouldn't happen in normal operation but provides safety
        console.warn(`Model not found: ${provider}/${modelId}, using fallback`);
        return {
            id: modelId,
            provider,
            providerMetadata: undefined
        };
    }
    
    // If model has explicit providerMetadata, use that
    if (model.providerMetadata) {
        return {
            id: model.id,
            provider: model.provider,
            providerMetadata: model.providerMetadata
        };
    }
    
    // Otherwise, resolve provider metadata based on meta parameter
    const providerMetadata = resolveProviderMeta(provider, meta);
    
    return {
        id: model.id,
        provider: model.provider,
        providerMetadata
    };
}

/**
 * Resolve provider-specific options based on metadata.
 * 
 * @param provider - The model provider
 * @param meta - Optional metadata from UI model resolver
 * @returns Provider options if metadata requires them, undefined otherwise
 */
function resolveProviderMeta(provider: ModelProvider, meta?: UIModelMeta): ProviderOptions | undefined {
    if (!meta) {
        return undefined;
    }
    
    // Build provider options with provider name as key
    const providerOptions: ProviderOptions = {};
    
    if (meta.thinking) {
        // Enable thinking/reasoning mode for OpenRouter
        // Format: { openrouter: { reasoning: { enabled: true } } }
        if (provider === 'openrouter') {
            providerOptions.openrouter = {
                reasoning: { enabled: true }
            };
        }
        // Add other providers as needed
    }
    
    return Object.keys(providerOptions).length > 0 ? providerOptions : undefined;
}

export * from './types';
export * from './internal_models/google';
export * from './internal_models/openrouter';
export * from './ui_models';
export * from './router';
export * from './provider-setup';
