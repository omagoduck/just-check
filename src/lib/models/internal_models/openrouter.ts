import { Model } from '../types';

export const OpenrouterModels: Model[] = [
    {
        name: 'Mimo V2 Flash',
        id: 'xiaomi/mimo-v2-flash:free',
        provider: 'openrouter',
        contextLength: 128000,
        pricing: {
            input: 0,
            output: 0,
        },
        capabilities: {
            canReason: false,
            supportsToolCalling: true,
            supportsFiles: false,
        },
        inputModalities: ['text'],
        outputModalities: ['text'],
        description: 'A fast, free model provided by Xiaomi via OpenRouter.'
    },
    {
        name: 'GPT-4o Mini',
        id: 'openai/gpt-4o-mini',
        provider: 'openrouter',
        contextLength: 128000,
        pricing: {
            input: 0.15,
            output: 0.6,
        },
        capabilities: {
            canReason: false,
            supportsToolCalling: true,
            supportsFiles: true,
        },
        inputModalities: ['text', 'image'],
        outputModalities: ['text'],
        description: 'OpenAI\'s efficient small model with multimodal capabilities.'
    }
];
