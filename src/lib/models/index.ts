import { GoogleModels } from './internal_models/google';
import { OpenrouterModels } from './internal_models/openrouter';
import { Model } from './types';

export const allInternalModels: Model[] = [...GoogleModels, ...OpenrouterModels];

/**
 * Helper to find an internal model by its ID
 */
export function getInternalModelById(id: string): Model | undefined {
    return allInternalModels.find(m => m.id === id);
}

export * from './types';
export * from './internal_models/google';
export * from './internal_models/openrouter';
export * from './ui_models';
export * from './router';
export * from './provider-setup';
