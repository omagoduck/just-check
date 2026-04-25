import { Model } from '../types';

export const OpenrouterModels: Model[] = [
    {
        name: 'DeepSeek V3.2',
        id: 'deepseek/deepseek-v3.2',
        provider: 'openrouter',
        pricing: {
            input: 0.4,
            output: 0.7,
        },
    },
    {
        name: 'Kimi K2.5',
        id: 'moonshotai/kimi-k2.5',
        provider: 'openrouter',
        pricing: {
            input: 0.75,
            output: 3,
        },
    },
    {
        name: 'Kimi K2.6',
        id: 'moonshotai/kimi-k2.6',
        provider: 'openrouter',
        pricing: {
            input: 1,
            output: 5,
        },
    },
];
