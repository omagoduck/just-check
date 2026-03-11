import { Model } from '../types';

export const OpenrouterModels: Model[] = [
// Fast persona with images / Lumy Sense 1 / Default
    {
        name: 'Mistral Large 3',
        id: 'mistralai/mistral-large-2512',
        provider: 'openrouter',
        pricing: {
            input: 2,
            output: 6,
        },
        description: 'Model for Fast with images, Lumy Sense 1, and fallback (Mistral Large).'
    },
    // Fast persona (no images)
    {
        name: 'DeepSeek V3.2',
        id: 'deepseek/deepseek-v3.2',
        provider: 'openrouter',
        pricing: {
            input: 0.27,
            output: 1.10,
        },
        description: 'Model for Fast persona (DeepSeek).'
    },
    // Thinker with images
    {
        name: 'Qwen 3.5 397B A17B',
        id: 'qwen/qwen3.5-397b-a17b',
        provider: 'openrouter',
        pricing: {
            input: 0.80,
            output: 2.40,
        },
        description: 'Model for Thinker with images (Qwen).'
    },
    // Pro Thinker / Lumy Itor 1
    {
        name: 'Kimi K2.5',
        id: 'moonshotai/kimi-k2.5',
        provider: 'openrouter',
        pricing: {
            input: 0.50,
            output: 1.50,
        },
        description: 'Model for Pro Thinker and Lumy Itor 1 (Moonshot AI).'
    },
];
